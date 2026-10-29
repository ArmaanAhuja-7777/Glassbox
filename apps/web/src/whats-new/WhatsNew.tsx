import type { ChangelogRelease, ChangelogSection } from '../changelog/parse';
import { inlineParts } from '../changelog/parse';
import styles from './WhatsNew.module.css';

function Inline({ text }: { readonly text: string }) {
  return inlineParts(text).map((part, index) => {
    if (part.kind === 'strong') return <strong key={index}>{part.text}</strong>;
    if (part.kind === 'code') return <code key={index}>{part.text}</code>;
    return part.text;
  });
}

function Section({ section }: { readonly section: ChangelogSection }) {
  const List = section.ordered ? 'ol' : 'ul';
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{section.heading}</h3>
      <List className={styles.list}>
        {section.items.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </List>
    </section>
  );
}

function Release({ release }: { readonly release: ChangelogRelease }) {
  return (
    <>
      <p className={styles.meta}>
        {[release.title, release.date].filter((part) => part !== undefined).join(' · ')}
      </p>
      {release.sections.map((section) => (
        <Section key={section.heading} section={section} />
      ))}
    </>
  );
}

export interface WhatsNewProps {
  /** Newest first, as parsed from CHANGELOG.md. */
  readonly releases: readonly ChangelogRelease[];
  /** The version this build is; its notes come first. */
  readonly version: string;
}

/** The notes for this build ("Try it" first, as written in the changelog), then earlier releases, folded. */
export function WhatsNew({ releases, version }: WhatsNewProps) {
  const current = releases.find((release) => release.version === version) ?? releases[0];
  if (current === undefined) {
    return <p>No release notes in this build.</p>;
  }
  const earlier = releases.filter((release) => release !== current);
  return (
    <div className={styles.notes}>
      <Release release={current} />
      {earlier.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.heading}>Earlier releases</h3>
          {earlier.map((release) => (
            <details key={release.version} className={styles.earlier}>
              <summary>{release.version}</summary>
              <Release release={release} />
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
