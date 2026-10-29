/**
 * Checks every repo in corpus/manifest.json against GitHub: the public fork, the pinned commit on its
 * branch, the unchanged licence and the stack evidence. Reads through the API only; nothing is cloned.
 *
 *   pnpm corpus:check                       (GITHUB_TOKEN raises the rate limit; CI sets it)
 */
import { readFileSync } from 'node:fs';
import { checkRepo, gitHubApi } from '../src/check.ts';
import { manifestProblems, type CorpusManifest } from '../src/manifest.ts';

const manifest = JSON.parse(
  readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'),
) as CorpusManifest;

const problems = manifestProblems(manifest);
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const api = gitHubApi();
let failed = 0;
for (const repo of manifest.repos) {
  const result = await checkRepo(repo, api);
  console.log(`${result.ok ? '✓' : '✗'} ${repo.name} (${repo.fork} @ ${repo.commit.slice(0, 7)})`);
  console.log(result.lines.join('\n'));
  if (!result.ok) failed += 1;
}
console.log(
  `\n${String(manifest.repos.length - failed)} of ${String(manifest.repos.length)} repos pass.`,
);
process.exit(failed === 0 ? 0 : 1);
