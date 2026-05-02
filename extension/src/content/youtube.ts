/**
 * YouTube Shorts blocker.
 *
 * Strategy:
 *   1. Inject CSS that hides every Shorts surface (sidebar entry, shelves,
 *      reel renderers, Shorts player chrome) while the rule is enabled.
 *   2. Continuously remove dynamically rendered Shorts containers and
 *      report them to the background worker for stat tracking.
 *   3. If the user navigates to /shorts/<id>, redirect to the watch page
 *      so that infinite vertical scrolling is impossible.
 */

import { createContentRuntime, injectStyles } from './base';

const STYLE_ID = 'reelkill-youtube-style';
const HIDE_CSS = `
  ytd-reel-shelf-renderer,
  ytd-rich-shelf-renderer[is-shorts],
  ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
  ytd-reel-item-renderer,
  ytd-shorts,
  ytd-mini-guide-entry-renderer[aria-label="Shorts"],
  a[title="Shorts"],
  ytd-guide-entry-renderer:has(a[title="Shorts"]),
  ytm-pivot-bar-item-renderer:has([aria-label="Shorts"]) {
    display: none !important;
  }
`;

const SELECTORS = [
  'ytd-reel-shelf-renderer',
  'ytd-rich-shelf-renderer[is-shorts]',
  'ytd-reel-item-renderer',
  'ytd-shorts',
];

const runtime = createContentRuntime();

function applyHide(): number {
  let removed = 0;
  for (const sel of SELECTORS) {
    const nodes = document.querySelectorAll(sel);
    nodes.forEach((node) => {
      if ((node as HTMLElement).dataset?.reelkillRemoved) return;
      (node as HTMLElement).dataset.reelkillRemoved = '1';
      node.remove();
      removed += 1;
    });
  }
  return removed;
}

function maybeRedirectShortsUrl() {
  if (!location.pathname.startsWith('/shorts/')) return;
  const id = location.pathname.split('/')[2];
  if (!id) return;
  runtime.reportBlock('youtube', 1);
  location.replace(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`);
}

function tick() {
  if (!runtime.isActive() || !runtime.getSettings().rules.youtubeShorts) {
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  injectStyles(STYLE_ID, HIDE_CSS);
  const removed = applyHide();
  if (removed > 0) runtime.reportBlock('youtube', removed);
  maybeRedirectShortsUrl();
}

const start = () => {
  tick();
  runtime.observe(document.documentElement, tick);
  // SPA navigations on YouTube fire `yt-navigate-finish`.
  window.addEventListener('yt-navigate-finish', tick);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
