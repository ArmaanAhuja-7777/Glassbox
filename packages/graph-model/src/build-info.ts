export interface BuildInfo {
  readonly version: string;
  readonly commit: string;
}

const SHORT_SHA_LENGTH = 7;

export function formatBuildInfo(info: BuildInfo): string {
  const commit = info.commit.trim();
  const shown = commit === '' ? 'unknown commit' : commit.slice(0, SHORT_SHA_LENGTH);
  return `${info.version} · ${shown}`;
}
