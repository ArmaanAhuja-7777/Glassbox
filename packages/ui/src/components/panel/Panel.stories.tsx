import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../input/Input';
import { Panel, PanelSection } from './Panel';

const meta = {
  title: 'Components/Panel',
  component: Panel,
  args: { title: 'Entry points', meta: '26', edge: 'end' },
  argTypes: {
    edge: { control: 'inline-radio', options: ['start', 'end', 'top', 'bottom', 'none'] },
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = {
  display: 'flex',
  alignItems: 'center',
  blockSize: vars.size.row.compact,
  paddingInline: vars.space['8'],
  borderRadius: vars.radius.control,
  color: vars.color.text.secondary,
} as const;

const mono = {
  fontFamily: vars.text['mono-small'].fontFamily,
  fontSize: vars.text['mono-small'].fontSize,
} as const;

/** The entry-points panel from the Figma workspace screens. Mock content (catalogue only). */
export const EntryPoints: Story = {
  render: (args) => (
    <div style={{ display: 'flex', blockSize: '100%' }}>
      <Panel
        {...args}
        style={{ inlineSize: `calc(${vars.size['node-width']} + ${vars.space['32']})` }}
      >
        <Input controlSize="sm" aria-label="Filter entry points" placeholder="Filter" />
        <PanelSection label="Screens" count={4}>
          <div
            style={{
              ...row,
              background: vars.color.surface.selected,
              color: vars.color.text.primary,
            }}
          >
            Item editor
          </div>
          <div style={row}>Items list</div>
          <div style={row}>Item detail</div>
          <div style={row}>Settings</div>
        </PanelSection>
        <PanelSection label="API routes" count={9}>
          <div style={{ ...row, ...mono }}>POST /api/items</div>
          <div style={{ ...row, ...mono }}>GET /api/items</div>
        </PanelSection>
        <PanelSection label="Jobs" count={2}>
          <div style={{ ...row, ...mono }}>process-items</div>
          <div style={{ ...row, ...mono }}>daily-digest</div>
        </PanelSection>
      </Panel>
      <div style={{ flex: 1, background: vars.color.surface.canvas }} />
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};
