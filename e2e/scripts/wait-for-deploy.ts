/**
 * Waits until a deployed copy of the web app serves a given commit, so tests never run against the
 * previous deployment while Cloudflare is still building (it starts at the same time as CI).
 *
 *   node scripts/wait-for-deploy.ts --branch phase/1b-see-and-test --commit <sha>   the branch's preview
 *   node scripts/wait-for-deploy.ts --url https://flowcanvas.<sub>.workers.dev --commit <sha>   e.g. staging
 *
 * The subdomain comes from CLOUDFLARE_WORKERS_SUBDOMAIN. Prints the URL, and writes `url=` to GITHUB_OUTPUT in CI.
 */
import { appendFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

const WORKER = 'flowcanvas';

function fail(message: string): never {
  console.error(`wait-for-deploy: ${message}`);
  process.exit(1);
}

/**
 * Cloudflare's branch alias for a Workers Builds preview: lowercase, every run of other characters becomes a
 * dash, trimmed, and short enough that `<alias>-flowcanvas` fits a 63-character DNS label.
 */
function branchAlias(branch: string): string {
  return branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 62 - WORKER.length)
    .replace(/-+$/, '');
}

/** The commit the deployment was built from, read from its JavaScript bundle (the version line embeds it). */
async function servesCommit(base: string, shortCommit: string): Promise<boolean> {
  const page = await fetch(base, { cache: 'no-store' });
  if (!page.ok) return false;
  const html = await page.text();
  const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((match) => match[1]);
  for (const script of scripts) {
    if (script === undefined) continue;
    const bundle = await fetch(new URL(script, base), { cache: 'no-store' });
    if (bundle.ok && (await bundle.text()).includes(shortCommit)) return true;
  }
  return false;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      url: { type: 'string' },
      branch: { type: 'string' },
      commit: { type: 'string' },
      timeout: { type: 'string', default: '600' },
    },
  });
  if (values.commit === undefined || !/^[0-9a-f]{7,40}$/.test(values.commit)) {
    fail('pass --commit <sha>');
  }
  const shortCommit = values.commit.slice(0, 7);
  let base = values.url;
  if (base === undefined) {
    const subdomain = process.env.CLOUDFLARE_WORKERS_SUBDOMAIN;
    if (values.branch === undefined || subdomain === undefined || subdomain === '') {
      fail('pass --url, or --branch with CLOUDFLARE_WORKERS_SUBDOMAIN set');
    }
    base = `https://${branchAlias(values.branch)}-${WORKER}.${subdomain}.workers.dev/`;
  }

  const deadline = Date.now() + Number(values.timeout) * 1000;
  console.log(`Waiting for ${base} to serve ${shortCommit}…`);
  for (;;) {
    try {
      if (await servesCommit(base, shortCommit)) break;
    } catch (error) {
      console.log(`  not reachable yet (${(error as Error).message})`);
    }
    if (Date.now() > deadline) {
      fail(
        `${base} still doesn't serve ${shortCommit} after ${values.timeout} s. Check the Cloudflare build.`,
      );
    }
    await sleep(10_000);
  }
  console.log(`${base} serves ${shortCommit}.`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `url=${base}\n`);
}

await main();
