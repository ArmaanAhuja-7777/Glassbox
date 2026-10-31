/** The signed-in person, as the control plane's /api/me describes them. */
export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: 'member' | 'admin';
}

/** Mirrors the API's SignInState, plus `unreachable` when there is no API (e.g. `vite preview`) or it failed. */
export type SignInState = 'available' | 'staging-only' | 'not-configured' | 'unreachable';

export type Session =
  | { readonly kind: 'signed-in'; readonly user: SessionUser }
  | { readonly kind: 'signed-out'; readonly signIn: SignInState };

const SIGN_IN_STATES = new Set(['available', 'staging-only', 'not-configured']);

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.displayName === 'string' &&
    (user.role === 'member' || user.role === 'admin')
  );
}

/** Asks the API who is signed in. Never throws: anything unexpected means sign-in can't be offered. */
export async function loadSession(fetcher: typeof fetch = fetch): Promise<Session> {
  const unreachable: Session = { kind: 'signed-out', signIn: 'unreachable' };
  try {
    const response = await fetcher('/api/me', { headers: { accept: 'application/json' } });
    if (!response.ok) return unreachable;
    const body = (await response.json()) as { user?: unknown; signIn?: unknown };
    if (isSessionUser(body.user)) return { kind: 'signed-in', user: body.user };
    if (typeof body.signIn === 'string' && SIGN_IN_STATES.has(body.signIn)) {
      return { kind: 'signed-out', signIn: body.signIn as SignInState };
    }
    return unreachable;
  } catch {
    return unreachable;
  }
}

/** Ends the session on the server. Resolves to false if the server couldn't, so the UI can say so. */
export async function signOut(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetcher('/api/auth/sign-out', { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

/** Where sign-in starts. A plain navigation (not fetch), because it leaves for GitHub and comes back. */
export const GITHUB_SIGN_IN_PATH = '/api/auth/github';

/** Why sign-in came back without a session (`/?sign-in=<problem>`, set by the API), in plain words. */
export const SIGN_IN_PROBLEMS: Readonly<Record<string, string>> = {
  cancelled: 'Sign-in was cancelled on GitHub.',
  expired: 'That sign-in expired or was started in another tab. Try again.',
  'no-verified-email':
    'Your GitHub account has no verified primary email. Verify one in your GitHub email settings, then try again.',
  'not-allowed':
    'This GitHub account’s primary email isn’t on the Flowcanvas allowlist yet. Ask the admin to add it.',
  unavailable: 'Sign-in only works on staging.',
  failed: 'Sign-in failed. Try again in a moment.',
};

/** Reads and removes `?sign-in=…` from the address, so a reload doesn't show the message again. */
export function takeSignInProblem(location: Location, history: History): string | undefined {
  const url = new URL(location.href);
  const problem = url.searchParams.get('sign-in');
  if (problem === null) return undefined;
  url.searchParams.delete('sign-in');
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  return SIGN_IN_PROBLEMS[problem] ?? SIGN_IN_PROBLEMS.failed;
}
