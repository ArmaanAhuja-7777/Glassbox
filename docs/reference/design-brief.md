# Design Brief: Canvas-First AI IDE Screens

Oct 17, 2026 · @Manan

> **Superseded values (note added 26 Oct 2026, colours updated 28 Oct 2026).** Some values in this brief are out of date: 44 px top and review bars (now 40 px), the #4C8DFF accent (now signal blue #4C8DEB, used for selection and focus only), orange "possibly affected" (now violet), purple "out of scope" (now pink), "small uppercase labels" (now sentence case) and the foundation hex values. The **Graphite design language** (with the Signal palette, 28 Oct 2026) and the **Figma file** override this brief on all visual values; for colour values the tokens in `packages/tokens/source` win. This brief remains the reference for screen behaviour and interactions. See `docs/decisions-log.md`.

**This brief describes every screen, panel, component and state the finished product needs, so it can be designed in Figma from start to finish.** "Flowcanvas" is used as a working name. The example project throughout is a teacher-facing copy-checking website, because it exercises every feature: live UI, uploads, background jobs, AI calls, a database and teacher review.

## Design principles

1. **The canvas is home.** Live app screens, flows, code and the agent all live on one infinite canvas. Panels support the canvas; they never replace it.
2. **Start simple, reveal on demand.** Every view opens at overview level. Detail appears only when the developer expands, selects or asks.
3. **Never draw what isn't known.** Every line and value shows where it came from. Uncertain things look uncertain (dotted, open, muted), never solid.
4. **Change is always visible.** Anything added, removed, modified or possibly affected has a consistent colour and tag across every screen.
5. **Code is one click away.** Every node, element and change opens its code or diff in one click, without losing the canvas position.
6. **Calm, dense, professional.** Built for all-day use: dark-first, quiet chrome, strong hierarchy, keyboard-friendly. Closer to a pro tool (Figma, Linear) than a dashboard.

## Inspiration references

**Borrow interaction patterns from tools developers already trust, so the canvas feels new but never unfamiliar.** Study each one for the specific pattern listed, not its overall look.

| Product | What to borrow | Where it applies |
| --- | --- | --- |
| Figma | Infinite canvas, artboard frames with labels above, right-hand properties panel, multiplayer cursors and comments | Canvas, live UI frames, node inspector, team comments |
| Onlook | Live React app on a canvas, click an element to select its code | Live UI frames, element-to-source |
| VS Code and Cursor | Editor tabs, command palette, terminal, git panel, inline diffs, agent chat panel | Code editor, terminal, git, agent panel |
| Linear | Calm dark theme, crisp typography, keyboard-first, fast command menu | Overall visual tone, command palette |
| React Flow examples, n8n, Node-RED | Node anatomy, ports, edge routing, grouping, minimap | Flow graph |
| Datadog, Honeycomb, Jaeger trace views | Waterfall and span timelines, latency bars, error markers | Sequence view, runtime values |
| Chrome DevTools | Element hover outline, network panel with request and response | Live frames, API node inspector |
| GitHub pull requests | Files-changed list, review status, comment threads, status checks | Review panel, PR view |
| Raycast | Compact launcher with recent items and actions | Start screen, command palette |
| Miro and FigJam | Sticky comments and sections on a canvas | Comments, saved canvas sections |

## Design system

**Build two small, strict visual languages first, one for provenance (how something is known) and one for change state (what changed), and use them identically everywhere.** Everything else is a quiet, neutral pro-tool style. Values below are starting points to tune in Figma.

**Foundations:**

| Token | Suggested value | Notes |
| --- | --- | --- |
| Canvas background | Near-black charcoal (#0F1115) with a faint dot grid | Light theme mirrors it: off-white (#F7F7F8) |
| Panels | One step lighter (#16191F), 1 px borders (#262A33) | Quiet chrome; no heavy shadows |
| Primary accent | Calm blue (#4C8DFF) | Selection, focus, primary buttons |
| UI font | Inter, 12–14 px for UI, 11 px for metadata | Variable weights 400 / 500 / 600 |
| Code font | JetBrains Mono or similar, 12–13 px | Prompts, queries and code in inspectors too |
| Spacing | 4 px base grid; 8 / 12 / 16 / 24 steps | Panels 12 px inner padding |
| Radius | 6 px for nodes and inputs, 10 px for frames and cards |  |
| Icons | 16 px line icons (Lucide-style) | One icon per node type |

**Provenance language (edges and values):**

| State | Visual | Meaning |
| --- | --- | --- |
| Observed | Solid line + small green check badge | Seen in a real run or test |
| Resolved | Solid line | Proven from type-checked code |
| Convention | Solid line + small framework badge (e.g. "Prisma") | Matched by a framework rule |
| Suggested | Dotted grey line + "suggested" tag | AI guess, unverified |
| Unknown | Short open stub ending in a hollow circle + "?" | Dynamic call that couldn't be resolved |

**Change-state language (nodes, frames, files):**

| State | Visual |
| --- | --- |
| Added | Green left border + "+ added" pill |
| Modified | Amber left border + "modified" pill |
| Removed | Ghosted 40% opacity, red strikethrough label, fades out |
| Possibly affected | Thin orange dashed outline |
| Out of agent scope | Purple outline + "outside selection" pill |
| Analysing | Animated shimmer over the node, label "analysing…" |
| Unchanged | Default |

**Rule:** colour is never the only signal. Every state also has a tag, icon or line style, for accessibility and colour-blind users.

## Screen inventory

**33 screens and panels in total; design the 10 marked "P1" first, because together they tell the whole product story in a demo.** P2 completes the daily IDE; P3 covers teams and other project types.

| # | Screen or panel | Priority | Section |
| --- | --- | --- | --- |
| 1 | Start screen (launcher) | P1 | Start screens |
| 2 | Open repo from URL | P2 | Start screens |
| 3 | Project type confirmation + indexing progress | P1 | Start screens |
| 4 | Gaps report | P2 | Start screens |
| 5 | New project from prompt or template | P2 | Start screens |
| 6 | Main canvas workspace | P1 | Workspace |
| 7 | Flow graph view | P1 | Flow views |
| 8 | Sequence (timeline) view | P2 | Flow views |
| 9 | Node inspector (12 variants) | P1 | Node inspector |
| 10 | Live UI frame + frame states manager | P1 | Live UI frames |
| 11 | Agent panel, idle and running | P1 | Agent |
| 12 | Canvas during agent changes | P1 | Agent |
| 13 | Out-of-scope warning | P2 | Agent |
| 14 | Review panel | P1 | Review |
| 15 | Before / after compare | P1 | Review |
| 16 | Session report | P2 | Review |
| 17 | Code editor (canvas card and full panel) | P2 | IDE screens |
| 18 | Terminal and run manager | P2 | IDE screens |
| 19 | Git panel + checkpoint timeline | P2 | IDE screens |
| 20 | Debugger on canvas | P2 | IDE screens |
| 21 | Tests panel | P2 | IDE screens |
| 22 | Command palette | P2 | Utility |
| 23 | Entry-points panel and search | P2 | Utility |
| 24 | Settings (6 tabs) | P2 | Utility |
| 25 | Share and comments | P3 | Team |
| 26 | Pull-request behavioural diff (web) | P3 | Team |
| 27 | Account, plan and billing | P3 | Team |
| 28 | Non-web project canvases (CLI, mobile, firmware) | P3 | Team and platform |
| 29 | Workspace status (starting, sleeping, resuming) | P1 | Cloud workspace screens |
| 30 | Restore history | P2 | Cloud workspace screens |
| 31 | Usage and limits (incl. limit reached) | P2 | Cloud workspace screens |
| 32 | Project secrets | P2 | Cloud workspace screens |
| 33 | Where to run: cloud or local runner | P3 | Cloud workspace screens |

## Start screens

**The first two minutes decide whether a developer trusts the product: show progress honestly and land them on a live canvas, not an empty editor.**

### 1. Start screen (launcher)

Centred card on a dimmed canvas background, about 720 px wide.

- **Three big actions:** "Clone from URL", "Upload folder", "New project", each with an icon and a one-line description.
- **Recent projects list:** project name, path, project type badge ("Web app · Next.js"), support level badge ("Full", "Structural", "Basic"), last opened time, small thumbnail of the saved canvas.
- **Footer:** signed-in account, agent connection status ("Claude Code connected"), link to docs, version.

### 2. Open repo from URL

Single input for a GitHub, GitLab or Bitbucket URL; branch dropdown; destination folder; "Clone and open" button. Clone progress bar under the input.

### 3. Project type confirmation and indexing

- **Detection card:** "This looks like a **web app** (Next.js, Prisma, BullMQ, Gemini SDK)." Detected technology chips, each removable. Dropdown to change the type, and "Mixed project" option. Confirm button.
- **Support level preview:** three-step meter (Basic, Structural, Full) with the expected level highlighted and a line on what that means.
- **Indexing progress:** steps with live counters: "Parsing files 1,240 / 1,800", "Resolving types", "Finding entry points 46", "Running connectors", "Starting dev server". The canvas starts filling behind the card as entry points are found.

### 4. Gaps report

Side sheet after first index: a short list of issues, each with a severity dot, explanation and a fix action. Examples: "Preview needs `DATABASE_URL`" with a secure input; "3 routes could not be linked to handlers" with "Show"; "No tests found" with "Ask agent to add tests".

### 5. New project

- **Two tabs:** "Describe it" (large prompt box, e.g. "A website where teachers upload photos of copies and AI checks them against references") and "Templates" (cards grouped by category: web app, API, mobile, CLI, firmware, and so on).
- **Options row:** stack picker (pre-filled suggestion), agent picker, folder.
- **After "Create":** the canvas opens immediately; files, frames and the first flow appear live as the agent scaffolds, with a progress strip at the top.

## Main canvas workspace

**One window with five regions: top bar, left rail and panel, canvas, right panel, and a bottom review bar. Design it at 1440 × 900 first, then check 1280 × 800.** Every side region collapses so the canvas can go full screen.

&#91;embedded content: workspace wireframe · 1440 × 900 target\]

A selected element in the frame (left) draws its flow; the selected node (highlighted) feeds the inspector on the right. Proportions are schematic; use the sizes in the table below.

| Region | Size | Contents |
| --- | --- | --- |
| Top bar | 44 px tall | Project switcher, branch name with checkpoint count, run button with dev-server status dot, Graph / Sequence toggle, global search, agent status, share button, avatar |
| Left rail | 48 px wide | Icons: Canvas, Entry points, Files, Search, Git, Tests, Debug, Plugins, Settings |
| Left panel | 260 px, collapsible | Content for the selected rail icon (lists, trees, filters) |
| Canvas | Remaining space | Live UI frames, flows, code cards, comments; floating toolbar (select, pan, comment, add frame, fit view) top-centre; completeness pill top-left; zoom controls and minimap bottom-right |
| Right panel | 360 px, resizable | Tabs "Inspector" and "Agent", or split vertically when both are open |
| Review bar | 40 px collapsed, about 280 px expanded | Tabs with counts: Changed, Possibly affected, Tests, Observed, Unverified; "Accept" and "Revert step" buttons on the right |

**Key interactions to show in Figma:**

- Clicking an element in a frame draws its flow to the right of the frame and selects the first node.
- Selecting any node opens the inspector; double-clicking opens a code card next to it.
- Space + drag pans, pinch or Ctrl + scroll zooms, F fits the selected flow.
- Saved "views" (named canvas positions like "Upload flow") appear as chips under the top bar.

## Flow views

**Two views of the same flow: a graph for structure and a sequence for time. Both share node colours, provenance lines and change states, so switching never feels like a new screen.**

### 7. Flow graph view

- **Direction:** left to right, starting from the selected element or entry point.
- **Lanes:** a main lane for the immediate request; a separate shaded "Background" lane for queued jobs, cron and events, joined by a dashed hand-off arrow with a small clock icon.
- **Groups:** collapsed groups look like stacked cards ("Validation · 4"), with a chevron to expand. Expanding pushes nothing else around.
- **Branches:** decision nodes are small diamonds with condition labels on each outgoing edge ("valid", "invalid"). Failure paths use a thin red edge.
- **Completeness pill:** top-left of the flow, e.g. "18 edges · 11 resolved · 4 convention · 2 observed · 1 unknown"; clicking it filters to the weak edges.
- **Filters:** chips to hide or show background work, error paths, external services, suggested edges.

**Node anatomy (about 200 × 56 px):**

| Part | Detail |
| --- | --- |
| Type icon | Left, 16 px, one per node type (UI, function, API, rule, DB, external, AI, queue, config, auth, error, file) |
| Title | Short name, e.g. "AI check (Gemini)" |
| Subtitle | File and line, muted, e.g. `worker/check.ts:42` |
| Badges | Top-right: change-state pill, framework badge, runtime timing ("2.4 s") |
| Ports | Small dots left and right for edges |
| Hover | Quick actions: open code, inspect, focus agent here, comment |

### 8. Sequence (timeline) view

A waterfall like a trace viewer: each row is a step, bars show order and duration, async hand-offs jump to a new row group labelled "Background". Retries are stacked bars; failures are red markers. Without runtime data, bars show order only, with the label "order from code; no timings yet".

## Node inspector

**One shared inspector shell with a type-specific body. Design the shell once, then 12 body variants, so every node type feels consistent but shows its own detail.**

**Shell (top to bottom):**

1. **Header:** type icon, node name, file and line link, change-state pill, provenance badge, "Open code" and "Ask agent about this" buttons.
2. **Tabs:** "Details" (from code), "Runs" (real values), "Changes" (diff for this node), "Connections" (callers and callees).
3. **Body:** sections with small uppercase labels, collapsible, values in mono font where they are code.
4. **Footer:** "Edit in place" toggle; when on, editable fields get a pencil and an outlined input; saving shows "Saved · checkpoint 7".

**Body variants:**

| Variant | Details tab | Runs tab | Editable |
| --- | --- | --- | --- |
| UI element | Component, props table, state read, handlers, styles | Rendered values, re-render count | Text, props, styles |
| Function | Signature, typed inputs and outputs, branches, side effects | Argument and return values, duration | Code |
| API route | Method + path, params, request and response schema, auth, middleware | Request / response pairs, status, latency chart | Route code, schema |
| Validation rule | Rule list with messages | Pass / fail log | Rules |
| Data access | Query in code block, tables and columns chips, read / write tag | Rows returned, query time | Query |
| External service | SDK method or endpoint, env var names, retries, timeout | Payloads, responses, errors | Settings |
| AI call | Prompt template (large mono editor), model, temperature, inputs list, output format, parser | Filled-in prompt, response, tokens, cost, latency; "Re-run on saved input" and side-by-side compare of two runs | Prompt, parameters |
| Queue or job | Queue name, payload shape, retries, schedule, concurrency | Job list with status chips | Schedule, retries |
| Config or flag | Variables affecting this flow, which branch each selects | Current values, secrets masked as •••• | Non-secret values |
| Auth | Required roles, guards | Who ran it, role | Rules |
| Error handling | Thrown errors, handlers, fallbacks | Exceptions with stack traces | Handling code |
| File storage | Types, size limits, path, transforms | File sizes, processing times | Limits, paths |

**Design detail:** every value carries a tiny provenance dot (green observed, blue resolved, grey suggested) with a tooltip saying where it came from.

## Live UI frames (screen 10)

**Frames are the real running app, laid out like Figma artboards, and they are the most natural starting point for any flow.**

**Frame anatomy:**

- **Label above the frame:** screen name ("Upload copies"), route (`/teacher/upload`), device size chip (Desktop, Tablet, Phone), current state chip ("Logged in · 7-A").
- **Frame body:** live page; on hover, elements get a thin blue outline and a small tag with component name and file ("UploadButton · upload.tsx:18").
- **Selected element:** solid blue outline plus a connector line out to its flow.
- **Frame toolbar (on hover):** reload, change device size, states menu, open route code, "Record steps".
- **Change states:** a frame whose screen changed after an agent step shows an amber corner badge "updated"; a "Before / after" toggle swaps in the previous screenshot.

**States manager (popover from the states chip):**

- List of saved states, e.g. "Empty class", "40 copies uploaded", "AI check failed", each with a thumbnail.
- "New state" options: from seed data, from a logged-in role (teacher, principal, student), or by recording clicks.
- Recording mode: red dot in the frame label, step list growing in the popover, "Save as state" button.

**Frame layouts to show:** a row of 3–5 key screens; a phone and desktop pair of the same screen; a frame with its flow drawn beside it.

## Agent panel and live change (screens 11–13)

**The agent works in the right panel while the canvas shows its effect, step by step; design both sides of that moment together.**

### 11. Agent panel

- **Header:** agent picker (Claude Code, Codex, others), model chip, context chip ("Full project" by default, or "Focused: 3 nodes" when the developer has selected nodes), stop button.
- **Message list:** user requests; agent replies; collapsible tool-call cards ("Edited `upload.ts` · +12 −3", "Ran tests") each linking to its checkpoint.
- **Step tracker:** numbered steps with status icons (pending, running spinner, done check, failed cross); clicking a step jumps the canvas to what it changed.
- **Approval card:** when the agent asks permission (run a command, install a package), a card with the exact command and "Allow once", "Always allow", "Deny".
- **Composer:** text box; chips for attached context (selected nodes, a frame, a file); "@" to mention any node; send button.

### 12. Canvas during agent changes

Show a sequence of 3 frames in Figma, same layout:

1. **Before:** flow in normal state, agent message just sent.
2. **Working:** nodes being re-analysed shimmer with "analysing…"; a new node fades in with "+ added" ("Rate limit · 20/min"); the frame reloads with a thin progress line on top; the step tracker shows step 3 of 6 running.
3. **Done:** all change pills visible; possibly-affected nodes outlined orange elsewhere on the canvas, with an edge-of-screen arrow pointing to off-screen ones ("2 affected flows →"); review bar expands with counts.

### 13. Out-of-scope warning

When the developer focused the agent on some nodes and it edited elsewhere: purple outline on those nodes, a non-blocking toast "Agent changed 2 things outside your selection · View", and a matching item in the review panel. Never a blocking modal.

## Review and behavioural diff (screens 14–16)

**After every agent session the developer should answer "what did this actually change, and can I trust it?" in under a minute, without reading every file.**

### 14. Review panel (expanded review bar)

Five tabs, each a list where every row links to the canvas:

| Tab | Each row shows | Row actions |
| --- | --- | --- |
| Changed | Node or screen name, change-state pill, files touched, lines +/− | Show on canvas, open diff, revert this change |
| Possibly affected | Flow or screen name, why it may be affected ("uses `parseMarks`") | Show on canvas, run related tests |
| Tests | Test name, pass / fail / not run, duration, nodes covered | Run, open test, view trace |
| Observed | Edge or value confirmed by a run, when, by which test | View trace |
| Unverified | What nothing has confirmed yet, and why | Run a test, ask agent to add a test |

Right side of the bar: session summary line ("Agent session · 6 steps · 3 changed · 2 affected · 3/4 tests"), "Accept all", "Revert step", "Revert session".

### 15. Before / after compare

Split canvas with a draggable divider: "Before" on the left (ghosted, baseline snapshot) and "After" on the right, flows aligned node for node. Frames show before and after screenshots side by side. A slim strip above lists changed nodes; clicking one centres both sides and opens its code diff in a bottom sheet.

### 16. Session report

Printable, shareable page: request, agent, steps with checkpoints, behavioural diff summary, affected flows, test results, unverified items, and a mini flow image per changed flow. Export as Markdown; share as a link (team plan).

## IDE screens (17–21)

**These must feel as fast and familiar as VS Code, because developers judge the whole product by how editing feels.** Each lives either on the canvas as a card or as a docked panel.

### 17. Code editor

- **Canvas card:** opens beside a node, about 520 × 360 px, with file tab, breadcrumb, and the node's lines highlighted; drag a corner to resize; "Pop out" docks it as a full panel.
- **Full panel:** classic tabs, split view, minimap, gutter with diff markers (green added, amber modified, red removed) and small flow-node chips in the gutter linking lines back to canvas nodes.
- **Inline diff mode:** agent changes shown inline with accept / reject per hunk.
- **Problems strip:** errors and warnings count at the bottom of the card.

### 18. Terminal and run manager

Bottom dock with tabs: "Terminal" (multiple sessions), "Run" (dev server, worker, tests as process cards with status dots, start / stop / restart, port, logs), "Logs" (filterable, with each log line linking to the node that printed it when known).

### 19. Git panel and checkpoint timeline

- **Panel:** changed files with stage / unstage, commit box with AI-suggested message, branch switcher, pull / push, conflict resolver that also shows the affected flows.
- **Checkpoint timeline:** a horizontal strip (top of review bar or its own panel) showing agent steps and commits as dots; hover shows the step's intent; click restores that point on the canvas; drag a range to compare two points.

### 20. Debugger on canvas

Breakpoints set from code or from a node (red dot on the node). When paused: the paused node pulses, the path taken so far is highlighted, variables appear in the inspector "Runs" tab, and a floating control bar offers continue, step over, step into, step out, stop.

### 21. Tests panel

Tree of test files and cases with status; filter "Relevant to this change"; each test shows which nodes it covers (chips), last result, duration; "Run relevant" button; failed tests open a card with the error, stack and the node where it failed.

## Utility screens (22–24)

**Keyboard-first tools that let developers jump anywhere in seconds.**

### 22. Command palette (Cmd/Ctrl + K)

Centred, about 640 px wide. Sections in results: Commands, Screens, Entry points, Nodes, Files, Symbols, Recent. Each row has an icon, name, muted path and keyboard shortcut. Prefixes change mode: ">" commands, "@" nodes, "#" files, "/" routes.

### 23. Entry-points panel and search

- **Entry-points panel (left):** grouped by kind: Screens and elements, API routes, Jobs and cron, Events, CLI commands. Each item shows name, type icon, support level dot, and a "Show flow" action. Counts per group; filter box at top.
- **Global search:** results grouped by code matches, nodes, frames, and comments; clicking a result opens it on the canvas with the match highlighted.

### 24. Settings

Six tabs, standard two-column layout (label left, control right):

| Tab | Main settings |
| --- | --- |
| General | Theme, density, language, canvas behaviour (snap, animation level) |
| Agents | Connected agents, default agent, permission defaults, context default (full project or focused) |
| AI labels | On / off (no-LLM mode), provider, bring-your-own key, which features may call a model |
| Privacy and runtime | Tracing on / off per environment, payload capture, masking rules, telemetry (off by default) |
| Editor and keys | Font, tab size, format on save, keybinding preset (VS Code), import from VS Code |
| Project | Project type, plugins and support level, run scripts, environment variables (secure), excluded paths |

## Team and platform screens (25–28)

**These come later in the build, but designing them now keeps the visual language consistent when the product grows.**

### 25. Share and comments

- **Share dialog:** share the current view, a flow, or a session report by link; permission dropdown (view, comment); team members list with avatars.
- **Comments:** pin a comment to any node, frame element or edge (Figma-style round avatar pins); thread panel on the right; resolve button; "@" mentions; live cursors of teammates on the canvas.

### 26. Pull-request behavioural diff (web page)

Opened from a link in a GitHub or GitLab PR. Header with PR title, author, branch and status check. Body: changed flows as small static flow images with change pills, affected screens with before / after thumbnails, test evidence table, unverified list, and "Open in Flowcanvas" button.

### 27. Account, plan and billing

Account page with profile, plan card (Free local, Team, Enterprise), seats, invoices, organisation settings for admins: SSO, allowed agents, runtime-tracing policy, audit log table.

### 28. Non-web project canvases

The same canvas with different frames on the left. Show 3 examples:

| Project type | What replaces the live UI frame | Typical entry points |
| --- | --- | --- |
| Mobile app | Phone emulator frame with device chrome | Screens, buttons, push notifications |
| CLI tool | Terminal recording frame with command and output | Commands and flags |
| Firmware | Simulator panel: board image with pin states, serial monitor, timing chart | Interrupts, RTOS tasks, sensor reads |

Add a support-level banner style for projects below full support, e.g. "Structural support: flows from code; no live preview for this stack yet".

## Cloud workspace screens (29–33)

**Every project runs in a cloud workspace, so the interface must always say where the code is, whether it is awake, and that nothing is ever lost.** Keep these states calm and factual; they appear often.

### 29. Workspace status

- **Top-bar chip** beside the project name: a small dot plus text, e.g. "Running · 4 cores", "Sleeping", "Resuming…". Click for machine size, uptime, last backup time and "Sleep now".
- **Starting:** the canvas shows the last saved layout dimmed, with a slim progress strip and steps ("Restoring snapshot", "Installing dependencies", "Starting dev server"); live frames show a skeleton until their preview URL responds.
- **Sleeping:** a centred card on the dimmed canvas: "This workspace went to sleep after 10 minutes idle. Everything is saved." with a primary "Resume" button and the time of the last backup.
- **Resuming:** same as starting, usually a few seconds; the canvas becomes interactive as soon as the engine reconnects.

### 30. Restore history

A side panel listing every restore point, newest first: agent checkpoints (with step intent), autosave points, and scheduled snapshots, each with time, size and a short summary ("3 files changed"). Selecting one shows its diff against now. Actions: restore a file, restore to this step, or restore the whole workspace into a new copy. A footer shows backup retention for the user's plan.

### 31. Usage and limits

On the profile page: a meter of workspace hours this month, machine-size breakdown, storage used and the next reset date. When a limit is reached, the workspace pauses gracefully with a full-canvas card: "You've used this month's free hours. Your work is saved." with "Upgrade" (primary) and "Remind me at reset". Never a blocking error, never lost work.

### 32. Project secrets

A settings tab per project listing environment variables by name only, with masked values, who added them and when. Add, rotate and delete; values are write-only once saved. A note explains that secrets live in an encrypted vault, are never indexed, never shown to the agent, and never sent to a model.

### 33. Where to run

Shown when opening a project or from the workspace chip: two cards, "Cloud workspace" (default, with machine size and region) and "Local runner" (with install status). Moving a project shows a short progress list ("Committing checkpoint", "Cloning on your machine", "Reconnecting canvas") and keeps the same canvas layout.

## States and edge cases to design

**Most of the trust in this product comes from how it behaves when things are incomplete, slow or broken, so these states need real designs, not afterthoughts.**

| Situation | Where | Design |
| --- | --- | --- |
| Still indexing | Canvas, entry points | Skeleton nodes; progress chip "Indexing 62%"; partial results usable |
| Analysis behind latest edit | Nodes | Shimmer + "analysing…"; never show old values as current |
| Unknown edge | Flow graph | Open stub with "?"; hover explains ("called via `handlers[type]`") with "Ask agent to resolve" |
| Suggested edge | Flow graph | Dotted grey; "suggested" tag; one-click "Confirm with a test" |
| No runtime data yet | Inspector "Runs" tab | Empty state: "No runs yet" + "Run relevant tests" / "Start tracing" buttons |
| Dev server failed | Frames | Frame shows error card with last log lines and "Ask agent to fix" |
| Missing secret | Frames, gaps report | Lock icon + secure input; never shows the value |
| Agent failed a step | Agent panel, canvas | Red step; nodes touched by that step outlined red; "Retry" and "Revert step" |
| Tests failing | Review bar, nodes | Red count badge; failing node gets a small red dot |
| Huge flow | Canvas | Auto-grouped with banner "Showing 12 of 340 nodes · expand groups to see more" |
| Unsupported stack | Whole workspace | Support-level banner; basic call graph only |
| Offline | Top bar | "Reconnecting…" banner; open files stay readable and edits queue in the browser until the workspace is reachable again |
| Empty project | Canvas | Welcome card: "Describe what you want to build" with the agent composer focused |
| First-time user | Workspace | 5-step onboarding tour with coach marks: frame, flow, inspector, agent, review bar |
| Workspace asleep | Whole workspace | Dimmed canvas with the last layout; "Everything is saved" card with Resume |
| Usage limit reached | Whole workspace | Graceful pause card with Upgrade; work saved; read-only browsing still allowed |
| Restoring a backup | Restore history, canvas | Progress steps; the restored copy opens beside the current one so nothing is overwritten by surprise |

## Component library checklist

**Build these as Figma components with variants before designing screens; every screen above is assembled from them.**

**Canvas components**

- [ ] Flow node (12 types × change states × selected / hover)
- [ ] Group node (collapsed, expanded)
- [ ] Decision diamond with condition labels
- [ ] Edge (5 provenance styles × normal / failure / highlighted)
- [ ] Async hand-off arrow with clock icon
- [ ] Lane (main, background)
- [ ] Live UI frame (label, device sizes, states chip, updated badge)
- [ ] Element hover outline and tag
- [ ] Code card
- [ ] Comment pin and thread
- [ ] Completeness pill
- [ ] Canvas toolbar, zoom controls, minimap

**Panel components**

- [ ] Inspector shell (header, tabs, sections, footer)
- [ ] Key-value row (with provenance dot, editable variant)
- [ ] Code / prompt block (read-only and editable)
- [ ] Request / response viewer
- [ ] Agent message, tool-call card, step tracker, approval card, composer
- [ ] Review list row (per tab)
- [ ] Process card (run manager)
- [ ] Test row
- [ ] Checkpoint dot and timeline

**Shared components**

- [ ] Pills: change states, provenance, framework badges, support levels
- [ ] Buttons (primary, secondary, ghost, danger), icon buttons
- [ ] Inputs, secure input, dropdown, toggle, tabs, chips
- [ ] Toasts (info, warning, out-of-scope), banners, tooltips
- [ ] Command palette row
- [ ] Empty states and skeletons
- [ ] Avatars and live cursors

## Prototype click-paths and Figma file structure

**Wire three click-through prototypes; together they demo the whole product in about three minutes.**

**Prototype A: understand a feature**

1. Start screen → open recent project "Copy checker".
2. Workspace opens with frames → hover "Upload & check" button → click it.
3. Flow draws beside the frame → click node "AI check (Gemini)".
4. Inspector opens on "Details" (prompt template) → switch to "Runs" (filled-in prompt and response).
5. Toggle sequence view → see background lane timing.

**Prototype B: change it with AI**

1. From the AI check node, click "Ask agent about this" → composer pre-filled with the node as context.
2. Type "Add rate limiting to uploads and make feedback shorter" → send.
3. Canvas "working" state → "done" state with change pills.
4. Review bar expands → open "Possibly affected" → jump to an affected screen.
5. Open before / after compare → accept.

**Prototype C: start from scratch**

1. Start screen → "New project" → "Describe it" → enter prompt → Create.
2. Canvas fills live: first frame, first flow.

**Suggested Figma pages:**

| Page | Contents |
| --- | --- |
| 0 Cover | Product name, version, status |
| 1 Foundations | Colours, type, spacing, icons, provenance and change-state languages |
| 2 Components | Everything in the component checklist, with variants |
| 3 P1 screens | The 10 priority screens |
| 4 P2 screens | Daily IDE screens and utilities |
| 5 P3 screens | Team, account, non-web canvases |
| 6 States | Every row of the states table |
| 7 Prototypes | Flows A, B, C wired together |
| 8 Archive | Explorations and old versions |
