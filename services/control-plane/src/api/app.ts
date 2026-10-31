import { Hono } from 'hono';
import rootPackage from '../../../../package.json' with { type: 'json' };
import { authRoutes, type AuthBindings } from '../auth/routes.js';
import { neonDatabase, type Database } from '../db/database.js';
import { describeError } from './redact.js';

/** Values Cloudflare passes to the Worker: Worker secrets and `vars` on Cloudflare, `.dev.vars` under `wrangler dev`. */
export type ApiBindings = AuthBindings;

/** Outside effects the API needs, passed in so tests can replace them. */
export interface ApiDependencies {
  readonly database: (databaseUrl: string) => Database;
  /** For calls to GitHub; tests pass a fake GitHub. */
  readonly fetch: typeof fetch;
  readonly now: () => number;
  readonly log: (message: string) => void;
}

const defaults: ApiDependencies = {
  database: neonDatabase,
  // Bound, because Workers' fetch throws "Illegal invocation" when called as a method of another object.
  fetch: (input, init) => fetch(input, init),
  now: () => Date.now(),
  log: (message) => {
    console.error(message);
  },
};

/** The control plane's HTTP API, mounted under /api in the app's Worker (decisions log, 30 Oct 2026). */
export function createApi(overrides: Partial<ApiDependencies> = {}) {
  const deps = { ...defaults, ...overrides };
  const api = new Hono<{ Bindings: ApiBindings }>().basePath('/api');

  // Answers are per person and may name them: never stored by the browser or any cache in between.
  api.use(async (c, next) => {
    await next();
    c.header('Cache-Control', 'no-store');
  });

  api.get('/health', (c) =>
    c.json({ status: 'ok', service: 'control-plane', version: rootPackage.version }),
  );

  // Proves the Worker can reach its database; never echoes the connection string, even on errors.
  api.get('/db/ping', async (c) => {
    const databaseUrl = c.env.DATABASE_URL;
    if (databaseUrl === undefined || databaseUrl === '') {
      return c.json({ database: 'not configured', fix: 'Set the DATABASE_URL secret' }, 503);
    }
    const started = deps.now();
    try {
      await deps.database(databaseUrl).query('select 1 as ok');
      return c.json({ database: 'ok', roundTripMs: deps.now() - started });
    } catch (error) {
      deps.log(`database ping failed: ${describeError(error)}`);
      return c.json({ database: 'unreachable' }, 503);
    }
  });

  api.route('/', authRoutes(deps));

  api.notFound((c) => c.json({ error: 'not found' }, 404));
  return api;
}
