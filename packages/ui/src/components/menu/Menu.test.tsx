import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Menu, MenuButton, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from './Menu';

afterEach(cleanup);

function EventMenu({ onAction = vi.fn() }: { onAction?: (key: React.Key) => void }) {
  return (
    <MenuTrigger>
      <MenuButton kind="ghost">Event actions</MenuButton>
      <Menu aria-label="Event actions" onAction={onAction}>
        <MenuSection title="item.created · event">
          <MenuItem id="ask" shortcut="⌘↵">
            Ask about this flow…
          </MenuItem>
          <MenuItem id="change">Change this flow…</MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuItem id="open">Open code</MenuItem>
        <MenuItem id="copy" description="@item.created">
          Copy reference
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

describe('Menu', () => {
  it('opens from its button and lists the items, grouped under the section heading', async () => {
    const user = userEvent.setup();
    render(<EventMenu />);
    await user.click(screen.getByRole('button', { name: 'Event actions' }));

    expect(screen.getByRole('menu', { name: 'Event actions' })).toBeTruthy();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Ask about this flow…⌘↵',
      'Change this flow…',
      'Open code',
      'Copy reference@item.created',
    ]);
    expect(screen.getByRole('group', { name: 'item.created · event' })).toBeTruthy();
  });

  it('runs the chosen action and closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<EventMenu onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Event actions' }));
    await user.click(screen.getByRole('menuitem', { name: /Open code/ }));

    // React Aria calls onAction(key, …); only the key matters here.
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction.mock.calls[0]?.[0]).toBe('open');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('works from the keyboard: Enter opens, arrows move, Escape closes and returns focus', async () => {
    const user = userEvent.setup();
    render(<EventMenu />);
    const button = screen.getByRole('button', { name: 'Event actions' });
    button.focus();

    await user.keyboard('{Enter}');
    expect(document.activeElement?.textContent).toBe('Ask about this flow…⌘↵');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Change this flow…');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    // Focus is restored one frame after the menu closes.
    await waitFor(() => {
      expect(document.activeElement).toBe(button);
    });
  });

  it('names items by their label and describes them with the shortcut', async () => {
    const user = userEvent.setup();
    render(<EventMenu />);
    await user.click(screen.getByRole('button', { name: 'Event actions' }));
    const ask = screen.getByRole('menuitem', { name: 'Ask about this flow…' });
    expect(ask.getAttribute('aria-describedby')).toBe(ask.querySelector('kbd')?.id);
    expect(screen.getByRole('menuitem', { name: 'Copy reference' })).toBeTruthy();
  });

  it('styles the trigger like a Button', () => {
    render(<EventMenu />);
    expect(screen.getByRole('button', { name: 'Event actions' }).dataset.kind).toBe('ghost');
  });
});
