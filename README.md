# ReelKill

NPM package name: **`reelkill`**. Marketing site: [https://focusshield-pro.pages.dev/](https://focusshield-pro.pages.dev/) (Cloudflare Pages project **`focusshield-pro`**).

A Manifest V3 Chrome extension built for **Gen Z & millennial** attention spans —
it strips doomscroll bait: Shorts, Reels, TikTok FYP, Facebook reels, and random
vertical `9:16` junk across the web. Pair it with schedules, per-platform toggles,
a whitelist for school/work/video tools, and a rolling 7-day goal — all **local**,
no accounts, no telemetry.

**Brand note:** unrelated to [*FocusShield Site Blocker*](https://chromewebstore.google.com/detail/focusshield-site-blocker/ohdkdaaigbjnbpdljjfkpjpdbnlcbcoj), which blocks whole websites with passwords. ReelKill removes **feed-style vertical video**, not URLs.

Cloudflare Pages hosts a **marketing site only** (`index.html` + `src/marketing/LandingPage.tsx`). Your real metrics live in Chrome (`chrome.storage`); the popup is `extension/popup.html` → `src/App.tsx`.

## Architecture

| Surface | Built from | Output |
| --- | --- | --- |
| Extension popup | `src/App.tsx` + `extension/popup.html` | `dist-extension/popup.html` + `dist-extension/assets/*.js` |
| Background service worker | `extension/src/background.ts` | `dist-extension/background.js` (ESM) |
| Content scripts | `extension/src/content/{youtube,instagram,tiktok,facebook,universal}.ts` | `dist-extension/content/*.js` (IIFE) |
| Brand icons | `scripts/build-icons.mjs` | `dist-extension/icons/icon{16,48,128}.png` |
| Marketing site | `index.html` + `src/marketing/LandingPage.tsx` | `dist/` (Cloudflare Pages) |

### How the engine works

1. **Strict Mode** is the global on/off. The popup writes it into
   `chrome.storage.sync`. Every content script subscribes to that key so
   changes propagate instantly to every open tab.
2. **Content scripts** run on `document_idle`. Each one injects a CSS rule
   to hide its platform's short-form chrome, then a `MutationObserver`
   continuously removes dynamically rendered Shorts/Reels containers
   (and on TikTok/YouTube, hard-redirects the route to a clean feed).
3. The **universal `9:16` guard** runs on every other site. It walks every
   `<video>`, computes `videoHeight / videoWidth`, and if the ratio is
   close to `16/9` (portrait) it removes the closest semantic ancestor.
4. Each removal is reported to the **background service worker**, which
   debounces them, increments per-platform and per-day counts in
   `chrome.storage.local`, and updates the toolbar badge.
5. The **schedule** is evaluated in every content script whenever the DOM
   changes (browser-local timezone; strict mode OR schedule activates blocking).
   The background worker does **not** flip strict mode anymore.
6. The **whitelist** is consulted on every scan. Domains (with optional
   path prefix) listed there short-circuit all blocking, so legitimate
   vertical content (e.g. an educational portfolio) is left alone.

## Project layout

```
focus/
├── src/
│   ├── App.tsx                 # popup UI (extension only)
│   ├── main.tsx                # popup entry
│   ├── main.web.tsx            # Cloudflare Pages entry
│   ├── marketing/LandingPage.tsx
│   ├── lib/storage.ts          # chrome.storage keys (also used by scripts)
│   ├── lib/schedule.ts
│   └── lib/useFocusState.ts
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── icons/icon.svg
│   └── src/
│       ├── background.ts
│       ├── shared/whitelist.ts
│       └── content/
│           ├── youtube.ts
│           ├── instagram.ts
│           ├── tiktok.ts
│           ├── facebook.ts
│           └── universal.ts
├── scripts/
│   ├── build-extension.mjs
│   └── build-icons.mjs
├── public/
│   ├── _headers
│   └── _redirects
├── vite.config.ts             # marketing site → dist/
├── vite.extension.config.ts    # popup → dist-extension/
└── wrangler.toml
```

## Local development

```bash
npm install
npm run dev          # marketing site at http://localhost:3000
```

The default Vite root serves **`index.html` → LandingPage**. To tweak the toolbar popup UI, temporarily point `vite.config.ts` Rollup input at `extension/popup.html` or inspect the packaged `dist-extension/` build.

Extension storage keys are **`reelkill.settings.v1`** and **`reelkill.stats.v1`** (`chrome.sync` / `chrome.local`). On first launch, data is migrated from legacy keys `unscroll.*` or `focusshield.*` when present.


Type-checking:

```bash
npm run lint         # tsc --noEmit
```

## Build the Chrome extension

```bash
npm run build:extension
```

The script writes a fully self-contained extension to `dist-extension/`:

```
dist-extension/
├── manifest.json
├── popup.html
├── background.js
├── content/{youtube,instagram,tiktok,facebook,universal}.js
├── assets/popup.{js,css}
└── icons/icon{16,48,128}.png
```

### Loading the unpacked extension

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the `dist-extension/` folder.
5. Pin **ReelKill** from the toolbar puzzle menu.

## Marketing site (`dist/`)

```bash
npm run build:web
```

Serve `dist/` with any static host or deploy to Pages.

**Live site:** [https://focusshield-pro.pages.dev/](https://focusshield-pro.pages.dev/)

## Deploy to Cloudflare Pages

```bash
npm run build:web
npm run deploy:pages
# wrangler deploys to project name "focusshield-pro" (wrangler.toml)
```

Create or use the Pages project **`focusshield-pro`** (or let `wrangler` prompt you).

### Git-driven deploys

- **Build command:** `npm run build:web`
- **Build output:** `dist`
- **Node:** 20+

## Build everything

```bash
npm run build:all   # web + extension
```

Or wipe both outputs:

```bash
npm run clean
```
