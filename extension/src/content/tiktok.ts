/**
 * TikTok For You Page redirector.
 *
 * TikTok aggressively re-routes the root path to /foryou. This script
 * watches the URL and content tree, redirecting infinite-scroll FYP feeds
 * to /following or to a clean Explore page.
 */

import { createContentRuntime, injectStyles } from './base';

const STYLE_ID = 'reelkill-tiktok-style';
const HIDE_CSS = `
  div[data-e2e="recommend-list-item-container"],
  div[data-e2e="feed-active-video"],
  div[data-e2e="recommend-feed"] {
    display: none !important;
  }
`;

const FYP_PATHS = ['/', '/foryou', '/foryou/'];

const runtime = createContentRuntime();

function maybeRedirect() {
  const path = location.pathname;
  if (FYP_PATHS.includes(path)) {
    runtime.reportBlock('tiktok', 1);
    location.replace('https://www.tiktok.com/following');
  }
}

function purgeFeed(): number {
  let removed = 0;
  document
    .querySelectorAll<HTMLElement>('[data-e2e="recommend-list-item-container"]')
    .forEach((node) => {
      if (node.dataset.reelkillRemoved) return;
      node.dataset.reelkillRemoved = '1';
      node.remove();
      removed += 1;
    });
  return removed;
}

function tick() {
  if (!runtime.isActive() || !runtime.getSettings().rules.tiktokFyp) {
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  injectStyles(STYLE_ID, HIDE_CSS);
  const removed = purgeFeed();
  if (removed > 0) runtime.reportBlock('tiktok', removed);
  maybeRedirect();
}

const start = () => {
  tick();
  runtime.observe(document.documentElement, tick);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
