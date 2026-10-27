import { mkdirSync, writeFileSync } from 'node:fs';

export interface ReportRow {
  readonly group: string;
  readonly name: string;
  /** Paths relative to the report folder. */
  readonly figma: string;
  readonly ours: string;
  readonly diff?: string;
  readonly ratio?: number;
  readonly budget?: number;
  readonly note?: string;
}

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Writes a self-contained, static side-by-side report (no scripts, so it opens anywhere). */
export function writeReport(folder: URL, rows: readonly ReportRow[]): URL {
  mkdirSync(folder, { recursive: true });
  const groups = [...new Set(rows.map((row) => row.group))];
  const sections = groups
    .map((group) => {
      const body = rows
        .filter((row) => row.group === group)
        .map((row) => {
          const score =
            row.ratio === undefined
              ? '<td class="muted">review by eye</td>'
              : `<td class="${row.budget !== undefined && row.ratio > row.budget ? 'fail' : 'pass'}">${(row.ratio * 100).toFixed(2)}% <span class="muted">/ ${((row.budget ?? 0) * 100).toFixed(1)}%</span></td>`;
          return `<tr><th>${escape(row.name)}${row.note === undefined ? '' : `<div class="muted">${escape(row.note)}</div>`}</th>
<td><img src="${escape(row.figma)}" alt="Figma"></td><td><img src="${escape(row.ours)}" alt="Ours"></td>
<td>${row.diff === undefined ? '' : `<img src="${escape(row.diff)}" alt="Difference">`}</td>${score}</tr>`;
        })
        .join('\n');
      return `<h2>${escape(group)}</h2><table><thead><tr><th></th><th>Figma</th><th>Ours</th><th>Difference</th><th>Mismatch / budget</th></tr></thead><tbody>${body}</tbody></table>`;
    })
    .join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Figma comparison</title><style>
body{margin:24px;background:#0b0c0e;color:#edeff2;font:13px/20px system-ui,sans-serif}
h1{font-size:20px}h2{font-size:15px;margin-top:32px}table{border-collapse:collapse}
th,td{border-bottom:1px solid #2c323a;padding:8px 12px;text-align:left;vertical-align:top}
img{display:block;max-width:560px;height:auto;zoom:.5}.muted{color:#818995}.pass{color:#9fc2ad}.fail{color:#cfa09f}
</style></head><body><h1>Figma comparison</h1>
<p class="muted">Figma exports (dark, 2x) next to our components rendered at 2x. Red pixels in the difference image differ beyond the colour threshold; anti-aliasing is ignored. Screen crops contain different content, so they are reviewed by eye.</p>
${sections}</body></html>`;
  const file = new URL('index.html', folder);
  writeFileSync(file, html);
  return file;
}
