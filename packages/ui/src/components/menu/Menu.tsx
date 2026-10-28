import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Header,
  Keyboard,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  Popover,
  Separator,
  Text,
  type ButtonProps as AriaButtonProps,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  type PopoverProps,
} from 'react-aria-components';
import { classNames } from '../../class-names';
import buttonStyles from '../button/Button.module.css';
import type { ButtonKind, ButtonSize } from '../button/Button';
import styles from './Menu.module.css';

/** Groups a MenuButton and a Menu: opens on press, Enter, Space or ArrowDown; Escape closes and returns focus. */
export { MenuTrigger };

export interface MenuButtonProps extends Omit<AriaButtonProps, 'className'> {
  readonly kind?: ButtonKind;
  readonly size?: ButtonSize;
  readonly className?: string;
}

/** A trigger for a Menu, styled exactly like Button (React Aria needs its own pressable trigger). */
export function MenuButton({
  kind = 'secondary',
  size = 'sm',
  className,
  ...rest
}: MenuButtonProps) {
  return (
    <AriaButton
      {...rest}
      className={classNames(buttonStyles.button, className)}
      data-kind={kind}
      data-size={size}
    />
  );
}

export interface MenuProps<T> extends Omit<AriaMenuProps<T>, 'className'> {
  readonly className?: string;
  readonly placement?: PopoverProps['placement'];
}

/**
 * A popover menu: arrow keys move, typing jumps to an item, Enter/Space activate, Escape closes.
 * With `selectionMode="single"` it becomes a picker: items are radio items and the chosen one shows a tick.
 */
export function Menu<T extends object>({
  className,
  placement = 'bottom start',
  ...rest
}: MenuProps<T>) {
  return (
    <Popover placement={placement} offset={4} className={classNames(styles.popover)}>
      <AriaMenu {...rest} className={classNames(styles.menu, className)} />
    </Popover>
  );
}

export interface MenuItemProps extends Omit<AriaMenuItemProps, 'className' | 'children'> {
  /** The item's label; also used for type-to-select. */
  readonly children: string;
  /** A short detail after the label on the same line, e.g. "1 · 3"; screen readers hear it as the description. */
  readonly description?: string;
  /** Show the description in the code font, for references such as "@item.created". */
  readonly descriptionMono?: boolean;
  /**
   * Shown on the right in a keycap, e.g. "⌘↵". React Aria links it to the item through aria-describedby, so
   * screen readers hear the label as the name and the shortcut as its description. Display only: the
   * shortcut itself is handled elsewhere.
   */
  readonly shortcut?: string;
  /** A decorative 14 px icon before the label, e.g. a Lucide icon. */
  readonly icon?: ReactNode;
}

export function MenuItem({
  children,
  description,
  descriptionMono = false,
  shortcut,
  icon,
  ...rest
}: MenuItemProps) {
  return (
    <AriaMenuItem {...rest} textValue={children} className={classNames(styles.item)}>
      {({ isSelected, selectionMode }) => (
        <>
          {icon !== undefined && (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          )}
          <Text slot="label" className={styles.label}>
            {children}
          </Text>
          {description !== undefined && (
            <Text
              slot="description"
              className={styles.description}
              data-mono={descriptionMono || undefined}
            >
              {description}
            </Text>
          )}
          {(shortcut !== undefined || selectionMode !== 'none') && (
            <span className={styles.end}>
              {shortcut !== undefined && (
                <Keyboard className={styles.shortcut}>{shortcut}</Keyboard>
              )}
              {/* In a selectable menu React Aria marks the item checked (menuitemradio / menuitemcheckbox); the tick only shows it. */}
              {selectionMode !== 'none' && (
                <span className={styles.check} aria-hidden="true">
                  {isSelected && <Check />}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </AriaMenuItem>
  );
}

export interface MenuSectionProps {
  /** Sentence-case heading for the group, e.g. "item.created · event". */
  readonly title: string;
  readonly children: ReactNode;
}

export function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <AriaMenuSection className={classNames(styles.section)}>
      <Header className={styles.header}>{title}</Header>
      {children}
    </AriaMenuSection>
  );
}

export function MenuSeparator() {
  return <Separator className={classNames(styles.separator)} />;
}
