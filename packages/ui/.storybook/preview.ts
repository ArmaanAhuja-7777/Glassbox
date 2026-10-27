import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import { preventReactAriaStyleInjection } from '../src/react-aria-csp';
import '../src/styles/global.css';

preventReactAriaStyleInjection();

const preview: Preview = {
  decorators: [
    // The toolbar's theme switch sets data-theme on <html>, exactly like the app does.
    withThemeByDataAttribute({
      themes: { dark: 'dark', light: 'light' },
      defaultTheme: 'dark',
      attributeName: 'data-theme',
    }),
  ],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    a11y: {
      test: 'error',
      // Page-level best-practice rules don't apply to a component shown on its own (no page landmarks or h1).
      config: {
        rules: [
          { id: 'region', enabled: false },
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
        ],
      },
    },
  },
};

export default preview;
