import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

/**
 * Vite config for the toolbar popup UI bundled into dist-extension/.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // The repo-level public/ folder holds Cloudflare Pages assets
  // (_headers, _redirects). Chrome rejects any extension whose root
  // contains a file beginning with "_", so we disable publicDir here
  // to keep those files out of dist-extension/.
  publicDir: false,
  build: {
    outDir: 'dist-extension',
    emptyOutDir: false, // we run multiple builds into the same folder
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'extension/popup.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
