import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { LABS_FLAGS, type LabsFlag } from './flags';
import { readLabs, saveLabs, type LabsState } from './storage';

interface LabsContextValue {
  readonly flags: readonly LabsFlag[];
  readonly isOn: (id: string) => boolean;
  readonly setOn: (id: string, on: boolean) => void;
}

const LabsContext = createContext<LabsContextValue | undefined>(undefined);

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export interface LabsProviderProps {
  /** Defaults to the real registry; tests pass their own test-only switches. */
  readonly flags?: readonly LabsFlag[];
  readonly children: ReactNode;
}

/** Holds the Labs switch states for the whole app and remembers them in this browser. */
export function LabsProvider({ flags = LABS_FLAGS, children }: LabsProviderProps) {
  const known = useMemo(() => flags.map((flag) => flag.id), [flags]);
  const [state, setState] = useState<LabsState>(() => readLabs(browserStorage(), known));
  const isOn = useCallback((id: string) => state[id] === true, [state]);
  const setOn = useCallback(
    (id: string, on: boolean) => {
      if (!known.includes(id)) return;
      setState((current) => {
        const next = { ...current, [id]: on };
        saveLabs(browserStorage(), next);
        return next;
      });
    },
    [known],
  );
  const value = useMemo(() => ({ flags, isOn, setOn }), [flags, isOn, setOn]);
  return <LabsContext value={value}>{children}</LabsContext>;
}

export function useLabs(): LabsContextValue {
  const value = use(LabsContext);
  if (value === undefined) throw new Error('useLabs must be used inside <LabsProvider>');
  return value;
}

/** Renders its children only while the Labs switch `id` is on. Wrap unfinished features in it. */
export function LabsFeature({
  id,
  children,
}: {
  readonly id: string;
  readonly children: ReactNode;
}) {
  return useLabs().isOn(id) ? children : null;
}
