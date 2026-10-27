import type { ComponentPropsWithRef } from 'react';
import { classNames } from '../../class-names';
import styles from './Button.module.css';

/** Primary is the single strongest action in a view; use it at most once per view. */
export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

/** `sm` (28 px) is the default control height; `md` (32 px) is for roomier forms and dialogs. */
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  readonly kind?: ButtonKind;
  readonly size?: ButtonSize;
}

export function Button({
  kind = 'secondary',
  size = 'sm',
  // A bare <button> submits its form; most buttons in a tool UI aren't submit buttons.
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classNames(styles.button, className)}
      data-kind={kind}
      data-size={size}
    />
  );
}
