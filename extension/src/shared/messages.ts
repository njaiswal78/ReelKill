/**
 * Wire-format messages exchanged between content scripts, the popup,
 * and the background service worker.
 */

export type ExtensionMessage =
  | { type: 'settings:get' }
  | { type: 'settings:updated'; settings: import('../../../src/lib/storage').FocusSettings }
  | { type: 'stats:reset' }
  | { type: 'block:reported'; platform: string; count?: number; url?: string };

export interface SettingsResponse {
  settings: import('../../../src/lib/storage').FocusSettings;
  scheduleActive: boolean;
}
