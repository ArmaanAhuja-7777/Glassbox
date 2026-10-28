import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover, PopoverButton, PopoverTrigger } from './Popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: { title: 'Workspace', children: null },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A short, open popover. Mock content (catalogue only). */
export const Open: Story = {
  render: () => (
    <PopoverTrigger defaultOpen>
      <PopoverButton kind="ghost">Workspace</PopoverButton>
      <Popover title="Workspace">
        Running on 4 cores in us-east. It sleeps after 10 idle minutes and resumes where you left
        off.
      </Popover>
    </PopoverTrigger>
  ),
};

/** Long content scrolls inside the popover; the title stays put. */
export const LongContent: Story = {
  render: () => (
    <PopoverTrigger defaultOpen>
      <PopoverButton kind="ghost">Release notes</PopoverButton>
      <Popover title="Release notes">
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index}>Line {index + 1} of the notes, long enough to need scrolling.</p>
        ))}
      </Popover>
    </PopoverTrigger>
  ),
};

export const Closed: Story = {
  render: () => (
    <PopoverTrigger>
      <PopoverButton>Details</PopoverButton>
      <Popover title="Build details">Built from main.</Popover>
    </PopoverTrigger>
  ),
};
