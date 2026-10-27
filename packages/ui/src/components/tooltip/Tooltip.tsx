import type { ComponentProps, ReactNode } from 'react';
import {
  Focusable,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps as AriaTooltipProps,
} from 'react-aria-components';
import { classNames } from '../../class-names';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** Short supplementary text. Never put essential information or interactive content in a tooltip. */
  readonly content: ReactNode;
  /** One focusable element, e.g. a Button. It gets `aria-describedby` pointing at the tooltip. */
  readonly children: ComponentProps<typeof Focusable>['children'];
  readonly placement?: AriaTooltipProps['placement'];
  /** Milliseconds of hover before showing. Keyboard focus shows it immediately. */
  readonly delay?: number;
}

/** Shows on hover (after a delay) and on keyboard focus; Escape or leaving hides it. */
export function Tooltip({ content, children, placement = 'top', delay = 600 }: TooltipProps) {
  return (
    <TooltipTrigger delay={delay} closeDelay={0}>
      <Focusable>{children}</Focusable>
      <AriaTooltip placement={placement} offset={6} className={classNames(styles.tooltip)}>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
