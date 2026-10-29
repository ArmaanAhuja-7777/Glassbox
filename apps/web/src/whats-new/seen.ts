import { useCallback, useState } from 'react';

export const WHATS_NEW_SEEN_KEY = 'flowcanvas-whats-new-seen';

/** The last release whose notes were opened. Storage can be missing or throw (private mode), so fall back to none. */
export function readSeenVersion(storage: Pick<Storage, 'getItem'> | undefined): string | undefined {
  try {
    return storage?.getItem(WHATS_NEW_SEEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveSeenVersion(
  storage: Pick<Storage, 'setItem'> | undefined,
  version: string,
): void {
  try {
    storage?.setItem(WHATS_NEW_SEEN_KEY, version);
  } catch {
    // Not remembering is fine: the dot just shows again next time.
  }
}

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Whether `latest` has unseen notes, and a callback that marks it seen (and remembers that). */
export function useWhatsNewSeen(
  latest: string | undefined,
): [unseen: boolean, markSeen: () => void] {
  const [seen, setSeen] = useState(() => readSeenVersion(browserStorage()));
  const markSeen = useCallback(() => {
    if (latest === undefined) return;
    saveSeenVersion(browserStorage(), latest);
    setSeen(latest);
  }, [latest]);
  return [latest !== undefined && seen !== latest, markSeen];
}
