import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('is a secondary, small, non-submitting button by default', () => {
    render(<Button>Compare</Button>);
    const button = screen.getByRole('button', { name: 'Compare' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.dataset.kind).toBe('secondary');
    expect(button.dataset.size).toBe('sm');
  });

  it('takes a kind, a size and an explicit submit type', () => {
    render(
      <Button kind="primary" size="md" type="submit">
        Accept
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Accept' });
    expect(button.dataset.kind).toBe('primary');
    expect(button.dataset.size).toBe('md');
    expect(button.getAttribute('type')).toBe('submit');
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Revert step</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Revert step' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Delete
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps extra class names and forwards the ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="extra">
        Share
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Share' });
    expect(button.classList.contains('extra')).toBe(true);
    expect(ref.current).toBe(button);
  });
});
