// Parses design tokens in the W3C Design Tokens (DTCG) JSON format:
// groups are plain objects, a token is an object with `$value`, and `$type` is inherited from parent groups.

export type TokenType =
  | 'color'
  | 'dimension'
  | 'duration'
  | 'fontFamily'
  | 'fontWeight'
  | 'number'
  | 'shadow'
  | 'typography';

const TOKEN_TYPES: readonly TokenType[] = [
  'color',
  'dimension',
  'duration',
  'fontFamily',
  'fontWeight',
  'number',
  'shadow',
  'typography',
];

export interface Token {
  readonly path: readonly string[];
  readonly type: TokenType;
  readonly value: unknown;
  readonly description?: string;
}

export class TokenError extends Error {
  constructor(path: readonly string[], message: string) {
    super(`${path.length > 0 ? path.join('.') : '(root)'}: ${message}`);
    this.name = 'TokenError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTokenType(value: unknown): value is TokenType {
  return typeof value === 'string' && (TOKEN_TYPES as readonly string[]).includes(value);
}

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseTokens(document: unknown): Token[] {
  if (!isRecord(document)) {
    throw new TokenError([], 'a token file must contain a JSON object');
  }
  const tokens: Token[] = [];
  walk(document, [], undefined, tokens);
  return tokens;
}

function walk(
  node: Record<string, unknown>,
  path: readonly string[],
  inheritedType: TokenType | undefined,
  out: Token[],
): void {
  const ownType = node.$type;
  if (ownType !== undefined && !isTokenType(ownType)) {
    throw new TokenError(path, `unsupported $type ${JSON.stringify(ownType)}`);
  }
  const type = ownType ?? inheritedType;

  if ('$value' in node) {
    if (type === undefined) {
      throw new TokenError(path, 'token has no $type (set it on the token or a parent group)');
    }
    const description = node.$description;
    out.push({
      path,
      type,
      value: node.$value,
      ...(typeof description === 'string' ? { description } : {}),
    });
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) {
      continue;
    }
    if (!NAME_PATTERN.test(key)) {
      throw new TokenError([...path, key], 'names must be lowercase words separated by "-"');
    }
    if (!isRecord(child)) {
      throw new TokenError([...path, key], 'expected a group or a token object');
    }
    walk(child, [...path, key], type, out);
  }
}
