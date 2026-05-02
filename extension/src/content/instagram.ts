/**
 * Instagram Reels blocker.
 *
 * Never call `.remove()` on Instagram — their React reconciler crashes
 * with "Something went wrong" when managed subtrees disappear from under
 * the virtual scroller mid-commit.
 *
 * Instead we tag nodes with stable data attributes and hide them via
 * injected CSS (`display:none`). React keeps owning the DOM nodes but
 * the user sees no Reel content (gap trade-off vs crashing).
 */

import { createContentRuntime, injectStyles } from './base';

const STYLE_ID = 'reelkill-instagram-style';

/** Reels nav entry + flagged feed items (see markReels() below). */
const HIDE_CSS = `
  a[href="/reels/"],
  a[href="/reels"],
  div[role="link"]:has(svg[aria-label="Reels"]) {
    display: none !important;
  }

  article[data-reelkill-ig="1"],
  a[data-reelkill-ig="1"][href^="/reel/"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

// Anything taller than 1.1× wide reads as reel-shaped portrait.
const PORTRAIT_THRESHOLD = 1.1;

const runtime = createContentRuntime();

function isPortraitVideo(video: HTMLVideoElement): boolean {
  if (video.videoWidth && video.videoHeight) {
    return video.videoHeight / video.videoWidth > PORTRAIT_THRESHOLD;
  }
  const r = video.getBoundingClientRect();
  if (r.width < 50 || r.height < 50) return false;
  return r.height / r.width > PORTRAIT_THRESHOLD;
}

function markReels(): number {
  let marked = 0;

  const stampArticle = (article: HTMLElement | null | undefined) => {
    if (!article?.isConnected || article.dataset.reelkillIg === '1') return;
    article.dataset.reelkillIg = '1';
    marked += 1;
  };

  const stampAnchorRail = (a: HTMLAnchorElement) => {
    if (!a.isConnected || a.dataset.reelkillIg === '1') return;
    if (a.closest('article[data-reelkill-ig="1"]')) return;
    a.dataset.reelkillIg = '1';
    marked += 1;
  };

  // Articles that already expose a /reel/ link inside the DOM.
  document
    .querySelectorAll<HTMLAnchorElement>('article a[href^="/reel/"]')
    .forEach((a) => stampArticle(a.closest('article')));

  // Portrait video inside a feed/post article.
  document.querySelectorAll<HTMLVideoElement>('article video').forEach((video) => {
    if (!isPortraitVideo(video)) {
      if (!video.dataset.reelkillWatching && !video.videoWidth) {
        video.dataset.reelkillWatching = '1';
        video.addEventListener('loadedmetadata', () => runtimeTick(), {
          once: true,
        });
      }
      return;
    }
    stampArticle(video.closest('article'));
  });

  // Reel thumbnails (rail, Explore grid, profile Reels) — anchors not
  // under an already-flagged article.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/reel/"]').forEach((a) => {
    const article = a.closest('article');
    if (article) {
      stampArticle(article);
    } else {
      stampAnchorRail(a);
    }
  });

  return marked;
}

function maybeRedirect() {
  const path = location.pathname;
  if (path === '/reels' || path.startsWith('/reels/') || path.startsWith('/reel/')) {
    runtime.reportBlock('instagram', 1);
    location.replace('https://www.instagram.com/');
  }
}

function runtimeTick() {
  if (!runtime.isActive() || !runtime.getSettings().rules.instagramReels) {
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  injectStyles(STYLE_ID, HIDE_CSS);
  const n = markReels();
  if (n > 0) runtime.reportBlock('instagram', n);
  maybeRedirect();
}

const start = () => {
  runtimeTick();
  runtime.observe(document.documentElement, runtimeTick);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
