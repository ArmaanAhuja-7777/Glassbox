/**
 * Reads CHANGELOG.md (Keep a Changelog format, https://keepachangelog.com) into data for the What's new panel.
 * Runs at build time (see vite.config.ts), so the panel always shows exactly what the changelog says.
 */

export interface ChangelogSection {
  /** "Added", "Changed", "Security", "Try it", … */
  readonly heading: string;
  /** True when the items were a numbered list (e.g. Try it steps). */
  readonly ordered: boolean;
  /** One entry per list item; may contain **bold** and `code`. */
  readonly items: readonly string[];
}

export interface ChangelogRelease {
  readonly version: string;
  /** ISO date, e.g. 2026-10-28. */
  readonly date: string | undefined;
  /** Text after the date, e.g. "Phase 1a: design system in code". */
  readonly title: string | undefined;
  readonly sections: readonly ChangelogSection[];
}

// "## [0.2.0] — 2026-10-28 — Phase 1a: design system in code" (em or plain dashes; date and title optional).
const RELEASE = /^## \[([^\]]+)\](?:\s+[—–-]\s+(\d{4}-\d{2}-\d{2}))?(?:\s+[—–-]\s+(.+?))?\s*$/;
const SECTION = /^### (.+?)\s*$/;
const ITEM = /^\s*([-*]|\d+\.)\s+(.*)$/;
const CONTINUATION = /^\s{2,}(\S.*)$/;

interface MutableSection {
  heading: string;
  ordered: boolean;
  items: string[];
}

export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: { version: string; date?: string; title?: string; sections: MutableSection[] }[] =
    [];
  for (const line of markdown.split(/\r?\n/)) {
    const release = RELEASE.exec(line);
    if (release) {
      releases.push({
        version: release[1] ?? '',
        ...(release[2] === undefined ? {} : { date: release[2] }),
        ...(release[3] === undefined ? {} : { title: release[3] }),
        sections: [],
      });
      continue;
    }
    const current = releases.at(-1);
    if (current === undefined) continue;
    const section = SECTION.exec(line);
    if (section) {
      current.sections.push({ heading: section[1] ?? '', ordered: false, items: [] });
      continue;
    }
    const open = current.sections.at(-1);
    if (open === undefined) continue;
    const item = ITEM.exec(line);
    if (item) {
      if (open.items.length === 0) open.ordered = /\d/.test(item[1] ?? '');
      open.items.push((item[2] ?? '').trim());
      continue;
    }
    const continuation = CONTINUATION.exec(line);
    if (continuation && open.items.length > 0) {
      const last = open.items.length - 1;
      open.items[last] = `${open.items[last] ?? ''} ${(continuation[1] ?? '').trim()}`;
    }
  }
  // "Unreleased" isn't part of any build, and empty headings carry nothing to show.
  return releases
    .filter((release) => release.version.toLowerCase() !== 'unreleased')
    .map((release) => ({
      version: release.version,
      date: release.date,
      title: release.title,
      sections: release.sections.filter((section) => section.items.length > 0),
    }));
}

export type InlinePart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'strong'; readonly text: string }
  | { readonly kind: 'code'; readonly text: string };

/** Splits an item into plain text, **bold** and `code`. Never produces HTML, so nothing can be injected. */
export function inlineParts(item: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let rest = item;
  const token = /\*\*([^*]+)\*\*|`([^`]+)`/;
  for (let match = token.exec(rest); match; match = token.exec(rest)) {
    if (match.index > 0) parts.push({ kind: 'text', text: rest.slice(0, match.index) });
    if (match[1] !== undefined) parts.push({ kind: 'strong', text: match[1] });
    else parts.push({ kind: 'code', text: match[2] ?? '' });
    rest = rest.slice(match.index + match[0].length);
  }
  if (rest !== '') parts.push({ kind: 'text', text: rest });
  return parts;
}
