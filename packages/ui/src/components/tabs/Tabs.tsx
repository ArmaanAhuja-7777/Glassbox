import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { classNames } from '../../class-names';
import { Tag, type TagTone } from '../tag/Tag';
import styles from './Tabs.module.css';

export interface TabItem {
  readonly id: string;
  readonly label: string;
  /** Shown after the label: plain muted text (underline tabs) or a tag (pill tabs). */
  readonly count?: number | string;
  /** Pill tabs only: the tag tone for the count, e.g. "modified" for "Changed 3". */
  readonly countTone?: TagTone;
}

/** `underline`: inspector and panel tabs. `pill`: review-bar tabs with count tags. */
export type TabsVariant = 'underline' | 'pill';

export interface TabsProps {
  readonly items: readonly TabItem[];
  /** Controlled selection. Leave undefined to let Tabs manage it from `defaultValue`. */
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (id: string) => void;
  readonly variant?: TabsVariant;
  /** Names the tab list for assistive technology, e.g. "Inspector". */
  readonly 'aria-label': string;
  /** Renders the content for the selected tab inside a tabpanel. Omit if the content lives elsewhere. */
  readonly renderPanel?: (id: string) => ReactNode;
  readonly className?: string;
}

/**
 * WAI-ARIA tabs with automatic activation: arrow keys move focus and selection together,
 * Home/End jump to the ends, and only the selected tab is in the Tab order ("roving tabindex").
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'underline',
  'aria-label': ariaLabel,
  renderPanel,
  className,
}: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? uncontrolled;

  const select = (id: string) => {
    if (value === undefined) {
      setUncontrolled(id);
    }
    if (id !== selected) {
      onValueChange?.(id);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const target =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined;
    const item = target === undefined ? undefined : items[target];
    if (item === undefined) {
      return;
    }
    event.preventDefault();
    select(item.id);
    tabRefs.current.get(item.id)?.focus();
  };

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  return (
    <div className={className}>
      <div role="tablist" aria-label={ariaLabel} className={styles.list} data-variant={variant}>
        {items.map((item, index) => {
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(element) => {
                if (element) {
                  tabRefs.current.set(item.id, element);
                } else {
                  tabRefs.current.delete(item.id);
                }
              }}
              id={tabId(item.id)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={renderPanel && isSelected ? panelId : undefined}
              tabIndex={isSelected ? 0 : -1}
              className={styles.tab}
              onClick={() => {
                select(item.id);
              }}
              onKeyDown={(event) => {
                onKeyDown(event, index);
              }}
            >
              <span>{item.label}</span>
              {item.count !== undefined &&
                (variant === 'pill' ? (
                  <Tag tone={item.countTone ?? 'neutral'}>{item.count}</Tag>
                ) : (
                  <span className={styles.count}>{item.count}</span>
                ))}
            </button>
          );
        })}
      </div>
      {renderPanel && selected !== undefined && (
        <div
          role="tabpanel"
          id={panelId}
          // Focusable so Tab moves from the tab list into the content (WAI-ARIA tabs pattern).
          tabIndex={0}
          aria-labelledby={tabId(selected)}
          className={classNames(styles.panel)}
        >
          {renderPanel(selected)}
        </div>
      )}
    </div>
  );
}
