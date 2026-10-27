import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/Button';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    content: 'Open the code for this node',
    children: <Button kind="ghost">Open code</Button>,
    placement: 'top',
  },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'start', 'end'] } },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover (600 ms) or Tab to a button to see its tooltip. */
export const Default: Story = {};

/** Node quick actions from the Figma screens: open code, inspect, focus agent here, comment. */
export const QuickActions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: vars.space['4'] }}>
      <Tooltip content="Open code">
        <Button kind="ghost">Code</Button>
      </Tooltip>
      <Tooltip content="Inspect this node">
        <Button kind="ghost">Inspect</Button>
      </Tooltip>
      <Tooltip content="Ask the agent about this node">
        <Button kind="ghost">Ask</Button>
      </Tooltip>
      <Tooltip content="Comment on this node">
        <Button kind="ghost">Comment</Button>
      </Tooltip>
    </div>
  ),
};
