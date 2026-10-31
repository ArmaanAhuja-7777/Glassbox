import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Database } from '../db/database.js';
import { describeError } from '../api/redact.js';
import { createSession, endSession, SESSION_DAYS, sessionUser, signIn } from './accounts.js';
import { constantTimeEqual, pkceChallenge, randomToken } from './crypto.js';
import { authorizeUrl, exchangeCode, fetchProfile } from './github.js';

/** Worker secrets and variables sign-in reads. `.dev.vars` and `wrangler dev --var` set them locally. */
export interface AuthBindings {
  readonly DATABASE_URL?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
  /** The one address sign-in works on (staging, or http://localhost:5173 locally); see `signInState`. */
  readonly APP_ORIGIN?: string;
}

export interface AuthDependencies {
  readonly database: (databaseUrl: string) => Database;
  readonly fetch: typeof fetch;
  readonly log: (message: string) => void;
}

/**
 * Whether this copy of the app can sign people in:
 * - `available`: this is the address registered with GitHub (staging, or local development)
 * - `staging-only`: a branch preview; GitHub only returns to registered addresses (decisions log, 30 Oct 2026)
 * - `not-configured`: a secret or variable is missing
 */
export type SignInState = 'available' | 'staging-only' | 'not-configured';

/** Why sign-in came back to the app without a session; the app shows a message for each. */
export type SignInProblem =
  'cancelled' | 'expired' | 'no-verified-email' | 'not-allowed' | 'unavailable' | 'failed';

type AuthContext = Context<{ Bindings: AuthBindings }>;

// `__Host-` cookies (RFC 6265bis): Secure, Path=/, no Domain, so no other site or subdomain can set or read them.
const SESSION_COOKIE = 'fc_session';
const OAUTH_COOKIE = 'fc_oauth';
const cookieBase = {
  prefix: 'host',
  secure: true,
  path: '/',
  httpOnly: true,
  sameSite: 'Lax',
} as const;

function signInState(c: AuthContext): SignInState {
  const { DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_ORIGIN } = c.env;
  if (!DATABASE_URL || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !APP_ORIGIN) {
    return 'not-configured';
  }
  return new URL(c.req.url).origin === APP_ORIGIN ? 'available' : 'staging-only';
}

function backToApp(c: AuthContext, problem?: SignInProblem): Response {
  return c.redirect(problem === undefined ? '/' : `/?sign-in=${problem}`, 302);
}

export function authRoutes(deps: AuthDependencies) {
  const auth = new Hono<{ Bindings: AuthBindings }>();

  auth.get('/me', async (c) => {
    const state = signInState(c);
    const token = getCookie(c, SESSION_COOKIE, 'host');
    const databaseUrl = c.env.DATABASE_URL;
    if (token === undefined || !databaseUrl) return c.json({ user: null, signIn: state });
    try {
      const user = await sessionUser(deps.database(databaseUrl), token);
      if (user === undefined) {
        deleteCookie(c, SESSION_COOKIE, cookieBase);
        return c.json({ user: null, signIn: state });
      }
      return c.json({ user, signIn: state });
    } catch (error) {
      deps.log(`session lookup failed: ${describeError(error)}`);
      return c.json({ error: 'Could not check your session. Try again in a moment.' }, 503);
    }
  });

  // Step 1: remember a one-time state and PKCE verifier, then send the browser to GitHub.
  auth.get('/auth/github', async (c) => {
    if (signInState(c) !== 'available') return backToApp(c, 'unavailable');
    const state = randomToken();
    const verifier = randomToken();
    setCookie(c, OAUTH_COOKIE, `${state}.${verifier}`, { ...cookieBase, maxAge: 600 });
    return c.redirect(
      authorizeUrl({
        clientId: c.env.GITHUB_CLIENT_ID ?? '',
        redirectUri: `${c.env.APP_ORIGIN ?? ''}/api/auth/callback/github`,
        state,
        codeChallenge: await pkceChallenge(verifier),
      }),
      302,
    );
  });

  // Step 2: GitHub sends the browser back with a code. Check it's the sign-in we started, then who it is.
  auth.get('/auth/callback/github', async (c) => {
    const started = getCookie(c, OAUTH_COOKIE, 'host');
    deleteCookie(c, OAUTH_COOKIE, cookieBase);
    if (signInState(c) !== 'available') return backToApp(c, 'unavailable');
    if (c.req.query('error') === 'access_denied') return backToApp(c, 'cancelled');

    const [expectedState, verifier] = started?.split('.') ?? [];
    const state = c.req.query('state');
    const code = c.req.query('code');
    if (
      expectedState === undefined ||
      verifier === undefined ||
      state === undefined ||
      code === undefined ||
      !constantTimeEqual(state, expectedState)
    ) {
      return backToApp(c, 'expired');
    }

    const { DATABASE_URL = '', GITHUB_CLIENT_ID = '', GITHUB_CLIENT_SECRET = '' } = c.env;
    try {
      // GitHub's token is used for these two reads and then dropped: never stored or logged.
      const githubToken = await exchangeCode(deps.fetch, {
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        code,
        redirectUri: `${c.env.APP_ORIGIN ?? ''}/api/auth/callback/github`,
        codeVerifier: verifier,
      });
      const profile = await fetchProfile(deps.fetch, githubToken);
      if (profile.verifiedEmail === undefined) return backToApp(c, 'no-verified-email');

      const db = deps.database(DATABASE_URL);
      const result = await signIn(db, {
        provider: 'github',
        providerUserId: profile.id,
        username: profile.login,
        email: profile.verifiedEmail,
        displayName: profile.name,
        avatarUrl: profile.avatarUrl,
      });
      if (result.kind === 'not-allowed') return backToApp(c, 'not-allowed');

      // A fresh token on every sign-in, and the previous session in this browser ends.
      const previous = getCookie(c, SESSION_COOKIE, 'host');
      if (previous !== undefined) await endSession(db, previous);
      const token = await createSession(db, result.userId, c.req.header('user-agent'));
      setCookie(c, SESSION_COOKIE, token, { ...cookieBase, maxAge: SESSION_DAYS * 24 * 60 * 60 });
      return backToApp(c);
    } catch (error) {
      deps.log(`GitHub sign-in failed: ${describeError(error)}`);
      return backToApp(c, 'failed');
    }
  });

  auth.post('/auth/sign-out', async (c) => {
    // Only our own pages may sign someone out (SameSite=Lax already keeps the cookie off other sites' posts).
    // APP_ORIGIN covers local development, where Vite forwards /api to the Worker on another port.
    const ownOrigins = [new URL(c.req.url).origin, c.env.APP_ORIGIN];
    if (!ownOrigins.includes(c.req.header('origin'))) {
      return c.json({ error: 'Sign-out must come from Flowcanvas itself.' }, 403);
    }
    const token = getCookie(c, SESSION_COOKIE, 'host');
    deleteCookie(c, SESSION_COOKIE, cookieBase);
    if (token !== undefined && c.env.DATABASE_URL) {
      try {
        await endSession(deps.database(c.env.DATABASE_URL), token);
      } catch (error) {
        deps.log(`sign-out failed: ${describeError(error)}`);
        return c.json({ error: 'Could not end the session on the server. Try again.' }, 503);
      }
    }
    return c.body(null, 204);
  });

  return auth;
}
