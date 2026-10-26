import { describe, expect, it } from 'vitest';
import { formatBuildInfo } from './build-info.js';

describe('formatBuildInfo', () => {
  it('shortens a full commit SHA to 7 characters', () => {
    expect(
      formatBuildInfo({ version: '0.1.0', commit: '7e59ec1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e' }),
    ).toBe('0.1.0 · 7e59ec1');
  });

  it('keeps a commit that is already short', () => {
    expect(formatBuildInfo({ version: '0.1.0', commit: 'abc12' })).toBe('0.1.0 · abc12');
  });

  it('says the commit is unknown instead of inventing one', () => {
    expect(formatBuildInfo({ version: '0.1.0', commit: '  ' })).toBe('0.1.0 · unknown commit');
  });
});
