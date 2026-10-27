import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, MenuButton, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from './Menu';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  args: { 'aria-label': 'Event actions' },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The event context menu from the Figma prompting screens (right-click on item.created). */
export const EventActions: Story = {
  render: (args) => (
    <MenuTrigger defaultOpen>
      <MenuButton kind="ghost">item.created</MenuButton>
      <Menu {...args}>
        <MenuSection title="item.created · event">
          <MenuItem id="ask" shortcut="⌘↵">
            Ask about this flow…
          </MenuItem>
          <MenuItem id="change">Change this flow…</MenuItem>
          <MenuItem id="trace">Trace a run</MenuItem>
          <MenuItem id="producers" description="1 producer · 3 consumers">
            Producers and consumers
          </MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuItem id="open">Open code</MenuItem>
        <MenuItem id="copy" description="@item.created">
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
