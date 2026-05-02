/**
 * Universal 9:16 vertical-video guard.
 *
 * Runs on every page (matches <all_urls>). Walks every <video> element in
 * the document, computes its aspect ratio, and if the parent container is
 * portrait-oriented (close to 9:16) it nukes the closest reasonable
 * ancestor — preventing infinite-scroll style short feeds from rendering.
 *
 * Sites listed in the user's whitelist short-circuit immediately so that
 * legitimate vertical content (educational, portfolios, etc.) is allowed.
 */

import { createContentRuntime, injectStyles } from './base';

const STYLE_ID = 'reelkill-universal-style';
const SHIELD_CSS = `
  [data-reelkill-killed] {
    display: none !important;
  }
`;

const TARGET_RATIO = 16 / 9; // height / width
const TOLERANCE = 0.25; // accept anything between ~1.5 and ~2.0

const runtime = createContentRuntime();

function isPortrait(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 80 || rect.height < 80) return false;
  const ratio = rect.height / rect.width;
  return Math.abs(ratio - TARGET_RATIO) < TOLERANCE;
}

function killClosest(el: HTMLElement) {
  const ancestor =
    el.closest<HTMLElement>(
      'article, section, [role="article"], [role="button"], li, .video, .reel, .short, [data-vertical], [data-short]',
    ) ?? el.parentElement;
  if (!ancestor) return false;
  if (ancestor.dataset.reelkillKilled) return false;
  ancestor.dataset.reelkillKilled = '1';
  return true;
}

function scan(): number {
  let killed = 0;
  // Direct <video> tags
  document.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
    const intrinsicRatio =
      video.videoHeight && video.videoWidth ? video.videoHeight / video.videoWidth : 0;
    const looksPortrait = intrinsicRatio
      ? Math.abs(intrinsicRatio - TARGET_RATIO) < TOLERANCE
      : isPortrait(video);
    if (!looksPortrait) return;
    if (killClosest(video)) killed += 1;
  });

  // CSS aspect-ratio containers (common for SSR placeholders)
  document
    .querySelectorAll<HTMLElement>('[style*="aspect-ratio"], [class*="aspect-9"], [class*="aspect-916"]')
    .forEach((el) => {
      if (!isPortrait(el)) return;
      if (killClosest(el)) killed += 1;
    });

  return killed;
}

function tick() {
  if (!runtime.isActive() || !runtime.getSettings().rules.universal916) {
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  injectStyles(STYLE_ID, SHIELD_CSS);
  const killed = scan();
  if (killed > 0) runtime.reportBlock('other', killed);
}

const start = () => {
  tick();
  runtime.observe(document.documentElement, tick);
  // Re-scan after layout settles for SPAs.
  setInterval(tick, 1500);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
