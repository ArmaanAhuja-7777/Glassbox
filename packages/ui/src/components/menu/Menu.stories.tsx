import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, Code, Copy, Eye, Layers, Sparkle } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from './Menu';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  args: { 'aria-label': 'Event actions' },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The event context menu from Figma screen 27 (right-click on item.created): icons, inline details, keycap. */
export const EventActions: Story = {
  render: (args) => (
    <MenuTrigger defaultOpen>
      <MenuButton kind="ghost">item.created</MenuButton>
      <Menu {...args}>
        <MenuSection title="item.created · event">
          <MenuItem id="ask" icon={<Sparkle />} shortcut="⌘↵">
            Ask about this flow…
          </MenuItem>
          <MenuItem id="change" icon={<Bot />}>
            Change this flow…
          </MenuItem>
          <MenuItem id="trace" icon={<Eye />}>
            Trace a run
          </MenuItem>
          <MenuItem id="producers" icon={<Layers />} description="1 · 3">
            Producers and consumers
          </MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuItem id="open" icon={<Code />}>
          Open code
        </MenuItem>
        <MenuItem id="copy" icon={<Copy />} description="@item.created" descriptionMono>
          Copy reference
        </MenuItem>
      </Menu>
    </MenuTrigger>
  ),
  parameters: { layout: 'centered' },
};

export const Closed: Story = {
  render: (args) => (
    <MenuTrigger>
      <MenuButton>Actions</MenuButton>
      <Menu {...args}>
        <MenuItem id="open">Open code</MenuItem>
        <MenuItem id="inspect">Inspect</MenuItem>
        <MenuItem id="comment">Comment</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};

/** A single-choice picker: the chosen item is ticked (Figma screen 30, agent picker). */
export const Picker: Story = {
  render: (args) => (
    <MenuTrigger defaultOpen>
      <MenuButton>Theme: Dark</MenuButton>
      <Menu {...args} aria-label="Theme" selectionMode="single" defaultSelectedKeys={['dark']}>
        <MenuItem id="system" description="follows your OS">
          System
        </MenuItem>
        <MenuItem id="dark">Dark</MenuItem>
        <MenuItem id="light">Light</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
  parameters: { layout: 'centered' },
};
