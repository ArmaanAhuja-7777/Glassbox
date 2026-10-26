import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('shows the product name', () => {
    render(<App buildInfo={{ version: '0.1.0', commit: '7e59ec1a2b3c' }} />);
    expect(screen.getByRole('heading', { name: 'Flowcanvas' })).toBeTruthy();
  });

  it('shows the version and short commit it was built from', () => {
    render(<App buildInfo={{ version: '0.1.0', commit: '7e59ec1a2b3c' }} />);
    expect(screen.getByText('0.1.0 · 7e59ec1')).toBeTruthy();
  });
});
