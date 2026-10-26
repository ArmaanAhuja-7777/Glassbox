/// <reference types="vitest/config" />
import { execFileSync } from 'node:child_process';
import type { BuildInfo } from '@flowcanvas/graph-model';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import rootPackage from '../../package.json' with { type: 'json' };

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

export default defineConfig({
  plugins: [react()],
  define: {
    __FLOWCANVAS_BUILD__: JSON.stringify(buildInfo),
  },
  test: {
    environment: 'jsdom',
  },
});
