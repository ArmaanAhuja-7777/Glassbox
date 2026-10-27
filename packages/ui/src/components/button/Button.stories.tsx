import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Compare', kind: 'secondary', size: 'sm', disabled: false },
  argTypes: {
    kind: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { kind: 'primary', children: 'Accept' } };
export const Secondary: Story = { args: { kind: 'secondary', children: 'Compare' } };
export const Ghost: Story = { args: { kind: 'ghost', children: 'Revert step' } };
export const Danger: Story = { args: { kind: 'danger', children: 'Delete' } };

/** Matches the Figma Button component set (Kind = Primary, Secondary, Ghost, Danger), plus sizes and disabled. */
export const AllKinds: Story = {
  render: () => {
    const row = { display: 'flex', gap: vars.space['8'], alignItems: 'center' } as const;
    return (
      <div style={{ display: 'grid', gap: vars.space['16'] }}>
        <div style={row}>
          <Button kind="primary">Accept</Button>
          <Button kind="secondary">Compare</Button>
          <Button kind="ghost">Revert step</Button>
          <Button kind="danger">Delete</Button>
        </div>
        <div style={row}>
          <Button kind="primary" size="md">
            Accept
          </Button>
          <Button kind="secondary" size="md">
            Compare
          </Button>
          <Button kind="ghost" size="md">
            Revert step
          </Button>
          <Button kind="danger" size="md">
            Delete
          </Button>
        </div>
        <div style={row}>
          <Button kind="primary" disabled>
            Accept
          </Button>
          <Button kind="secondary" disabled>
            Compare
          </Button>
          <Button kind="ghost" disabled>
            Revert step
          </Button>
          <Button kind="danger" disabled>
            Delete
          </Button>
        </div>
      </div>
    );
  },
};

/** The Figma variants with the Figma component's default text; compared with the Figma PNGs by e2e/visual. */
export const FigmaVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: vars.space['16'], justifyItems: 'start' }}>
      <Button kind="primary" data-figma="Kind=Primary">
        Button
      </Button>
      <Button kind="secondary" data-figma="Kind=Secondary">
        Button
      </Button>
      <Button kind="ghost" data-figma="Kind=Ghost">
        Button
      </Button>
      <Button kind="danger" data-figma="Kind=Danger">
        Button
      </Button>
    </div>
  ),
};
