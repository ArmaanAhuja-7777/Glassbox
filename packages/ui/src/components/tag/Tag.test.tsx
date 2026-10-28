import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Tag } from './Tag';

afterEach(cleanup);

describe('Tag', () => {
  it('shows its label with the neutral tone by default', () => {
    render(<Tag>label</Tag>);
    expect(screen.getByText('label').dataset.tone).toBe('neutral');
  });

  it('takes a change-state tone', () => {
    render(<Tag tone="added">+ added</Tag>);
    expect(screen.getByText('+ added').dataset.tone).toBe('added');
  });

  it('passes through other attributes, such as an accessible title', () => {
    render(
      <Tag tone="scope" title="Changed outside your selection">
        outside selection
      </Tag>,
    );
    expect(screen.getByTitle('Changed outside your selection').textContent).toBe(
      'outside selection',
    );
  });
});
