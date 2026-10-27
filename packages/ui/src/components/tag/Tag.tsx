import type { ComponentPropsWithRef } from 'react';
import { classNames } from '../../class-names';
import styles from './Tag.module.css';

/**
 * Change states (added … scope) use their muted hue; neutral and accent are for non-state labels.
 * The label text must always say the state too ("+ added"), so meaning never depends on colour alone.
 */
export type TagTone =
  'added' | 'modified' | 'removed' | 'affected' | 'scope' | 'neutral' | 'accent';

export interface TagProps extends ComponentPropsWithRef<'span'> {
  readonly tone?: TagTone;
}

export function Tag({ tone = 'neutral', className, ...rest }: TagProps) {
  return <span {...rest} className={classNames(styles.tag, className)} data-tone={tone} />;
}
