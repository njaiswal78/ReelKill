/**
 * Background service worker.
 *
 * Responsibilities:
 *   - Persist default settings on install / upgrade.
 *   - Receive `block:reported` from content scripts; aggregate stats in chrome.storage.local.
 *   - Toggle toolbar icon tint and badge: when protection is off (Strict Mode off
 *     and schedule inactive), muted icon and no badge count; when on, show count.
 * Schedule is evaluated in content scripts — never flips Strict Mode here.
 */

import {
  DEFAULT_SETTINGS,
  FocusSettings,
  FocusStats,
  pullSettingsFromChromeSync,
  pullStatsFromChromeLocal,
  REELKILL_STORAGE,
  localDateKey,
} from '../../src/lib/storage';
import { isScheduleActive } from '../../src/lib/schedule';

/** Keeps toolbar icon aligned with strict mode + schedule (clock moves without sync writes). */
const ICON_ALARM = 'reelkill-toolbar-icon';

const ICON_PATH_ACTIVE: Record<number, string> = {
  16: 'icons/icon16.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png',
};

const ICON_PATH_OFF: Record<number, string> = {
  16: 'icons/icon16-off.png',
  48: 'icons/icon48-off.png',
  128: 'icons/icon128-off.png',
};

function globallyProtected(settings: FocusSettings): boolean {
  return settings.strictMode || isScheduleActive(settings);
}

interface ExtensionMessage {
  type: string;
  [key: string]: unknown;
}

async function setSettings(value: FocusSettings): Promise<void> {
  await chrome.storage.sync.set({ [REELKILL_STORAGE.settingsKey]: value });
}

async function setStats(value: FocusStats): Promise<void> {
  await chrome.storage.local.set({ [REELKILL_STORAGE.statsKey]: value });
}

async function applyBadge(stats: FocusStats, settings: FocusSettings): Promise<void> {
  if (!globallyProtected(settings)) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  const total = stats.totalBlocked;
  const text = total > 9999 ? '9k+' : total > 999 ? `${Math.floor(total / 1000)}k` : String(total);
  await chrome.action.setBadgeText({ text: total > 0 ? text : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
}

async function refreshToolbarIcon(settings: FocusSettings): Promise<void> {
  const path = globallyProtected(settings) ? ICON_PATH_ACTIVE : ICON_PATH_OFF;
  try {
    await chrome.action.setIcon({ path });
  } catch {
    /* icon files missing until build; ignore */
  }
}

async function syncToolbarPresentation(): Promise<void> {
  const [settings, stats] = await Promise.all([
    pullSettingsFromChromeSync(),
    pullStatsFromChromeLocal(),
  ]);
  await refreshToolbarIcon(settings);
  await applyBadge(stats, settings);
}

async function ensureIconAlarm(): Promise<void> {
  const prev = await chrome.alarms.get(ICON_ALARM);
  if (!prev) await chrome.alarms.create(ICON_ALARM, { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ICON_ALARM) return;
  void syncToolbarPresentation();
});

chrome.storage.sync.onChanged.addListener((changes) => {
  if (!changes[REELKILL_STORAGE.settingsKey]) return;
  void syncToolbarPresentation();
});

async function handleBlockReport(
  platform: string,
  count: number,
): Promise<void> {
  const settings = await pullSettingsFromChromeSync();
  const stats = await pullStatsFromChromeLocal();
  const safeCount = Math.max(1, Math.min(50, Math.floor(count) || 1));
  const today = localDateKey();
  const next: FocusStats = {
    ...stats,
    totalBlocked: stats.totalBlocked + safeCount,
    perPlatform: {
      ...stats.perPlatform,
      [platform]: (stats.perPlatform[platform] ?? 0) + safeCount,
    },
    perDay: {
      ...stats.perDay,
      [today]: (stats.perDay[today] ?? 0) + safeCount,
    },
    minutesSaved: Math.min(99999, stats.minutesSaved + Math.round((safeCount * 12) / 60)),
  };
  await setStats(next);
  await applyBadge(next, settings);
}

chrome.runtime.onInstalled.addListener(async () => {
  await pullSettingsFromChromeSync();

  const sk = REELKILL_STORAGE.settingsKey;
  const out = await chrome.storage.sync.get(sk);
  if (!out[sk]) {
    await setSettings(DEFAULT_SETTINGS);
  }

  await pullStatsFromChromeLocal();

  const tk = REELKILL_STORAGE.statsKey;
  const st = REELKILL_STORAGE.legacyStatsKeys;
  const sout = await chrome.storage.local.get([tk, ...st] as string[]);
  const hadCurrent = !!(sout[tk] && typeof sout[tk] === 'object');
  let hadLegacy = false;
  for (const lk of st) {
    if (sout[lk]) {
      hadLegacy = true;
      break;
    }
  }

  if (!hadCurrent && !hadLegacy) {
    const blank: FocusStats = {
      totalBlocked: 0,
      perPlatform: {},
      perDay: {},
      minutesSaved: 0,
    };
    await setStats(blank);
  }

  await syncToolbarPresentation();
  await ensureIconAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await syncToolbarPresentation();
  await ensureIconAlarm();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    if (message.type === 'block:reported') {
      const platform = typeof message.platform === 'string' ? message.platform : 'other';
      const count = typeof message.count === 'number' ? message.count : 1;
      await handleBlockReport(platform, count);
      sendResponse({ ok: true });
      return;
    }
    if (message.type === 'settings:get') {
      const settings = await pullSettingsFromChromeSync();
      sendResponse({ settings, scheduleActive: isScheduleActive(settings) });
      return;
    }
    if (message.type === 'settings:updated') {
      const s = message.settings;
      const stats = await pullStatsFromChromeLocal();
      let settingsForUi: FocusSettings;
      if (s && typeof s === 'object' && typeof (s as FocusSettings).strictMode === 'boolean') {
        settingsForUi = s as FocusSettings;
        await refreshToolbarIcon(settingsForUi);
      } else {
        settingsForUi = await pullSettingsFromChromeSync();
        await refreshToolbarIcon(settingsForUi);
      }
      await applyBadge(stats, settingsForUi);
      sendResponse({ ok: true });
      return;
    }
    if (message.type === 'stats:reset') {
      const blank: FocusStats = {
        totalBlocked: 0,
        perPlatform: {},
        perDay: {},
        minutesSaved: 0,
      };
      const settings = await pullSettingsFromChromeSync();
      await setStats(blank);
      await applyBadge(blank, settings);
      sendResponse({ ok: true });
      return;
    }
    sendResponse({ ok: false, error: 'unknown message' });
  })();
  return true;
});
