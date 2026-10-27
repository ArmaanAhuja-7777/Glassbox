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
    a11y: { test: 'error' },
  },
};

export default preview;
