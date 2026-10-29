/** The shape of corpus/manifest.json. */
export interface CorpusRepo {
  /** Stable lowercase id, e.g. "rallly". */
  readonly id: string;
  readonly name: string;
  /** owner/name of the original project. */
  readonly upstream: string;
  /** owner/name of our public fork. */
  readonly fork: string;
  /** The fork's default branch, which must contain `commit`. */
  readonly branch: string;
  /** Full 40-character commit SHA everything is tested against. */
  readonly commit: string;
  /** Why this repo is in the set: what it covers that the others don't. */
  readonly why: string;
  readonly licence: {
    readonly spdx: string;
    readonly file: string;
    /** SHA-256 of the licence file at `commit`; any change fails the check. */
    readonly sha256: string;
    readonly notes: string;
  };
  /** Evidence of the stack: each package must be a dependency in that package.json at `commit`. */
  readonly stack: readonly { readonly file: string; readonly packages: readonly string[] }[];
}

export interface CorpusManifest {
  readonly pinnedOn: string;
  readonly pinRule: string;
  readonly repos: readonly CorpusRepo[];
}

/** Structural rules the manifest itself must follow (checked offline, in `pnpm test`). */
export function manifestProblems(manifest: CorpusManifest): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const repo of manifest.repos) {
    const at = `corpus repo "${repo.id}"`;
    if (!/^[a-z][a-z0-9-]*$/.test(repo.id)) problems.push(`${at}: id must be lowercase`);
    if (ids.has(repo.id)) problems.push(`${at}: duplicate id`);
    ids.add(repo.id);
    if (!/^[0-9a-f]{40}$/.test(repo.commit))
      problems.push(`${at}: commit must be a full 40-character SHA`);
    if (!/^[0-9a-f]{64}$/.test(repo.licence.sha256))
      problems.push(`${at}: licence.sha256 must be a SHA-256`);
    for (const name of [repo.upstream, repo.fork]) {
      if (!/^[\w.-]+\/[\w.-]+$/.test(name)) problems.push(`${at}: "${name}" must be owner/name`);
    }
    if (repo.stack.length === 0) problems.push(`${at}: needs at least one stack evidence file`);
  }
  return problems;
}
