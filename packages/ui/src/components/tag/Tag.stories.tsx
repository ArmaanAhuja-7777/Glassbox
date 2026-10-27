import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './Tag';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  args: { children: '+ added', tone: 'added' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['added', 'modified', 'removed', 'affected', 'scope', 'neutral', 'accent'],
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Matches the Figma Tag component set (Tone = Added … Accent) with the labels used across the screens. */
export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: vars.space['8'], flexWrap: 'wrap' }}>
      <Tag tone="added">+ added</Tag>
      <Tag tone="modified">~ modified</Tag>
      <Tag tone="removed">− removed</Tag>
      <Tag tone="affected">affected</Tag>
      <Tag tone="scope">outside selection</Tag>
      <Tag tone="neutral">label</Tag>
      <Tag tone="accent">flow · Save item</Tag>
    </div>
  ),
};
