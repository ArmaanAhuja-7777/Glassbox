import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../button/Button';
import { Tooltip } from './Tooltip';

afterEach(cleanup);

describe('Tooltip', () => {
  it('shows on keyboard focus and describes its trigger', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Open the code for this node">
        <Button kind="ghost">Open code</Button>
      </Tooltip>,
    );

    await user.tab();

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toBe('Open the code for this node');
    const trigger = screen.getByRole('button', { name: 'Open code' });
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('shows on hover after the delay and hides when the pointer leaves', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Share this view" delay={0}>
        <Button>Share</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Share' });

    // React Aria ignores hover until it has seen a real pointer interaction (as a real mouse always gives).
    await user.click(document.body);
    await user.hover(trigger);
    expect((await screen.findByRole('tooltip')).textContent).toBe('Share this view');

    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('hides on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Accept all changes">
        <Button kind="primary">Accept</Button>
      </Tooltip>,
    );
    await user.tab();
    await screen.findByRole('tooltip');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
