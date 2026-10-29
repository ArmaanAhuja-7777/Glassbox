import type { ReactNode } from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';
import { classNames } from '../../class-names';
import styles from './Popover.module.css';

/**
 * Groups a trigger and a Popover: the trigger opens it on press, Enter or Space; Escape, a click outside or
 * the trigger again closes it, and focus returns to the trigger. The trigger must be a PopoverButton.
 */
export { DialogTrigger as PopoverTrigger };

/** The trigger for a Popover: a Button that React Aria can press (same as MenuButton). */
export { MenuButton as PopoverButton } from '../menu/Menu';

export interface PopoverProps {
  /** Sentence-case title; also the dialog's accessible name. */
  readonly title: string;
  readonly children: ReactNode;
  readonly placement?: AriaPopoverProps['placement'];
  readonly className?: string;
}

/**
 * A small non-modal dialog anchored to its trigger, for supplementary content (What's new, details, help).
 * Long content scrolls inside it. Same surface, border, radius, shadow and motion as menus.
 */
export function Popover({ title, children, placement = 'bottom end', className }: PopoverProps) {
  return (
    <AriaPopover placement={placement} offset={4} className={classNames(styles.popover, className)}>
      <Dialog className={classNames(styles.dialog)}>
        <Heading slot="title" className={classNames(styles.title)}>
          {title}
        </Heading>
        {/* Focusable, so keyboard users can scroll long content (arrows, Page Down); WCAG 2.1.1. */}
        <div className={styles.body} tabIndex={0}>
          {children}
        </div>
      </Dialog>
    </AriaPopover>
  );
}
