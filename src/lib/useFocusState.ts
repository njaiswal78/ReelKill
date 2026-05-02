/**
 * React bindings on top of the storage adapter.
 * Components call `useFocusState()` to read settings/stats and receive
 * automatic updates whenever the background service worker (or another
 * extension surface / browser tab) writes new values.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  FocusSettings,
  FocusStats,
  storage,
  sendBackgroundMessage,
} from './storage';
import { isScheduleActive, formatTime } from './schedule';

// Re-exported for components that still import from useFocusState.
export { isScheduleActive, formatTime };

export interface FocusStateApi {
  settings: FocusSettings;
  stats: FocusStats;
  loading: boolean;
  updateSettings: (updater: (prev: FocusSettings) => FocusSettings) => Promise<void>;
  resetStats: () => Promise<void>;
}

export function useFocusState(): FocusStateApi {
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<FocusStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, st] = await Promise.all([storage.getSettings(), storage.getStats()]);
      if (cancelled) return;
      setSettings(s);
      setStats(st);
      setLoading(false);
    })();
    const offS = storage.onSettingsChanged(setSettings);
    const offT = storage.onStatsChanged(setStats);
    return () => {
      cancelled = true;
      offS();
      offT();
    };
  }, []);

  const updateSettings = useCallback(
    async (updater: (prev: FocusSettings) => FocusSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        // Persist & broadcast (fire-and-forget)
        void storage.setSettings(next);
        void sendBackgroundMessage({ type: 'settings:updated', settings: next });
        return next;
      });
    },
    [],
  );

  const resetStats = useCallback(async () => {
    const fresh: FocusStats = {
      totalBlocked: 0,
      perPlatform: {},
      perDay: {},
      minutesSaved: 0,
    };
    setStats(fresh);
    await storage.setStats(fresh);
    await sendBackgroundMessage({ type: 'stats:reset' });
  }, []);

  return { settings, stats, loading, updateSettings, resetStats };
}

