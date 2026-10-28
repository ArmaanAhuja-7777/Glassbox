/// <reference types="vitest/config" />
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BuildInfo } from '@flowcanvas/graph-model';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import rootPackage from '../../package.json' with { type: 'json' };
import { parseChangelog } from './src/changelog/parse';

function resolveCommit(): string {
  const fromEnv = process.env.FLOWCANVAS_COMMIT?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const buildInfo: BuildInfo = { version: rootPackage.version, commit: resolveCommit() };

/**
 * `import releases from 'virtual:changelog'` gives the parsed root CHANGELOG.md, built in at build time, so
 * the What's new panel can never disagree with the changelog. Editing the changelog reloads the dev server.
 */
function changelog(): Plugin {
  const id = 'virtual:changelog';
  const resolved = `\0${id}`;
  const file = fileURLToPath(new URL('../../CHANGELOG.md', import.meta.url));
  return {
    name: 'flowcanvas-changelog',
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadedId) {
      if (loadedId !== resolved) return undefined;
      this.addWatchFile(file);
      return `export default ${JSON.stringify(parseChangelog(readFileSync(file, 'utf8')))};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), changelog()],
  define: {
    __FLOWCANVAS_BUILD__: JSON.stringify(buildInfo),
  },
  build: {
    // Never inline fonts as data: URLs; the Content-Security-Policy only allows fonts from our own origin.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
  test: {
    environment: 'jsdom',
  },
});
