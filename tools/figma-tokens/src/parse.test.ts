import { describe, expect, it } from 'vitest';
import { parseTokens, TokenError } from './parse.js';

describe('parseTokens', () => {
  it('reads tokens and inherits $type from parent groups', () => {
    const tokens = parseTokens({
      color: {
        $type: 'color',
        surface: { canvas: { $value: '#0B0C0E', $description: 'Canvas' } },
      },
    });
    expect(tokens).toEqual([
      {
        path: ['color', 'surface', 'canvas'],
        type: 'color',
        value: '#0B0C0E',
        description: 'Canvas',
      },
    ]);
  });

  it('lets a token override the inherited type', () => {
    const [token] = parseTokens({
      size: { $type: 'dimension', weight: { $type: 'number', $value: 2 } },
    });
    expect(token?.type).toBe('number');
  });

  it('rejects a token without any $type', () => {
    expect(() => parseTokens({ radius: { node: { $value: 6 } } })).toThrow(
      new TokenError(
        ['radius', 'node'],
        'token has no $type (set it on the token or a parent group)',
      ),
    );
  });

  it('rejects an unsupported $type', () => {
    expect(() => parseTokens({ a: { $type: 'gradient', b: { $value: 'x' } } })).toThrow(
      /unsupported \$type/,
    );
  });

  it('rejects names that are not lowercase-with-dashes', () => {
    expect(() =>
      parseTokens({ color: { $type: 'color', onAccent: { $value: '#000000' } } }),
    ).toThrow(/color\.onAccent: names must be lowercase/);
  });

  it('rejects a document that is not an object', () => {
    expect(() => parseTokens([])).toThrow(/must contain a JSON object/);
  });
});
