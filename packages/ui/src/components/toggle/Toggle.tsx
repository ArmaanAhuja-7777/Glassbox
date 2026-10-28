import { useState, type ComponentPropsWithRef } from 'react';
import { classNames } from '../../class-names';
import styles from './Toggle.module.css';

export interface ToggleProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'onChange' | 'role' | 'type' | 'value'
> {
  /** Controlled state. Leave undefined to let the toggle manage its own state from `defaultChecked`. */
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
}

/**
 * An on/off switch. Renders a <button role="switch"> so Space and Enter work natively and screen
 * readers announce "on"/"off". Give it a name with `aria-label` or `aria-labelledby`.
 */
export function Toggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  onClick,
  className,
  ...rest
}: ToggleProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : uncontrolled;

  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={isOn}
      className={classNames(styles.toggle, className)}
      data-state={isOn ? 'on' : 'off'}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (!isControlled) {
          setUncontrolled(!isOn);
        }
        onCheckedChange?.(!isOn);
      }}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
