import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FlowNode, type FlowNodeKind } from './FlowNode';

afterEach(cleanup);

function node(): HTMLElement {
  const title = screen.getByText('createItem');
  const root = title.closest<HTMLElement>('[data-flow-node]');
  if (root === null) throw new Error('flow node root not found');
  return root;
}

describe('FlowNode', () => {
  it('shows the title and location, unchanged and unselected by default', () => {
    render(<FlowNode data-flow-node title="createItem" location="src/items/create.ts:42" />);
    expect(screen.getByText('src/items/create.ts:42')).toBeTruthy();
    expect(node().dataset.change).toBeUndefined();
    expect(node().dataset.status).toBeUndefined();
    expect(node().dataset.selected).toBeUndefined();
    expect(
      screen.queryByText(/added|modified|removed|affected|outside|failing|analysing/),
    ).toBeNull();
  });

  it('names the node type for screen readers through its icon', () => {
    const kinds: [FlowNodeKind, string][] = [
      ['function', 'Function'],
      ['data', 'Data'],
      ['external', 'External service'],
    ];
    for (const [kind, label] of kinds) {
      render(<FlowNode kind={kind} title={kind} location="a.ts:1" />);
      expect(screen.getByRole('img', { name: label })).toBeTruthy();
      cleanup();
    }
  });

  it.each([
    ['added', '+\u00a0added', 'added'],
    ['modified', '~\u00a0modified', 'modified'],
    ['removed', '−\u00a0removed', 'removed'],
    ['affected', 'affected', 'affected'],
    ['scope', 'outside selection', 'scope'],
  ] as const)('labels the %s change with text, not colour alone', (change, visible, tone) => {
    render(<FlowNode data-flow-node title="createItem" location="a.ts:1" change={change} />);
    expect(node().dataset.change).toBe(change);
    const tag = node().querySelector<HTMLElement>('[data-tone]');
    expect(tag?.textContent).toBe(visible);
    expect(tag?.dataset.tone).toBe(tone);
  });

  it('hides the symbol prefix from screen readers', () => {
    render(<FlowNode data-flow-node title="createItem" location="a.ts:1" change="modified" />);
    const symbol = node().querySelector('[aria-hidden="true"]:not(svg)');
    expect(symbol?.textContent.trim()).toBe('~');
    expect(screen.getByText('modified')).toBeTruthy();
  });

  it('shows a status alongside a change', () => {
    render(
      <FlowNode
        data-flow-node
        title="createItem"
        location="a.ts:1"
        change="modified"
        status="failing"
      />,
    );
    const tones = [...node().querySelectorAll<HTMLElement>('[data-tone]')].map((tag) => [
      tag.textContent,
      tag.dataset.tone,
    ]);
    expect(tones).toEqual([
      ['~\u00a0modified', 'modified'],
      ['failing', 'removed'],
    ]);
  });

  it('marks an analysing node busy, so stale values are never read as current', () => {
    render(<FlowNode data-flow-node title="createItem" location="a.ts:1" status="analysing" />);
    expect(node().getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('analysing…')).toBeTruthy();
  });

  it('reflects selection and passes other attributes through', () => {
    render(
      <FlowNode
        data-flow-node
        title="createItem"
        location="a.ts:1"
        selected
        className="extra"
        id="node-1"
      />,
    );
    expect(node().dataset.selected).toBe('true');
    expect(node().id).toBe('node-1');
    expect(node().classList.contains('extra')).toBe(true);
    expect(node().hasAttribute('aria-busy')).toBe(false);
  });
});
