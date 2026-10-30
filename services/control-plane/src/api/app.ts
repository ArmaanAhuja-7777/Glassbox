import { neon } from '@neondatabase/serverless';
import { Hono } from 'hono';
import { describeError } from './redact.js';

/** Values Cloudflare passes to the Worker: Worker secrets on Cloudflare, `.dev.vars` under `wrangler dev`. */
export interface ApiBindings {
  readonly DATABASE_URL?: string;
}

/** Outside effects the API needs, passed in so tests can replace them. */
export interface ApiDependencies {
  /** Runs one SQL statement against the database at `databaseUrl`. */
  readonly query: (
    databaseUrl: string,
    text: string,
  ) => Promise<readonly Record<string, unknown>[]>;
  readonly now: () => number;
  readonly log: (message: string) => void;
}

/** Neon's serverless driver sends SQL over HTTPS, which suits Workers (no long-lived sockets). */
const neonQuery: ApiDependencies['query'] = async (databaseUrl, text) =>
  neon(databaseUrl).query(text) as Promise<Record<string, unknown>[]>;

const defaults: ApiDependencies = {
  query: neonQuery,
  now: () => Date.now(),
  log: (message) => {
    console.error(message);
  },
};

/** The control plane's HTTP API, mounted under /api in the app's Worker (decisions log, 30 Oct 2026). */
export function createApi(overrides: Partial<ApiDependencies> = {}) {
  const deps = { ...defaults, ...overrides };
  const api = new Hono<{ Bindings: ApiBindings }>().basePath('/api');

  api.get('/health', (c) => c.json({ status: 'ok', service: 'control-plane' }));

  // Proves the Worker can reach its database; never echoes the connection string, even on errors.
  api.get('/db/ping', async (c) => {
    const databaseUrl = c.env.DATABASE_URL;
    if (databaseUrl === undefined || databaseUrl === '') {
      return c.json({ database: 'not configured', fix: 'Set the DATABASE_URL secret' }, 503);
    }
    const started = deps.now();
    try {
      await deps.query(databaseUrl, 'select 1 as ok');
      return c.json({ database: 'ok', roundTripMs: deps.now() - started });
    } catch (error) {
      deps.log(`database ping failed: ${describeError(error)}`);
      return c.json({ database: 'unreachable' }, 503);
    }
  });

  api.notFound((c) => c.json({ error: 'not found' }, 404));
  return api;
}
