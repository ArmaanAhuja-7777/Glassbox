import { Button } from '@flowcanvas/ui';
import { useEffect, useState } from 'react';
import { STAGING_URL } from '../links';
import styles from './Account.module.css';
import {
  GITHUB_SIGN_IN_PATH,
  loadSession,
  signOut,
  takeSignInProblem,
  type Session,
} from './session';

interface AccountProps {
  /** Replaces the browser's fetch in tests. */
  readonly fetcher?: typeof fetch;
}

/** The "Account" row of the version page: who is signed in, or how to sign in here. Renders a <dt>/<dd> pair. */
export function Account({ fetcher = fetch }: AccountProps) {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(() =>
    takeSignInProblem(window.location, window.history),
  );

  useEffect(() => {
    let current = true;
    void loadSession(fetcher).then((loaded) => {
      if (current) setSession(loaded);
    });
    return () => {
      current = false;
    };
  }, [fetcher]);

  async function handleSignOut(): Promise<void> {
    if (await signOut(fetcher)) {
      setSession(await loadSession(fetcher));
      setMessage(undefined);
    } else {
      setMessage('Couldn’t sign out. Try again.');
    }
  }

  return (
    <>
      <dt className={styles.term}>Account</dt>
      <dd className={styles.value}>
        {/* Nothing until the API answers, so the row never flickers from "signed out" to signed in. */}
        {session !== undefined && <AccountState session={session} onSignOut={handleSignOut} />}
        {message !== undefined && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </dd>
    </>
  );
}

function AccountState({
  session,
  onSignOut,
}: {
  readonly session: Session;
  readonly onSignOut: () => Promise<void>;
}) {
  if (session.kind === 'signed-in') {
    const { displayName, email, role } = session.user;
    return (
      <span className={styles.row}>
        <span className={styles.name}>{displayName}</span>
        <span className={styles.detail}>
          {email}
          {role === 'admin' ? ' · admin' : ''}
        </span>
        <Button kind="ghost" onClick={() => void onSignOut()}>
          Sign out
        </Button>
      </span>
    );
  }
  switch (session.signIn) {
    case 'available':
      return (
        <a className={styles.link} href={GITHUB_SIGN_IN_PATH}>
          Sign in with GitHub
        </a>
      );
    case 'staging-only':
      // Branch previews have their own addresses, which GitHub won't return to (decisions log, 30 Oct 2026).
      return (
        <span className={styles.detail}>
          Sign-in works on{' '}
          <a className={styles.link} href={STAGING_URL}>
            staging
          </a>
          , not on previews.
        </span>
      );
    case 'not-configured':
      return <span className={styles.detail}>Sign-in isn’t set up on this copy.</span>;
    case 'unreachable':
      return <span className={styles.detail}>Sign-in is unavailable: the API didn’t answer.</span>;
  }
}
