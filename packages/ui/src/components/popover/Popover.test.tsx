import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Popover, PopoverButton, PopoverTrigger } from './Popover';

afterEach(cleanup);

function Example() {
  return (
    <PopoverTrigger>
      <PopoverButton kind="ghost">Details</PopoverButton>
      <Popover title="Build details">
        <p>Built from main.</p>
        <button type="button">Copy commit</button>
      </Popover>
    </PopoverTrigger>
  );
}

describe('Popover', () => {
  it('opens a dialog named by its title', async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Details' }));

    const dialog = screen.getByRole('dialog', { name: 'Build details' });
    expect(dialog.textContent).toContain('Built from main.');
  });

  it('opens from the keyboard, closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Build details' })).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Details' }));
    });
  });

  it('styles the trigger like a Button', () => {
    render(<Example />);
    expect(screen.getByRole('button', { name: 'Details' }).dataset.kind).toBe('ghost');
  });

  it('lets keyboard users reach the content, so long notes can be scrolled', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Details' }));
    const body = screen.getByText('Built from main.').parentElement;
    expect(body?.tabIndex).toBe(0);
  });
});
