import type { ComponentPropsWithRef, ReactNode } from 'react';
import { classNames } from '../../class-names';
import styles from './Input.module.css';

/** `md` (32 px) is the default field height; `sm` (28 px) fits filters and dense toolbars. */
export type InputSize = 'sm' | 'md';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  /** Named `controlSize` because `size` is already a native <input> attribute (a character count). */
  readonly controlSize?: InputSize;
  /** JetBrains Mono, for values a developer might copy: URLs, paths, branch names, secrets. */
  readonly mono?: boolean;
  /** Marks the value as invalid for assistive technology (aria-invalid) and shows the error border. */
  readonly invalid?: boolean;
  /** Decorative content before the text, usually a 14 px icon. */
  readonly leading?: ReactNode;
  /** Content after the text: an icon, a keyboard hint, a reveal button. */
  readonly trailing?: ReactNode;
}

export function Input({
  controlSize = 'md',
  mono = false,
  invalid = false,
  leading,
  trailing,
  className,
  ...rest
}: InputProps) {
  return (
    <span
      className={classNames(styles.field, className)}
      data-size={controlSize}
      data-mono={mono || undefined}
      data-invalid={invalid || undefined}
      data-disabled={rest.disabled === true || undefined}
    >
      {leading !== undefined && (
        <span className={styles.adornment} aria-hidden="true">
          {leading}
        </span>
      )}
      <input {...rest} className={styles.input} aria-invalid={invalid || undefined} />
      {trailing !== undefined && <span className={styles.adornment}>{trailing}</span>}
    </span>
  );
}
