/**
 * Facebook Reels blocker.
 *
 * Surgical CSS-only approach: every Facebook reel URL lives under
 * /reel/<id>, and the left-rail nav entry is /reels/. Anchor hrefs are
 * the only stable signal because Facebook's class names are randomized.
 *
 * What we hide:
 *   - The "Reels" entry in the left sidebar / mobile nav
 *   - Any direct anchor pointing at /reel/<id> (cards & inline links)
 *   - Any feed article that contains such an anchor (full-width inline reels)
 *
 * What we leave alone:
 *   - Regular photo posts, status posts, link posts
 *   - Regular video posts (their links go to /watch/ or /<user>/videos/)
 *   - Stories
 */

import { createContentRuntime, injectStyles } from './base';

const STYLE_ID = 'reelkill-facebook-style';

const HIDE_CSS = `
  /* Reels nav entry (left sidebar + mobile bottom-nav) */
  a[href="/reels/"],
  a[href="/reels"],
  a[href^="/reels/"],
  a[href*="facebook.com/reels"],

  /* Reel cards / direct reel links anywhere on the page */
  a[href^="/reel/"],
  a[href*="facebook.com/reel/"],

  /* Inline Reel posts that occupy a full feed slot */
  div[role="article"]:has(a[href^="/reel/"]),
  div[role="article"]:has(a[href*="facebook.com/reel/"]) {
    display: none !important;
  }
`;

const runtime = createContentRuntime();

function maybeRedirect() {
  const path = location.pathname;
  if (path === '/reels' || path.startsWith('/reels/') || path.startsWith('/reel/')) {
    runtime.reportBlock('facebook', 1);
    location.replace('https://www.facebook.com/');
  }
}

function tick() {
  if (!runtime.isActive() || !runtime.getSettings().rules.facebookReels) {
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  injectStyles(STYLE_ID, HIDE_CSS);
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
