/**
 * Labs: unfinished features that can go live behind a switch, off by default and marked as a preview,
 * so `main` stays shippable while a feature takes several phases. When a feature is finished, delete its
 * entry here and its <LabsFeature> wrappers: it is then simply on for everyone.
 */
export interface LabsFlag {
  /** Stable kebab-case id, e.g. "canvas-minimap". Stored in the browser, so don't rename it. */
  readonly id: string;
  /** Sentence case, e.g. "Canvas minimap". */
  readonly label: string;
  /** What turning it on shows, and what is still unfinished. */
  readonly description: string;
  /** The build-plan phase that finishes it, e.g. "2". */
  readonly phase: string;
}

/** Every switch ships off. Empty: nothing is half-built right now. */
export const LABS_FLAGS: readonly LabsFlag[] = [];
