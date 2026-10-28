import { formatBuildInfo, type BuildInfo } from '@flowcanvas/graph-model';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverButton,
  PopoverTrigger,
  useThemePreference,
  type ThemePreference,
} from '@flowcanvas/ui';
import releases from 'virtual:changelog';
import styles from './App.module.css';
import { CATALOGUE_URL } from './links';
import { useWhatsNewSeen } from './whats-new/seen';
import { WhatsNew } from './whats-new/WhatsNew';

interface AppProps {
  readonly buildInfo: BuildInfo;
}

const THEMES: readonly { readonly id: ThemePreference; readonly label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

function themeLabel(preference: ThemePreference): string {
  return THEMES.find((theme) => theme.id === preference)?.label ?? 'System';
}

export function App({ buildInfo }: AppProps) {
  const [theme, setTheme] = useThemePreference();
  const [unseen, markSeen] = useWhatsNewSeen(releases[0]?.version);
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Flowcanvas</h1>
        <p className={styles.summary}>
          A canvas-first development environment. This build has the Graphite design system; the
          canvas comes in the next phases.
        </p>
        <dl className={styles.facts}>
          <dt className={styles.term}>Build</dt>
          <dd className={styles.build}>{formatBuildInfo(buildInfo)}</dd>
        </dl>
        <div className={styles.actions}>
          <a className={styles.link} href={CATALOGUE_URL}>
            Open the component catalogue
          </a>
          <div className={styles.controls}>
            <PopoverTrigger
              onOpenChange={(open) => {
                if (open) markSeen();
              }}
            >
              <PopoverButton
                kind="ghost"
                aria-label={unseen ? "What's new (new changes)" : "What's new"}
              >
                What&apos;s new
                {/* A state dot only when something changed since the notes were last opened. */}
                {unseen && <span className={styles.dot} aria-hidden="true" />}
              </PopoverButton>
              <Popover title={`What's new in ${buildInfo.version}`}>
                <WhatsNew releases={releases} version={buildInfo.version} />
              </Popover>
            </PopoverTrigger>
            <MenuTrigger>
              <MenuButton aria-label={`Theme: ${themeLabel(theme)}`}>
                Theme: {themeLabel(theme)}
              </MenuButton>
              <Menu
                aria-label="Theme"
                placement="bottom end"
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[theme]}
                onSelectionChange={(keys) => {
                  const next = keys === 'all' ? undefined : THEMES.find(({ id }) => keys.has(id));
                  if (next !== undefined) setTheme(next.id);
                }}
              >
                {THEMES.map(({ id, label }) => (
                  <MenuItem
                    key={id}
                    id={id}
                    {...(id === 'system' ? { description: 'follows your OS' } : {})}
                  >
                    {label}
                  </MenuItem>
                ))}
              </Menu>
            </MenuTrigger>
          </div>
        </div>
      </div>
    </main>
  );
}
