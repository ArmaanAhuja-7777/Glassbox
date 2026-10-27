import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Panel, PanelSection } from './Panel';

afterEach(cleanup);

describe('Panel', () => {
  it('is a region named by its title, with meta text', () => {
    render(
      <Panel title="Entry points" meta="26">
        <p>content</p>
      </Panel>,
    );
    const region = screen.getByRole('region', { name: 'Entry points' });
    expect(region.textContent).toContain('26');
    expect(screen.getByRole('heading', { name: 'Entry points' })).toBeTruthy();
  });

  it('borders only the edge facing the canvas (end by default)', () => {
    const { rerender } = render(<Panel title="Files" />);
    expect(screen.getByRole('region', { name: 'Files' }).dataset.edge).toBe('end');
    rerender(<Panel title="Files" edge="start" />);
    expect(screen.getByRole('region', { name: 'Files' }).dataset.edge).toBe('start');
  });

  it('groups content in labelled sections with an optional count', () => {
    render(
      <Panel title="Entry points">
        <PanelSection label="Screens" count={4}>
          <p>Item editor</p>
        </PanelSection>
      </Panel>,
    );
    const group = screen.getByRole('group', { name: 'Screens' });
    expect(group.textContent).toContain('4');
    expect(group.textContent).toContain('Item editor');
  });
});
