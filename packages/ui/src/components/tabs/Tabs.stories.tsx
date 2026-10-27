import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: {
    'aria-label': 'Inspector',
    variant: 'underline',
    items: [
      { id: 'details', label: 'Details' },
      { id: 'runs', label: 'Runs', count: 12 },
      { id: 'changes', label: 'Changes', count: 1 },
      { id: 'calls', label: 'Calls' },
    ],
  },
  argTypes: { variant: { control: 'inline-radio', options: ['underline', 'pill'] } },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inspector tabs from the Figma workspace screens (Details · Runs 12 · Changes 1 · Calls). */
export const Underline: Story = {
  args: {
    renderPanel: (id: string) => (
      <p style={{ margin: 0, color: vars.color.text.secondary }}>
        {id === 'details'
          ? 'Prompt template, model, parameters and output format, from the code.'
          : id === 'runs'
            ? '12 recorded runs. Values masked by default.'
            : id === 'changes'
              ? '1 change in this session.'
              : 'Callers and callees.'}
      </p>
    ),
  },
};

/** Review-bar tabs: counts as tags in the state's colours. */
export const Pill: Story = {
  args: {
    'aria-label': 'Review',
    variant: 'pill',
    items: [
      { id: 'changed', label: 'Changed', count: 3, countTone: 'modified' },
      { id: 'affected', label: 'Affected', count: 2, countTone: 'affected' },
      { id: 'tests', label: 'Tests', count: '3/4', countTone: 'modified' },
      { id: 'observed', label: 'Observed', count: 5 },
      { id: 'unverified', label: 'Unverified', count: 1 },
    ],
  },
};
