import { Tag, Toggle } from '@flowcanvas/ui';
import { useLabs } from './LabsProvider';
import styles from './LabsPanel.module.css';

/** The Labs switches, as settings rows (Figma 17 style); an honest empty state when there are none. */
export function LabsPanel() {
  const { flags, isOn, setOn } = useLabs();
  if (flags.length === 0) {
    return (
      <p className={styles.empty}>
        No previews right now. Unfinished features appear here as switches, off by default, so you
        can try them early.
      </p>
    );
  }
  return (
    <ul className={styles.list}>
      {flags.map((flag) => (
        <li key={flag.id} className={styles.row}>
          <div className={styles.text}>
            <span className={styles.label} id={`labs-${flag.id}-label`}>
              {flag.label}
              <Tag tone="neutral">Preview</Tag>
            </span>
            <span className={styles.description} id={`labs-${flag.id}-description`}>
              {flag.description} Finished in phase {flag.phase}.
            </span>
          </div>
          <Toggle
            checked={isOn(flag.id)}
            onCheckedChange={(on) => {
              setOn(flag.id, on);
            }}
            aria-labelledby={`labs-${flag.id}-label`}
            aria-describedby={`labs-${flag.id}-description`}
          />
        </li>
      ))}
    </ul>
  );
}
