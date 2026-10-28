import { themeValues, vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import styles from './Foundations.module.css';

const colorNames = Object.keys(themeValues.dark).filter((name) => name.startsWith('--color-'));

const textStyles = Object.keys(vars.text) as (keyof typeof vars.text)[];

const spaceSteps = Object.keys(vars.space) as (keyof typeof vars.space)[];

function Colors() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Colour</h2>
      <p className={styles.caption}>Every colour token for the theme selected in the toolbar.</p>
      <div className={styles.swatches}>
        {colorNames.map((name) => (
          <div key={name} className={styles.swatch}>
            <span className={styles.chip} style={{ background: `var(${name})` }} />
            <span className={styles.mono}>{name.slice('--color-'.length)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Typography() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Type</h2>
      {textStyles.map((name) => {
        const style = vars.text[name];
        return (
          <div key={name} className={styles.type}>
            <span className={styles.mono}>{name}</span>
            <span
              style={{
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
              }}
            >
              Save item · worker/process.ts:42
            </span>
          </div>
        );
      })}
    </section>
  );
}

function Spacing() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Space</h2>
      <p className={styles.caption}>4 px grid. Inside components 4–12, between groups 16–24.</p>
      {spaceSteps.map((step) => (
        <div key={step} className={styles.space}>
          <span className={styles.mono}>space-{step}</span>
          <span className={styles.bar} style={{ inlineSize: vars.space[step] }} />
        </div>
      ))}
    </section>
  );
}

function Foundations() {
  return (
    <div className={styles.page}>
      <Colors />
      <Typography />
      <Spacing />
    </div>
  );
}

const meta = {
  title: 'Foundations/Tokens',
  component: Foundations,
} satisfies Meta<typeof Foundations>;

export default meta;

export const Tokens: StoryObj<typeof meta> = {};
