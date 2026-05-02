/**
 * Cross-environment storage abstraction.
 *
 * In a Chrome extension we persist settings via chrome.storage.sync (settings)
 * and chrome.storage.local (live stats updated by the service worker).
 *
 * On the public Cloudflare Pages dashboard we degrade to localStorage so the
 * UI stays interactive even without the runtime extension APIs.
 */

export interface FocusSettings {
  strictMode: boolean;
  whitelist: string[];
  rules: {
    youtubeShorts: boolean;
    instagramReels: boolean;
    tiktokFyp: boolean;
    facebookReels: boolean;
    universal916: boolean;
  };
  schedule: {
    enabled: boolean;
    days: number[]; // 0=Sun ... 6=Sat
    startMinutes: number; // minutes since midnight
    endMinutes: number;
  };
  /** Target number of short-form videos to block in a rolling 7-day window. */
  weeklyGoal: number;
}

export interface FocusStats {
  totalBlocked: number;
  perPlatform: Record<string, number>;
  perDay: Record<string, number>; // YYYY-MM-DD (browser-local) -> count
  minutesSaved: number;
}

export const DEFAULT_SETTINGS: FocusSettings = {
  strictMode: true,
  whitelist: ['educational-resource.org', 'vimeo.com/portfolios'],
  rules: {
    youtubeShorts: true,
    instagramReels: true,
    tiktokFyp: true,
    facebookReels: true,
    universal916: true,
  },
  schedule: {
    enabled: true,
    days: [1, 2, 3, 4, 5],
    startMinutes: 9 * 60,
    endMinutes: 17 * 60,
  },
  weeklyGoal: 500,
};

export const DEFAULT_STATS: FocusStats = {
  totalBlocked: 1428,
  perPlatform: { youtube: 612, instagram: 488, tiktok: 261, other: 67 },
  perDay: {},
  minutesSaved: 42,
};

export const REELKILL_STORAGE = {
  settingsKey: 'reelkill.settings.v1',
  statsKey: 'reelkill.stats.v1',
  /** Previous product names → migrate once into reelkill.keys */
  legacySettingsKeys: ['unscroll.settings.v1', 'focusshield.settings.v1'] as const,
  legacyStatsKeys: ['unscroll.stats.v1', 'focusshield.stats.v1'] as const,
} as const;

const SETTINGS_KEY = REELKILL_STORAGE.settingsKey;
const STATS_KEY = REELKILL_STORAGE.statsKey;

type Listener<T> = (value: T) => void;

interface StorageAdapter {
  getSettings(): Promise<FocusSettings>;
  setSettings(value: FocusSettings): Promise<void>;
  getStats(): Promise<FocusStats>;
  setStats(value: FocusStats): Promise<void>;
  onSettingsChanged(listener: Listener<FocusSettings>): () => void;
  onStatsChanged(listener: Listener<FocusStats>): () => void;
}

const isExtensionContext = (): boolean => {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.sync &&
    !!chrome.runtime?.id
  );
};

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

function mergeStats(value: Partial<FocusStats> | undefined): FocusStats {
  if (!value) return { ...DEFAULT_STATS };
  return {
    ...DEFAULT_STATS,
    ...value,
    perPlatform: { ...DEFAULT_STATS.perPlatform, ...(value.perPlatform ?? {}) },
    perDay: { ...(value.perDay ?? {}) },
  };
}

function nonemptyObject(o: unknown): o is Record<string, unknown> {
  return !!(o && typeof o === 'object' && Object.keys(o as object).length > 0);
}

/** Migrate from unscroll.* / focusshield.* into reelkill.settings.v1 when needed. */
export async function pullSettingsFromChromeSync(): Promise<FocusSettings> {
  const { settingsKey, legacySettingsKeys } = REELKILL_STORAGE;
  const keys = [settingsKey, ...legacySettingsKeys] as string[];
  const out = await chrome.storage.sync.get(keys);

  const curr = out[settingsKey] as Partial<FocusSettings> | undefined;
  const hadCurrent = nonemptyObject(curr);

  let source: Partial<FocusSettings> | undefined = hadCurrent ? curr : undefined;
  if (!hadCurrent) {
    for (const lk of legacySettingsKeys) {
      const leg = out[lk] as Partial<FocusSettings> | undefined;
      if (nonemptyObject(leg)) {
        source = leg;
        break;
      }
    }
  }

  const merged = mergeSettings(source);

  if (!hadCurrent && source) await chrome.storage.sync.set({ [settingsKey]: merged });

  const stray = legacySettingsKeys.filter((k) => k in out);
  if (stray.length) await chrome.storage.sync.remove(stray);

  return merged;
}

/** Migrate stats from legacy keys into reelkill.stats.v1 when needed. */
export async function pullStatsFromChromeLocal(): Promise<FocusStats> {
  const { statsKey, legacyStatsKeys } = REELKILL_STORAGE;
  const keys = [statsKey, ...legacyStatsKeys] as string[];
  const out = await chrome.storage.local.get(keys);

  const curr = out[statsKey] as Partial<FocusStats> | undefined;
  const hadCurrent = nonemptyObject(curr);

  let source: Partial<FocusStats> | undefined = hadCurrent ? curr : undefined;
  if (!hadCurrent) {
    for (const lk of legacyStatsKeys) {
      const leg = out[lk] as Partial<FocusStats> | undefined;
      if (nonemptyObject(leg)) {
        source = leg;
        break;
      }
    }
  }

  const merged = mergeStats(source);

  if (!hadCurrent && source) await chrome.storage.local.set({ [statsKey]: merged });

  const stray = legacyStatsKeys.filter((k) => k in out);
  if (stray.length) await chrome.storage.local.remove(stray);

  return merged;
}

const extensionAdapter: StorageAdapter = {
  async getSettings() {
    return pullSettingsFromChromeSync();
  },
  async setSettings(value) {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: value });
  },
  async getStats() {
    return pullStatsFromChromeLocal();
  },
  async setStats(value) {
    await chrome.storage.local.set({ [STATS_KEY]: value });
  },
  onSettingsChanged(listener) {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'sync' || !changes[SETTINGS_KEY]) return;
      listener(mergeSettings(changes[SETTINGS_KEY].newValue as Partial<FocusSettings>));
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  },
  onStatsChanged(listener) {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local' || !changes[STATS_KEY]) return;
      listener(mergeStats(changes[STATS_KEY].newValue as Partial<FocusStats>));
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  },
};

const webListeners = {
  settings: new Set<Listener<FocusSettings>>(),
  stats: new Set<Listener<FocusStats>>(),
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === SETTINGS_KEY) {
      const value = event.newValue ? JSON.parse(event.newValue) : undefined;
      webListeners.settings.forEach((l) => l(mergeSettings(value)));
    }
    if (event.key === STATS_KEY) {
      const value = event.newValue ? JSON.parse(event.newValue) : undefined;
      webListeners.stats.forEach((l) => l(mergeStats(value)));
    }
  });
}

const webAdapter: StorageAdapter = {
  async getSettings() {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };

    let raw = localStorage.getItem(SETTINGS_KEY);
    let sourceKey: string | null = SETTINGS_KEY;

    if (!raw) {
      for (const lk of REELKILL_STORAGE.legacySettingsKeys) {
        raw = localStorage.getItem(lk);
        if (raw) {
          sourceKey = lk;
          break;
        }
      }
    }

    const merged = mergeSettings(raw ? JSON.parse(raw) : undefined);

    if (sourceKey !== SETTINGS_KEY && raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      for (const lk of REELKILL_STORAGE.legacySettingsKeys)
        localStorage.removeItem(lk);
    }

    return merged;
  },
  async setSettings(value) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
    webListeners.settings.forEach((l) => l(value));
  },
  async getStats() {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_STATS };

    let raw = localStorage.getItem(STATS_KEY);
    let sourceKey: string | null = STATS_KEY;

    if (!raw) {
      for (const lk of REELKILL_STORAGE.legacyStatsKeys) {
        raw = localStorage.getItem(lk);
        if (raw) {
          sourceKey = lk;
          break;
        }
      }
    }

    const merged = mergeStats(raw ? JSON.parse(raw) : undefined);

    if (sourceKey !== STATS_KEY && raw) {
      localStorage.setItem(STATS_KEY, JSON.stringify(merged));
      for (const lk of REELKILL_STORAGE.legacyStatsKeys) localStorage.removeItem(lk);
    }

    return merged;
  },
  async setStats(value) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STATS_KEY, JSON.stringify(value));
    webListeners.stats.forEach((l) => l(value));
  },
  onSettingsChanged(listener) {
    webListeners.settings.add(listener);
    return () => webListeners.settings.delete(listener);
  },
  onStatsChanged(listener) {
    webListeners.stats.add(listener);
    return () => webListeners.stats.delete(listener);
  },
};

export const storage: StorageAdapter = isExtensionContext() ? extensionAdapter : webAdapter;

export const inExtension = isExtensionContext;

/**
 * Sum the per-day stat counter over the last `n` days (inclusive of today),
 * using browser-local dates. Default is a rolling 7-day window.
 */
export function lastNDaysBlocked(
  perDay: Record<string, number>,
  n = 7,
  reference: Date = new Date(),
): number {
  let total = 0;
  for (let i = 0; i < n; i++) {
    const d = new Date(reference);
    d.setDate(d.getDate() - i);
    total += perDay[localDateKey(d)] ?? 0;
  }
  return total;
}

/** Returns YYYY-MM-DD in the *browser's* timezone. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Best-effort IANA timezone label for the current browser. */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function sendBackgroundMessage<T = unknown>(message: unknown): Promise<T | null> {
  if (!isExtensionContext()) return Promise.resolve(null);
  return new Promise<T | null>((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve((response as T) ?? null);
      });
    } catch {
      resolve(null);
    }
  });
}
