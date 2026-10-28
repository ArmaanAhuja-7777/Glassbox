#!/usr/bin/env node
// Usage:
//   figma-tokens --base base.tokens.json --theme dark=color.dark.tokens.json --css out.css --ts out.ts [--check]
// --check writes nothing and exits 1 if the outputs are out of date (for CI and tests).

import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { loadTokenSet } from './load.js';
import { renderCss, renderTs } from './render.js';

const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    theme: { type: 'string', multiple: true },
    css: { type: 'string' },
    ts: { type: 'string' },
    check: { type: 'boolean', default: false },
  },
});

function fail(message: string): never {
  process.stderr.write(`figma-tokens: ${message}\n`);
  process.exit(1);
}

const { base, css, ts, check } = values;
if (base === undefined || css === undefined || ts === undefined) {
  fail('--base, --css and --ts are required');
}
const themes = (values.theme ?? []).map((entry): [string, string] => {
  const [name, file] = entry.split('=');
  if (name === undefined || file === undefined || name === '' || file === '') {
    fail(`--theme must look like name=path, got "${entry}"`);
  }
  return [name, file];
});

try {
  const set = await loadTokenSet({ base, themes });
  const outputs: [string, string][] = [
    [css, renderCss(set)],
    [ts, renderTs(set)],
  ];
  if (check) {
    const stale: string[] = [];
    for (const [file, content] of outputs) {
      const current = await readFile(file, 'utf8').catch(() => '');
      if (current !== content) {
        stale.push(file);
      }
    }
    if (stale.length > 0) {
      fail(`out of date: ${stale.join(', ')}. Run the generate script.`);
    }
    process.stdout.write('figma-tokens: generated files are up to date\n');
  } else {
    await Promise.all(outputs.map(([file, content]) => writeFile(file, content)));
    process.stdout.write(`figma-tokens: wrote ${outputs.map(([file]) => file).join(', ')}\n`);
  }
} catch (error) {
  fail((error as Error).message);
}
