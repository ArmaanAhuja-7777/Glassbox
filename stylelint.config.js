// Component and global CSS may only use design tokens for colour, type, spacing, radius, shadow and motion.
// Raw values are rejected, so a token change reaches every component.
/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: ['**/dist/**', 'packages/tokens/css/**'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
    ],
    'declaration-property-unit-allowed-list': {
      '/^font/': [],
      'line-height': [],
      'letter-spacing': [],
      '/radius$/': [],
      '/^(padding|margin|gap|row-gap|column-gap|inset)/': [],
      '/^outline-(width|offset)$/': [],
      'box-shadow': [],
      '/^(transition|animation)/': [],
    },
    'declaration-property-value-disallowed-list': {
      'font-weight': ['/^\\d/'],
      'font-family': ['/^(?!var\\(|inherit)/'],
    },
  },
};
