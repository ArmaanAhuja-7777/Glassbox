import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { compare, crop, flatten, hexToRgb, readPng, writePng } from './images.js';
import { writeReport, type ReportRow } from './report.js';
import { openStory, REPO_ROOT } from './storybook.js';

// Phase 1a "Done when": each component matches its Figma counterpart in a side-by-side screenshot test.
// Figma is dark only, so everything here is compared in dark; light is covered by the catalogue baselines.

const EXPORTS = new URL('docs/reference/figma-exports/', REPO_ROOT);
const REPORT = new URL('e2e/visual-report/', REPO_ROOT);
const SCALE = 2;

/** The page background the Figma exports are flattened onto: the dark canvas token. */
function canvasColour(): [number, number, number] {
  const css = readFileSync(new URL('packages/tokens/css/tokens.css', REPO_ROOT), 'utf8');
  const match = /--color-surface-canvas:\s*(#[0-9a-f]{6})/i.exec(css);
  if (match?.[1] === undefined) throw new Error('--color-surface-canvas not found in tokens.css');
  return hexToRgb(match[1]);
}

/**
 * Mismatch budgets: the share of pixels allowed to differ from the Figma export. Measured on 27 Oct 2026,
 * then set just above. The floor (2–4%) is font rasterisation: Figma draws Inter 3, we ship Inter 4 (slightly
 * different glyph widths), and Chrome hints differently. A 1–2 px layout error measures 5–15%, so it fails.
 * Higher budgets are deliberate differences, each recorded in docs/decisions-log.md.
 */
const COMPONENTS = [
  {
    folder: 'tag',
    story: 'components-tag--figma-variants',
    budget: 0.06,
    overrides: {
      // Figma still has the muted palette; the tokens moved to Signal (28 Oct 2026). Restore to 6% once
      // Figma's colour variables are updated and the PNGs re-exported (upgrade-later item 19).
      'Tone=Accent': 0.09,
      'Tone=Added': 0.09,
    },
  },
  {
    folder: 'button',
    story: 'components-button--figma-variants',
    budget: 0.04,
    overrides: {
      // Figma's export of the bordered button is 2 px wider (61 vs 59) than its layout box; ours is 59.
      'Kind=Secondary': 0.07,
    },
  },
  {
    folder: 'flow-node',
    story: 'components-flow-node--figma-variants',
    budget: 0.05,
    overrides: {
      // Tag text (Inter 3 vs 4) plus the location in text/muted instead of tertiary (contrast).
      'State=Added': 0.07,
      'State=Modified': 0.07,
      'State=Failing': 0.07,
      // Figma's selected node is 57 px tall (its 1.5 px stroke rounds the auto height up); ours stays 56.
      // Plus the outline colour: Figma has the muted steel blue, the tokens Signal blue (was 7%; item 19).
      'State=Selected': 0.11,
      // Violet dashed outline vs Figma's muted lavender (was 5%; item 19).
      'State=Affected': 0.06,
      // Strikethrough (Graphite) and no opacity dimming of the location (contrast).
      'State=Removed': 0.08,
    },
  },
] as const satisfies readonly {
  folder: string;
  story: string;
  budget: number;
  overrides: Readonly<Record<string, number>>;
}[];

const background = canvasColour();

/**
 * Each test writes its rows to disk, so the report is complete even when a test fails (Playwright then
 * restarts the worker and in-memory state is lost).
 */
function record(group: string, rows: readonly ReportRow[]): void {
  mkdirSync(new URL('rows/', REPORT), { recursive: true });
  writeFileSync(new URL(`rows/${group}.json`, REPORT), JSON.stringify(rows));
}

function recordedRows(): ReportRow[] {
  const folder = new URL('rows/', REPORT);
  return readdirSync(folder)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => JSON.parse(readFileSync(new URL(file, folder), 'utf8')) as ReportRow[]);
}

function save(relative: string, png: Parameters<typeof writePng>[0]): string {
  const file = new URL(relative, REPORT);
  mkdirSync(new URL('./', file), { recursive: true });
  writeFileSync(file, writePng(png));
  return relative;
}

for (const { folder, story, budget: defaultBudget, overrides } of COMPONENTS) {
  test(`${folder} matches Figma`, async ({ page }) => {
    await openStory(page, story, 'dark');
    const variants = readdirSync(new URL(`${folder}/`, EXPORTS)).filter((file) =>
      file.endsWith('.png'),
    );
    expect(variants.length).toBeGreaterThan(0);

    const rows: ReportRow[] = [];
    const failures: string[] = [];
    for (const file of variants) {
      const variant = file.replace(/\.png$/, '');
      const budget = (overrides as Readonly<Record<string, number>>)[variant] ?? defaultBudget;
      let figma = flatten(readPng(new URL(`${folder}/${file}`, EXPORTS)), background);

      // Clip an area the size of the Figma export around our component. Horizontally it is centred: widths
      // differ by effects such as the selection halo (equal on both sides) or by font rendering. Vertically
      // it starts at our top edge, moved up by the same effect margin only when Figma's export is taller
      // (a wrapped title makes Figma taller at the bottom, not the top).
      const box = await page.locator(`[data-figma="${variant}"]`).boundingBox();
      if (box === null) throw new Error(`no element with data-figma="${variant}" in ${story}`);
      const width = figma.width / SCALE;
      const height = figma.height / SCALE;
      const effect = Math.max(0, (width - box.width) / 2);
      const top = height > box.height + 1 ? box.y - effect : box.y;
      let ours = readPng(
        await page.screenshot({
          animations: 'disabled',
          clip: { x: box.x + (box.width - width) / 2, y: top, width, height },
        }),
      );

      // Figma's export reserves room for the selection halo but draws it transparent (spread on a drop shadow
      // doesn't export); Graphite and the Figma screens do show it. Compare the node itself, inside that margin.
      const margin = Math.round(effect * SCALE);
      if (margin > 0) {
        const inner = (image: typeof figma) =>
          crop(image, margin, margin, image.width - 2 * margin, image.height - 2 * margin);
        figma = inner(figma);
        ours = inner(ours);
      }

      const { ratio, diff } = compare(figma, ours);
      const sizeNote = `ours ${String(box.width)}×${String(box.height)}, Figma ${String(width)}×${String(height)} (incl. effects)`;
      rows.push({
        group: folder,
        name: variant,
        figma: save(`${folder}/${variant}.figma.png`, figma),
        ours: save(`${folder}/${variant}.ours.png`, ours),
        diff: save(`${folder}/${variant}.diff.png`, diff),
        ratio,
        budget,
        note: sizeNote,
      });
      if (ratio > budget)
        failures.push(`${variant}: ${(ratio * 100).toFixed(2)}% > ${(budget * 100).toFixed(1)}%`);
    }
    record(folder, rows);
    expect(failures).toEqual([]);
  });
}

interface Crop {
  readonly name: string;
  readonly screen: string;
  readonly rect: readonly [number, number, number, number];
  readonly story: string;
}

test('screen crops next to their stories (reviewed by eye)', async ({ page }) => {
  const rows: ReportRow[] = [];
  const { crops } = JSON.parse(readFileSync(new URL('screens/crops.json', EXPORTS), 'utf8')) as {
    crops: Crop[];
  };
  for (const { name, screen, rect, story } of crops) {
    const [x, y, w, h] = rect.map((value) => value * SCALE) as [number, number, number, number];
    const figma = crop(readPng(new URL(`screens/${screen}`, EXPORTS)), x, y, w, h);
    await openStory(page, story, 'dark');
    const ours = readPng(await page.screenshot({ animations: 'disabled' }));
    const slug = story.replace(/^components-/, '');
    rows.push({
      group: 'Screen crops',
      name,
      figma: save(`screens/${slug}.figma.png`, figma),
      ours: save(`screens/${slug}.ours.png`, ours),
      note: `${screen} · story ${story}`,
    });
  }
  record('screens', rows);
  expect(rows).toHaveLength(crops.length);
});

test.afterAll(() => {
  const file = writeReport(REPORT, recordedRows());
  console.log(`Figma comparison report: ${file.pathname}`);
});
