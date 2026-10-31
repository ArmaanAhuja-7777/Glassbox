import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { describeError } from '../api/redact.js';
import type { Database } from '../db/database.js';
import { sessionUser, type SessionUser } from './accounts.js';
import { SESSION_COOKIE } from './cookies.js';

/** What a guarded route can read: `c.get('user')` is the signed-in person. */
export interface SignedInEnv {
  Bindings: { readonly DATABASE_URL?: string };
  Variables: { user: SessionUser };
}

interface GuardDependencies {
  readonly database: (databaseUrl: string) => Database;
  readonly log: (message: string) => void;
}

/** Lets a request through only with a live session: 401 otherwise. Sets `c.get('user')`. */
export function requireUser(deps: GuardDependencies): MiddlewareHandler<SignedInEnv> {
  return async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE, 'host');
    const databaseUrl = c.env.DATABASE_URL;
    if (token === undefined || !databaseUrl) return c.json({ error: 'Sign in first.' }, 401);
    let user: SessionUser | undefined;
    try {
      user = await sessionUser(deps.database(databaseUrl), token);
    } catch (error) {
      deps.log(`session lookup failed: ${describeError(error)}`);
      return c.json({ error: 'Could not check your session. Try again in a moment.' }, 503);
    }
    if (user === undefined) return c.json({ error: 'Your session has ended. Sign in again.' }, 401);
    c.set('user', user);
    await next();
    return undefined;
  };
}

/** After `requireUser`: only admins (role from the allowlist) get through, 403 for everyone else. */
export const requireAdmin: MiddlewareHandler<SignedInEnv> = async (c, next) => {
  if (c.get('user').role !== 'admin') return c.json({ error: 'Only admins can do this.' }, 403);
  await next();
  return undefined;
};
