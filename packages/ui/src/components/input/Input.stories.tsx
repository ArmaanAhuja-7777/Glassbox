import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const label = {
  display: 'grid',
  gap: vars.space['4'],
  fontSize: vars.text.caption.fontSize,
  fontWeight: vars.text.caption.fontWeight,
  lineHeight: vars.text.caption.lineHeight,
  color: vars.color.text.secondary,
} as const;

// An explicit type: with an inline decorator the inferred type can't be named outside Storybook (TS2883).
const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  args: { 'aria-label': 'Repository URL', placeholder: 'https://github.com/…' },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: vars.size['node-width'] }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Mono: Story = {
  args: { mono: true, defaultValue: 'https://github.com/acme/web.git' },
};

export const Invalid: Story = {
  args: { 'aria-label': 'Port', defaultValue: '80800', invalid: true },
};

export const Disabled: Story = { args: { defaultValue: 'main', disabled: true } };

/** Fields as they appear in the Figma screens: clone dialog, entry-point filter, secret input. */
export const InContext: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: vars.space['16'] }}>
      <label style={label}>
        Repository URL
        <Input mono placeholder="https://github.com/acme/web.git" />
      </label>
      <label style={label}>
        Branch
        <Input mono defaultValue="main" />
      </label>
      <Input
        controlSize="sm"
        aria-label="Filter entry points"
        placeholder="Filter"
        leading={<span aria-hidden="true">⌕</span>}
        trailing={<kbd>/</kbd>}
      />
      <label style={label}>
        DATABASE_URL
        <Input mono type="password" defaultValue="postgres://secret" autoComplete="off" />
      </label>
    </div>
  ),
};
