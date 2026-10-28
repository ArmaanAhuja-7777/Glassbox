import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Toggle } from './Toggle';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  args: { 'aria-label': 'Trace the dev server', defaultChecked: false, disabled: false },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

function SettingRow({
  title,
  description,
  initial,
}: {
  title: string;
  description: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const id = title.toLowerCase().replaceAll(' ', '-');
  return (
    <div
      style={{
        display: 'flex',
        gap: vars.space['24'],
        alignItems: 'center',
        paddingBlock: vars.space['12'],
        borderBlockEnd: `${vars.border.width.default} solid ${vars.color.border.subtle}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          id={id}
          style={{
            fontWeight: vars.text['body-strong'].fontWeight,
            color: vars.color.text.primary,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: vars.text.small.fontSize,
            lineHeight: vars.text.small.lineHeight,
            color: vars.color.text.muted,
          }}
        >
          {description}
        </div>
      </div>
      <Toggle aria-labelledby={id} checked={on} onCheckedChange={setOn} />
    </div>
  );
}

/** As on the Figma settings screen (Privacy and runtime), with cloud-first wording (decision A4). */
export const SettingsRows: Story = {
  render: () => (
    <div style={{ inlineSize: `calc(${vars.size['node-width']} * 3)` }}>
      <SettingRow
        title="Self-hosted models only"
        description="Labels and summaries never go to third-party providers."
        initial={false}
      />
      <SettingRow
        title="AI labels"
        description="Send short code excerpts to your model provider to name and summarise nodes."
        initial
      />
      <SettingRow
        title="Trace the dev server"
        description="Record real calls while you click through live frames."
        initial
      />
      <SettingRow
        title="Usage telemetry"
        description="Anonymous counts only, never code or paths. Off by default."
        initial={false}
      />
    </div>
  ),
};
