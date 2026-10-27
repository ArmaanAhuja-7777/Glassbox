import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { classNames } from '../../class-names';
import styles from './Panel.module.css';

/** Which side faces the canvas: the only side with a border (Graphite: "1 px edge toward the canvas only"). */
export type PanelEdge = 'start' | 'end' | 'top' | 'bottom' | 'none';

export interface PanelProps extends Omit<ComponentPropsWithRef<'section'>, 'title'> {
  readonly title: string;
  /** Short text on the right of the header, e.g. a count ("26") or a project name. */
  readonly meta?: ReactNode;
  readonly edge?: PanelEdge;
}

/** A side panel: panel surface, a header naming it, and content arranged in sections. */
export function Panel({ title, meta, edge = 'end', className, children, ...rest }: PanelProps) {
  const titleId = useId();
  return (
    <section
      {...rest}
      aria-labelledby={titleId}
      className={classNames(styles.panel, className)}
      data-edge={edge}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {meta !== undefined && <span className={styles.meta}>{meta}</span>}
      </header>
      {children}
    </section>
  );
}

export interface PanelSectionProps extends ComponentPropsWithRef<'div'> {
  readonly label: string;
  readonly count?: number | string;
}

/**
 * A group inside a panel, introduced by an 11 px sentence-case label. Groups are separated by
 * spacing, not borders or cards (Graphite: "fewer boxes").
 */
export function PanelSection({ label, count, className, children, ...rest }: PanelSectionProps) {
  const labelId = useId();
  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={labelId}
      className={classNames(styles.section, className)}
    >
      <div className={styles.sectionHeader}>
        <span id={labelId}>{label}</span>
        {count !== undefined && <span>{count}</span>}
      </div>
      {children}
    </div>
  );
}
