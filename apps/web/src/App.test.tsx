import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { CATALOGUE_URL } from './links';

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

const buildInfo = { version: '0.1.0', commit: '7e59ec1a2b3c' };

describe('App', () => {
  it('shows the product name', () => {
    render(<App buildInfo={buildInfo} />);
    expect(screen.getByRole('heading', { name: 'Flowcanvas' })).toBeTruthy();
  });

  it('shows the version and short commit it was built from', () => {
    render(<App buildInfo={buildInfo} />);
    expect(screen.getByText('0.1.0 · 7e59ec1')).toBeTruthy();
  });

  it('links to the component catalogue', () => {
    render(<App buildInfo={buildInfo} />);
    const link = screen.getByRole('link', { name: 'Open the component catalogue' });
    expect(link.getAttribute('href')).toBe(CATALOGUE_URL);
  });

  it('follows the system theme by default and switches theme from the menu', async () => {
    const user = userEvent.setup();
    render(<App buildInfo={buildInfo} />);
    expect(document.documentElement.dataset.theme).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'Theme: System' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Light' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button', { name: 'Theme: Light' })).toBeTruthy();
    expect(localStorage.getItem('flowcanvas-theme')).toBe('light');
  });
});
