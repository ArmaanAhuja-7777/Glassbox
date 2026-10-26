import { readFile } from 'node:fs/promises';
import { parseTokens, TokenError } from './parse.js';
import type { TokenSet } from './render.js';

export interface TokenSources {
  /** JSON file with tokens shared by every theme. */
  readonly base: string;
  /** Theme name → JSON file. The first entry is the default theme. */
  readonly themes: readonly (readonly [name: string, file: string])[];
}

async function readJson(file: string): Promise<unknown> {
  const text = await readFile(file, 'utf8');
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new TokenError([], `${file} is not valid JSON: ${(error as Error).message}`);
  }
}

export async function loadTokenSet(sources: TokenSources): Promise<TokenSet> {
  const base = parseTokens(await readJson(sources.base));
  const themes = await Promise.all(
    sources.themes.map(async ([name, file]) => ({
      name,
      tokens: parseTokens(await readJson(file)),
    })),
  );
  return { base, themes };
}
