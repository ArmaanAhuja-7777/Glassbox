import { vars } from '@flowcanvas/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowNode, type FlowNodeKind } from './FlowNode';

const meta = {
  title: 'Components/Flow node',
  component: FlowNode,
  args: { title: 'createItem', location: 'src/items/create.ts:42', kind: 'function' },
  argTypes: {
    kind: {
      control: 'select',
      options: [
        'ui',
        'function',
        'route',
        'rule',
        'data',
        'external',
        'ai',
        'queue',
        'config',
        'auth',
        'error',
        'file',
      ],
    },
    change: {
      control: 'select',
      options: [undefined, 'added', 'modified', 'removed', 'affected', 'scope'],
    },
    status: { control: 'select', options: [undefined, 'failing', 'analysing'] },
  },
} satisfies Meta<typeof FlowNode>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['16'],
  alignItems: 'flex-start',
} as const;

export const Default: Story = {};

/** The nine variants of the Figma "Flow node" component set, in the same order. */
export const AllStates: Story = {
  render: () => (
    <div style={column}>
      <FlowNode title="Save item" location="app/items/save.tsx:18" kind="ui" />
      <FlowNode title="POST /api/items" location="app/api/items/route.ts:9" kind="route" selected />
      <FlowNode title="validateTitle" location="lib/validate.ts:12" kind="rule" change="added" />
      <FlowNode title="createItem" location="src/items/create.ts:42" change="modified" />
      <FlowNode title="legacyNormalize" location="src/items/legacy.ts:7" change="removed" />
      <FlowNode title="db.items.insert" location="lib/db.ts:41" kind="data" change="affected" />
      <FlowNode title="item.created" location="src/events/items.ts:3" kind="queue" change="scope" />
      <FlowNode title="sendWelcome" location="worker/mail.ts:22" kind="external" status="failing" />
      <FlowNode
        title="AI check (Gemini)"
        location="worker/check.ts:42"
        kind="ai"
        status="analysing"
      />
    </div>
  ),
};

/** Selection and status combine with a change: selection never hides what changed. */
export const Combinations: Story = {
  render: () => (
    <div style={column}>
      <FlowNode title="createItem" location="src/items/create.ts:42" change="modified" selected />
      <FlowNode
        title="createItem"
        location="src/items/create.ts:42"
        change="modified"
        status="failing"
      />
      <FlowNode
        title="validateTitle"
        location="lib/validate.ts:12"
        kind="rule"
        change="added"
        status="analysing"
      />
      <FlowNode
        title="normalizeItemTitleAndStripUnsafeMarkup"
        location="src/items/sanitize/normalize-title.ts:118"
        change="affected"
      />
    </div>
  ),
};

const KINDS: [FlowNodeKind, string, string][] = [
  ['ui', 'Item editor', 'app/items/editor.tsx:1'],
  ['function', 'createItem', 'src/items/create.ts:42'],
  ['route', 'POST /api/items', 'app/api/items/route.ts:9'],
  ['rule', 'validateTitle', 'lib/validate.ts:12'],
  ['data', 'db.items.insert', 'lib/db.ts:41'],
  ['external', 'Stripe charge', 'src/billing/charge.ts:30'],
  ['ai', 'AI check (Gemini)', 'worker/check.ts:42'],
  ['queue', 'item.created', 'src/events/items.ts:3'],
  ['config', 'ITEM_LIMIT', 'config/items.ts:5'],
  ['auth', 'requireSession', 'src/auth/session.ts:14'],
  ['error', 'onSaveError', 'app/items/errors.ts:8'],
  ['file', 'items.csv', 'data/items.csv'],
];

/** One icon per node type (Graphite iconography). */
export const AllKinds: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, max-content)',
        gap: vars.space['12'],
      }}
    >
      {KINDS.map(([kind, title, location]) => (
        <FlowNode key={kind} kind={kind} title={title} location={location} />
      ))}
    </div>
  ),
};

/** The nine Figma variants with the Figma component's default text; compared with the Figma PNGs by e2e/visual. */
export const FigmaVariants: Story = {
  render: () => {
    const figma = { title: 'Node title', location: 'src/file.ts:42' };
    return (
      <div style={{ ...column, gap: vars.space['24'] }}>
        <FlowNode {...figma} data-figma="State=Default" />
        <FlowNode {...figma} data-figma="State=Selected" selected />
        <FlowNode {...figma} data-figma="State=Added" change="added" />
        <FlowNode {...figma} data-figma="State=Modified" change="modified" />
        <FlowNode {...figma} data-figma="State=Removed" change="removed" />
        <FlowNode {...figma} data-figma="State=Affected" change="affected" />
        <FlowNode {...figma} data-figma="State=Scope" change="scope" />
        <FlowNode {...figma} data-figma="State=Failing" status="failing" />
        <FlowNode {...figma} data-figma="State=Analysing" status="analysing" />
      </div>
    );
  },
};
