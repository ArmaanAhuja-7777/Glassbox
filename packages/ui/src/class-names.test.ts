import { describe, expect, it } from 'vitest';
import { classNames } from './class-names';

describe('classNames', () => {
  it('joins the names that are present and skips empty ones', () => {
    expect(classNames('a', undefined, false, null, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is present', () => {
    expect(classNames(undefined, false)).toBe('');
  });
});
