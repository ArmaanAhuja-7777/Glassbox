import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { BuildInfo } from '@flowcanvas/graph-model';

interface PackageJson {
  readonly version: string;
}

function readVersion(): string {
  // src/ and dist/ both sit one level below package.json, so this works in dev and in production.
  const packageJsonUrl = new URL('../package.json', import.meta.url);
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as PackageJson;
  return packageJson.version;
}

function readCommit(env: NodeJS.ProcessEnv): string {
  const fromEnv = env.FLOWCANVAS_COMMIT?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function readBuildInfo(env: NodeJS.ProcessEnv = process.env): BuildInfo {
  return { version: readVersion(), commit: readCommit(env) };
}
