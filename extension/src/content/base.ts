/**
 * Shared utilities for every content script:
 *   - subscribe to settings from chrome.storage.sync
 *   - debounced reporter that batches block events to the background worker
 *   - a tiny MutationObserver helper that re-runs a callback on DOM changes
 */

import {
  DEFAULT_SETTINGS,
  FocusSettings,
  pullSettingsFromChromeSync,
  REELKILL_STORAGE,
} from '../../../src/lib/storage';
import { isScheduleActive } from '../../../src/lib/schedule';
import { isWhitelisted } from '../shared/whitelist';

const SETTINGS_KEY = REELKILL_STORAGE.settingsKey;

export interface ContentRuntime {
  getSettings(): FocusSettings;
  isActive(): boolean;
  reportBlock(platform: string, count?: number): void;
  observe(target: Node, callback: () => void): MutationObserver;
}

let cachedSettings: FocusSettings = DEFAULT_SETTINGS;

function mergeSettings(value: Partial<FocusSettings> | undefined): FocusSettings {
  if (!value) return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    rules: { ...DEFAULT_SETTINGS.rules, ...(value.rules ?? {}) },
    schedule: { ...DEFAULT_SETTINGS.schedule, ...(value.schedule ?? {}) },
    whitelist: value.whitelist ?? DEFAULT_SETTINGS.whitelist,
  };
}

let pendingByPlatform = new Map<string, number>();
let flushHandle: number | null = null;

function flushReports() {
  flushHandle = null;
  if (pendingByPlatform.size === 0) return;
  const payload = pendingByPlatform;
  pendingByPlatform = new Map();
  for (const [platform, count] of payload) {
    try {
      chrome.runtime.sendMessage({ type: 'block:reported', platform, count });
    } catch {
      // Service worker may have been recycled; ignore.
    }
  }
}

export function createContentRuntime(): ContentRuntime {
  // Initial fetch (migrates unscroll.* / focusshield.* → reelkill.* when needed).
  pullSettingsFromChromeSync()
    .then((s) => {
      cachedSettings = s;
    })
    .catch(() => {});

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes[SETTINGS_KEY]) return;
    cachedSettings = mergeSettings(changes[SETTINGS_KEY].newValue as Partial<FocusSettings>);
  });

  return {
    getSettings: () => cachedSettings,
    isActive: () => {
      if (isWhitelisted(window.location.href, cachedSettings.whitelist)) return false;
      return cachedSettings.strictMode || isScheduleActive(cachedSettings);
    },
    reportBlock: (platform, count = 1) => {
      pendingByPlatform.set(platform, (pendingByPlatform.get(platform) ?? 0) + count);
      if (flushHandle == null) {
        flushHandle = window.setTimeout(flushReports, 750);
      }
    },
    observe: (target, callback) => {
      // Coalesce mutation bursts so aggressive content-script edits
      // (e.g. removing nodes that React then re-adds) don't melt the CPU.
      let scheduled = false;
      const fire = () => {
        scheduled = false;
        callback();
      };
      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(fire);
      });
      observer.observe(target, { childList: true, subtree: true });
      return observer;
    },
  };
}

export function injectStyles(id: string, css: string) {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  (document.head ?? document.documentElement).appendChild(style);
}
