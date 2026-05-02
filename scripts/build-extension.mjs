// Orchestrates the full Chrome-extension build:
//   1. wipes dist-extension/
//   2. bundles popup + dashboard React UIs via Vite
//   3. bundles each content script as a standalone IIFE via esbuild
//   4. bundles the background service worker as ESM via esbuild
//   5. copies manifest.json and renders the brand icons
//
// Output is a folder you can load directly via chrome://extensions
// → Developer Mode → Load Unpacked → select dist-extension/.

import { build as viteBuild } from 'vite';
import esbuild from 'esbuild';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'dist-extension');
const EXT = resolve(ROOT, 'extension');

function step(label) {
  console.log(`\n▸ ${label}`);
}

step('Cleaning dist-extension/');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

step('Building popup + dashboard UI (Vite)');
await viteBuild({
  configFile: resolve(ROOT, 'vite.extension.config.ts'),
});

// Vite emits popup.html and dashboard.html nested under their original
// folder structure (extension/popup.html → dist-extension/extension/popup.html).
// Move them to the root so the manifest paths line up.
function relocate(htmlName) {
  const nested = resolve(OUT, 'extension', htmlName);
  const top = resolve(OUT, htmlName);
  if (existsSync(nested)) {
    cpSync(nested, top);
    rmSync(nested);
  }
}
relocate('popup.html');
const nestedDir = resolve(OUT, 'extension');
if (existsSync(nestedDir)) rmSync(nestedDir, { recursive: true, force: true });

// Chrome refuses to load any extension whose root contains a file or
// directory whose name starts with "_" (those are reserved). Strip
// anything that may have leaked in from public/ or another source.
for (const entry of readdirSync(OUT)) {
  if (entry.startsWith('_')) {
    rmSync(resolve(OUT, entry), { recursive: true, force: true });
    console.log(`  · removed reserved-name file: ${entry}`);
  }
}

step('Bundling background service worker (esbuild, ESM)');
await esbuild.build({
  entryPoints: [resolve(EXT, 'src/background.ts')],
  outfile: resolve(OUT, 'background.js'),
  bundle: true,
  format: 'esm',
  target: ['chrome100'],
  platform: 'browser',
  minify: false,
  sourcemap: false,
  logLevel: 'info',
});

step('Bundling content scripts (esbuild, IIFE)');
const contentScripts = ['youtube', 'instagram', 'tiktok', 'facebook', 'universal'];
mkdirSync(resolve(OUT, 'content'), { recursive: true });
for (const name of contentScripts) {
  await esbuild.build({
    entryPoints: [resolve(EXT, `src/content/${name}.ts`)],
    outfile: resolve(OUT, `content/${name}.js`),
    bundle: true,
    format: 'iife',
    target: ['chrome100'],
    platform: 'browser',
    minify: false,
    sourcemap: false,
    logLevel: 'warning',
  });
}

step('Copying manifest.json');
const manifest = JSON.parse(readFileSync(resolve(EXT, 'manifest.json'), 'utf8'));
writeFileSync(
  resolve(OUT, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
);

step('Rendering brand icons');
const iconResult = spawnSync(
  process.execPath,
  [resolve(__dirname, 'build-icons.mjs')],
  { stdio: 'inherit' },
);
if (iconResult.status !== 0) {
  console.error('Icon generation failed.');
  process.exit(iconResult.status ?? 1);
}

step('Build complete');
console.log(`Extension package ready at: ${OUT}`);
console.log(
  '  Load it via chrome://extensions → Developer Mode → Load Unpacked.',
);
