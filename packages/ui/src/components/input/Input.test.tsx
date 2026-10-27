import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

afterEach(cleanup);

describe('Input', () => {
  it('is a text box named by its label', () => {
    render(
      <>
        <label htmlFor="repo">Repository URL</label>
        <Input id="repo" placeholder="https://github.com/…" />
      </>,
    );
    const box = screen.getByRole('textbox', { name: 'Repository URL' });
    expect(box.getAttribute('placeholder')).toBe('https://github.com/…');
  });

  it('reports changes', () => {
    const onChange = vi.fn();
    render(<Input aria-label="Branch" defaultValue="main" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Branch' }), {
      target: { value: 'phase/1a' },
    });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('marks an invalid value for assistive technology and styling', () => {
    render(<Input aria-label="Port" invalid />);
    const box = screen.getByRole('textbox', { name: 'Port' });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.parentElement?.dataset.invalid).toBe('true');
  });

  it('does not set aria-invalid when the value is valid', () => {
    render(<Input aria-label="Port" />);
    expect(screen.getByRole('textbox', { name: 'Port' }).hasAttribute('aria-invalid')).toBe(false);
  });

  it('renders leading and trailing content, hiding the decorative leading icon', () => {
    render(
      <Input aria-label="Filter" leading={<span data-testid="icon" />} trailing={<kbd>/</kbd>} />,
    );
    expect(screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('/').tagName).toBe('KBD');
  });

  it('takes a size, mono text and forwards the ref to the <input>', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Path" controlSize="sm" mono />);
    const box = screen.getByRole('textbox', { name: 'Path' });
    expect(ref.current).toBe(box);
    expect(box.parentElement?.dataset.size).toBe('sm');
    expect(box.parentElement?.dataset.mono).toBe('true');
  });
});
