import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle';

afterEach(cleanup);

describe('Toggle', () => {
  it('is a switch, off by default', () => {
    render(<Toggle aria-label="Trace the dev server" />);
    const toggle = screen.getByRole('switch', { name: 'Trace the dev server' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toggle.getAttribute('type')).toBe('button');
  });

  it('switches itself when uncontrolled and reports the new state', () => {
    const onCheckedChange = vi.fn();
    render(<Toggle aria-label="AI labels" defaultChecked onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'AI labels' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('follows the `checked` prop when controlled', () => {
    const onCheckedChange = vi.fn();
    render(
      <Toggle aria-label="Capture payloads" checked={false} onCheckedChange={onCheckedChange} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Capture payloads' });

    fireEvent.click(toggle);

    // The parent didn't update `checked`, so the switch stays off; it only asked to change.
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('works with parent state', () => {
    function Settings() {
      const [on, setOn] = useState(false);
      return <Toggle aria-label="Usage telemetry" checked={on} onCheckedChange={setOn} />;
    }
    render(<Settings />);
    const toggle = screen.getByRole('switch', { name: 'Usage telemetry' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('does nothing when disabled', () => {
    const onCheckedChange = vi.fn();
    render(<Toggle aria-label="Local only" disabled onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Local only' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('lets an onClick handler cancel the change', () => {
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        aria-label="Guarded"
        onClick={(event) => {
          event.preventDefault();
        }}
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Guarded' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
