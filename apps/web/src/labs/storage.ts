export const LABS_STORAGE_KEY = 'flowcanvas-labs';

export type LabsState = Readonly<Record<string, boolean>>;

/**
 * The switches this browser turned on. Unknown or malformed entries are dropped, and blocked storage
 * (private mode, site data off) means everything stays off.
 */
export function readLabs(
  storage: Pick<Storage, 'getItem'> | undefined,
  known: readonly string[],
): LabsState {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(LABS_STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([id, on]) => known.includes(id) && on === true),
    );
  } catch {
    return {};
  }
}

export function saveLabs(storage: Pick<Storage, 'setItem'> | undefined, state: LabsState): void {
  try {
    storage?.setItem(LABS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Not remembering is fine: switches just start off next time.
  }
}
