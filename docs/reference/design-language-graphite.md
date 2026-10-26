# Design Language: Graphite

Oct 21, 2026 · @Manan

**Chosen direction: "Graphite", a near-achromatic, dark-first interface where colour is reserved for meaning.** The app's chrome (panels, bars, controls) is built entirely from one cool-grey scale. Colour appears only when it carries information: one blue for selection and focus, and five hues that say what an agent changed. Everything else is expressed with lightness, line style and type.

**Why this fits the product.** The canvas will often show dozens of nodes with change states on them. If the interface itself is colourful, those states drown. A colourless frame makes the one green "added" node or amber "modified" node impossible to miss, which is the product's entire promise: see exactly what changed.

**The decision in five lines:**

1. **Two separate visual channels.** Hue encodes *what changed* (added, modified, removed, affected, out of scope). Line style and glyphs encode *how it is known* (observed, resolved, convention, suggested, unknown). The two never compete.
2. **One accent.** A muted steel blue, used only for selection and focus. The single primary action on screen is an off-white button with dark text, never a blue one.
3. **Hierarchy by lightness, not shadows.** Surfaces step up in lightness as they come forward; borders are 1 px and quiet.
4. **Dense but calm type.** Inter at a 13 px base, three weights, tabular numbers; JetBrains Mono for code, paths and prompts.
5. **Small, consistent radii and a 4 px grid** for a precise, tool-like feel.

## What professional tools do today

**The tools developers respect most have converged on the same recipe: near-black neutrals, one accent, perceptually uniform colour, high information density and keyboard-first interaction.** Graphite adopts that recipe and adds one thing none of them need: a strict colour language for change and evidence.

| Reference | What it does | What Graphite takes |
| --- | --- | --- |
| [Linear](https://linear.app/now/how-we-redesigned-the-linear-ui) | Rebuilt theming in the LCH colour space so different hues at equal lightness look equally bright; generates whole themes from three inputs (base colour, accent, contrast). Its 2024 redesign aimed to cut visual noise in sidebars, tabs, headers and panels | Perceptually uniform colour (OKLCH) for every hue; theme generated from base, accent and contrast so light, dark and high-contrast stay consistent |
| [Linear, decoded](https://www.buildmvpfast.com/blog/linear-aesthetic-tokens-density-keyboard-first-ux-2026) | Near-black canvas rather than pure black, a single chromatic accent in the chrome, 13 px density, Cmd+K palette | Near-black base, single accent, 13 px base size, command palette as a first-class surface |
| [Vercel Geist](https://vercel.com/geist) | Its own high-contrast, accessible colour system and a sans + mono typeface pair; presets for radii, fills, strokes and shadows ("materials") | A paired sans + mono type system; a small, named set of materials instead of ad-hoc styling |
| [Radix Colors](https://radix-ui.com/colors/docs/palette-composition/understanding-the-scale) | 12-step scales where every step has a job: 1–2 app backgrounds, 3–5 component backgrounds and states, 6–8 borders and focus rings, 9–10 solid fills, 11–12 text | The 12-step role structure for every scale, so designers and engineers pick colours by purpose, not by eye |
| Figma UI3, Zed, Cursor (observed patterns) | Quiet chrome around a busy working area; panels that collapse; properties panels on the right | Panels recede; the canvas carries the visual weight |

**Pattern to avoid copying blindly.** Many products now look like Linear. Graphite keeps the structure but uses a cool slate grey and a blue accent instead of Linear's violet, and its personality comes from the change language on the canvas, not from the chrome.

## Design principles

**Five rules decide every visual question; when two options look equally good, the one that follows more of these wins.**

1. **Colour is data.** If a colour does not tell the developer something, it is grey. Decorative colour, gradients and tinted panels are out.
2. **One channel, one meaning.** Hue = change state. Line style and glyph = provenance. Lightness = hierarchy. Weight = emphasis. No channel carries two meanings.
3. **The canvas is the loudest thing on screen.** Chrome steps back (lower contrast, smaller text, fewer borders); the working area steps forward.
4. **Density with breathing room.** Compact rows and 13 px text for scanning, but generous gaps between groups so sections read as units.
5. **Quiet until touched.** Secondary actions, file paths and controls appear on hover or focus; the resting state stays clean.

## Colour system

> **Colour values updated 26 Oct 2026: muted palette.** The colour values in this section are the final muted palette, matching the Figma file and its generator scripts. The original saturated blue accent and change-state values are kept at the end of this section, marked *superseded*, for history only. Everything else in this document (principles, type, spacing, radii, motion, components) is unchanged and remains authoritative. Tokens are named by role (`surface/canvas`, `state/added/solid` and so on) so screens stay bound when values change.

**One neutral scale (Slate), one muted steel-blue accent, and five muted change-state hues tuned to similar perceived lightness.** Define every value in OKLCH in code; the hex values below are the sRGB equivalents used in Figma.

### Neutral: Slate (dark theme)

A grey with a slight cool tint. Pure greys look dead on screens; a touch of blue reads as "technical" and keeps whites from feeling yellow.

| Step | Hex | Role |
| --- | --- | --- |
| 1 | #0B0C0E | Canvas and app background |
| 2 | #111317 | Panels, sidebars, bars |
| 3 | #181B20 | Nodes, cards, inputs at rest |
| 4 | #1E2228 | Hover |
| 5 | #252A31 | Pressed and selected rows |
| 6 | #2C323A | Subtle separators, panel borders |
| 7 | #383F49 | Borders on interactive controls |
| 8 | #4A525E | Hovered borders, strong dividers |
| 9 | #6B7380 | Icons at rest, placeholder text |
| 10 | #7D8592 | Icons on hover |
| 11 | #A3AAB5 | Secondary text, labels, metadata |
| 12 | #EDEFF2 | Primary text, headings |

**Role tokens (dark theme).** Screens bind to these names, not to step numbers.

| Token | Hex | Slate step | Role |
| --- | --- | --- | --- |
| `surface/canvas` | #0B0C0E | 1 | Canvas and app background |
| `surface/panel` | #111317 | 2 | Panels, sidebars, bars |
| `surface/raised` | #181B20 | 3 | Nodes, cards, inputs at rest |
| `surface/hover` | #1E2228 | 4 | Hover |
| `surface/selected` | #252A31 | 5 | Pressed and selected rows |
| `surface/inverse` | #E6E8EB | — | Primary button fill |
| `border/subtle` | #2C323A | 6 | Separators, panel borders |
| `border/control` | #383F49 | 7 | Borders on interactive controls |
| `border/strong` | #4A525E | 8 | Hovered borders, strong dividers |
| `text/primary` | #EDEFF2 | 12 | Primary text, headings |
| `text/secondary` | #A3AAB5 | 11 | Secondary text, labels, metadata |
| `text/tertiary` | #6B7380 | 9 | Icons at rest, placeholders, captions (not body text) |
| `text/on-accent` | #0B0C0E | — | Text on `surface/inverse` and on `accent/solid` |

### Accent: muted steel blue

Used for exactly two things: the current selection and keyboard focus. It is **not** used for the primary button.

| Token | Hex (dark) | Role |
| --- | --- | --- |
| `accent/solid` | #7487AD | Selection outline, focus ring, selected tab underline, source tag fill |
| `accent/hover` | #8496BB | Hover on accent elements |
| `accent/tint` | #182031 | Selected background tint, selection halo |
| `accent/ring` | #34405A | Subtle focus ring and halo |
| `accent/text` | #A9B7D3 | Links, file:line links, accent text |

### Primary button

**Off-white fill (`surface/inverse` #E6E8EB) with dark text (`text/on-accent` #0B0C0E), one per view.** It is never blue. Hover uses a slightly darker off-white, defined in phase 1a. Secondary, ghost and danger buttons are unchanged (see component treatment).

### Change states (hue channel)

All five are muted shades of their hue at similar perceived lightness, so no state looks more important than another. Each has a solid for borders, bars and markers, a tint for backgrounds, and a text colour for labels on the tint.

| State | Name | Solid | Tint | Text | Shape cue that always accompanies it |
| --- | --- | --- | --- | --- | --- |
| Added | sage | #6E9C82 | #18221D | #9FC2AD | Left bar + "+ added" tag |
| Modified | ochre | #B39B6B | #24211A | #D2BE93 | Left bar + "\~ modified" tag |
| Removed | clay | #B07473 | #261B1B | #CFA09F | Ghosted node + strikethrough |
| Possibly affected | lavender | #8C83B0 | #1F1D29 | #B5AED3 | Dashed outline |
| Out of selection | mauve | #A97A96 | #251C22 | #C9A3BA | Dashed outline + "outside selection" tag |

Tokens: `state/<added|modified|removed|affected|scope>/<solid|tint|text>`.

**Why "possibly affected" is not orange:** orange and amber are nearly indistinguishable for many colour-blind users and in peripheral vision; lavender against ochre is not.

### Provenance (form channel, no hue)

| Provenance | Edge | Glyph |
| --- | --- | --- |
| Observed | Solid, `edge/observed` #A3AAB5 | Small check at the midpoint |
| Resolved | Solid, `edge/default` #6B7380 | None |
| Convention | Solid, `edge/default` | Framework glyph (e.g. Prisma) |
| Suggested | Dotted, `edge/default` | "?" chip on hover |
| Unknown | Short open stub ending in a hollow circle | "?" |

### Live frame preview colours

The running app inside a live frame is the user's own UI. These tokens are only for mock previews in the design file, demos and the component catalogue: `preview/surface` #FFFFFF, `preview/ink` #1F2328, `preview/muted` #6E7781, `preview/line` #E5E7EB, `preview/brand` #1F2328.

### Status colours

Tests and runtime health reuse the same hues with standard meanings: pass = added sage, warning = modified ochre, fail = removed clay. They appear in the review bar and test panel, rarely on nodes, so the overlap does not cause confusion.

### Light theme

**Approved 27 Oct 2026 (phase 1a, step 2).** Same 40 roles as dark, inverted lightness:
- Surfaces get lighter as they come forward: canvas `#FCFCFD`, panels `#F6F7F9`, nodes `#FFFFFF`.
- The muted state hues keep their character, with darker solids and text and pale tints.
- The accent stays steel blue, darkened to `#4E6390`.
- **Primary button in light: near-black `surface/inverse` (`#1E2228`) with off-white `text/on-accent` (`#FCFCFD`)**, so it remains the strongest element on the screen (the inverse of the dark theme's off-white button).
- `preview/*` colours are unchanged (live frames show the user's own app).

Source of truth: `packages/tokens/source/color.light.tokens.json`. Contrast is enforced by `packages/tokens` tests for both themes.

| Token | Light |
| --- | --- |
| `surface/canvas` | #FCFCFD |
| `surface/panel` | #F6F7F9 |
| `surface/raised` | #FFFFFF |
| `surface/hover` | #EEF0F3 |
| `surface/selected` | #E6E9EE |
| `surface/inverse` | #1E2228 |
| `border/subtle` | #E3E6EA |
| `border/control` | #D2D6DC |
| `border/strong` | #B4BAC3 |
| `text/primary` | #16191D |
| `text/secondary` | #5C6470 |
| `text/tertiary` | #868D98 |
| `text/on-accent` | #FCFCFD |
| `accent/solid` | #4E6390 |
| `accent/hover` | #43578A |
| `accent/tint` | #E9EDF5 |
| `accent/ring` | #B8C4DB |
| `accent/text` | #3D5287 |
| `state/added/solid` | #4C8063 |
| `state/added/tint` | #E6F0EA |
| `state/added/text` | #2E5E43 |
| `state/modified/solid` | #957A40 |
| `state/modified/tint` | #F4EFE2 |
| `state/modified/text` | #66511F |
| `state/removed/solid` | #A0585A |
| `state/removed/tint` | #F6E7E7 |
| `state/removed/text` | #7A393C |
| `state/affected/solid` | #7064A0 |
| `state/affected/tint` | #ECEAF5 |
| `state/affected/text` | #514585 |
| `state/scope/solid` | #93607F |
| `state/scope/tint` | #F5E8F0 |
| `state/scope/text` | #6E3C5B |
| `edge/observed` | #5C6470 |
| `edge/default` | #868D98 |

### Superseded values (history only, do not use)

The original saturated palette, replaced on 26 Oct 2026: Blue accent 3/7/9/11 = #14203D / #2F4A8A / #3A6FF0 / #8EAEFF (hover #4C7DFF), used for the primary button with white text; change states (step 3 / 9 / 11, dark): added #10261C / #2FA36B / #5BD195, modified #2A2210 / #D39B2A / #F0C064, removed #2E1416 / #E5484D / #FF8A8D, affected #1F1838 / #8E6CEF / #B9A3FF, out of selection #2E1426 / #D6409F / #F38FC9; old light theme canvas #FCFCFD, panels #F8F9FA, text #16191D / #5C6470.

**Colour rules:**

- Never put two saturated colours next to each other unless both carry meaning.
- Tints (step 3) only behind content that already shows its state another way.
- Text on any tint uses that hue's step 11, never step 9.

## Specimen

&#91;embedded content: Graphite specimen · dark theme, actual values\]

Everything above the node row is the full palette the product may use; anything not shown here should not appear in the interface.

## Typography

**Inter for interface text and JetBrains Mono for anything a developer might copy (code, paths, routes, prompts, IDs). Five sizes, three weights, nothing else.** Inter is designed for screens at small sizes and has tabular figures; JetBrains Mono has tall lowercase letters and clear distinctions between similar characters (0/O, 1/l), which matters in file paths.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| Title | 20 / 28 | 600 | Screen titles, start screen |
| Heading | 15 / 22 | 600 | Panel and inspector headings |
| Body | 13 / 20 | 400 | Default UI text, messages |
| Body strong | 13 / 20 | 500 | Node titles, selected rows, buttons |
| Small | 12 / 16 | 400 / 500 | Secondary text, tabs, chips |
| Caption | 11 / 14 | 500 | Section labels (sentence case, Slate 9), metadata, tags |
| Mono | 12 / 18 | 400 | Code, prompts, paths |
| Mono small | 11 / 16 | 400 | File:line under node titles |

**Rules:**

- Section labels use sentence case at 11 px, not ALL CAPS. Capitals add noise in a dense UI; position and colour already mark them as labels.
- Numbers in counts, timings and tables use tabular figures so columns line up.
- Truncate long paths in the middle (`src/…/process.ts:42`), never the end, so the file name stays visible.
- Letter-spacing: −0.01 em at 15 px and above; 0 below.

## Space, density, radius and elevation

**A 4 px grid, small radii and lightness-based elevation give the precise, engineered feel of a professional tool; shadows are kept for things that float.**

| Property | Values | Notes |
| --- | --- | --- |
| Spacing scale | 2, 4, 8, 12, 16, 24, 32 | Inside components 4–12; between groups 16–24 |
| Row height | 28 (compact, default), 32 (comfortable) | Lists, tree items, menu items |
| Control height | 28 (small), 32 (default) | Buttons, inputs, segmented controls |
| Top bar / review bar | 40 / 40 | Was 44; slimmer chrome gives the canvas more room |
| Radius | 4 controls, 6 nodes and inputs, 8 popovers and panels, 10 live frames | Never mix more than two radii inside one component |
| Borders | 1 px, Slate 6 for structure, Slate 7 for interactive controls | No borders between items in a list; use spacing instead |
| Elevation (dark) | Level 0 Slate 1 canvas, level 1 Slate 2 panels, level 2 Slate 3 nodes and cards, level 3 Slate 4 + shadow for popovers, menus, palette | Each level is one step lighter |
| Shadow | Popovers only: 0 8 24 rgba(0,0,0,0.4) plus 1 px Slate 6 border | No shadows on nodes or panels |
| Canvas grid | Dots, 16 px spacing, Slate 6 at 50% opacity; hidden below 50% zoom | Aids alignment without adding texture |

## Iconography and motion

**Thin, uniform line icons and short, purposeful motion; animation exists only to show the developer what just changed.**

**Icons**

- Lucide set (open source, consistent geometry), 16 px in panels and nodes, 18 px in the rail.
- 1.5 px stroke at 16 px; round caps and joins.
- Resting colour Slate 9, hover Slate 11, active Blue 9. Icons never use change-state colours; the node border and tag already carry the state.
- One icon per node type (UI, function, route, rule, data, external service, AI call, queue, config, auth, error, file), shown in the node's top-left.

**Motion**

| Moment | Duration | Easing | What moves |
| --- | --- | --- | --- |
| Hover, press | 80 ms | ease-out | Background and border colour only |
| Panels, popovers open | 160 ms | ease-out | Opacity + 4 px slide |
| New node appears | 240 ms | ease-out | Fade + scale from 96% |
| Removed node | 240 ms then holds | ease-in | Fades to 40% and stays ghosted until review |
| "Analysing" | 1.2 s loop | linear | Subtle shimmer across the node |
| Camera moves (fit, focus) | 300 ms | ease-in-out | Canvas pan and zoom |

All motion respects the system's "reduce motion" setting, falling back to instant changes with the same end states.

## Component treatment

**Every component follows the same recipe: neutral at rest, blue when selected or focused, a change-state colour only when the thing itself changed.**

| Component | At rest | Hover | Selected / focused | Changed |
| --- | --- | --- | --- | --- |
| Flow node | Slate 3 fill, Slate 6 border, icon Slate 9, title Slate 12, path Slate 9 mono | Slate 4 fill, Slate 8 border; quick actions fade in at top-right | 1.5 px `accent/solid` outline + 3 px `accent/tint` halo | 2 px left bar in the state's solid, border in the state's solid at 50%, tag inside top-right ("+ added"); dashed 1 px solid border for affected and outside selection |
| Edge | `edge/default`, 1.25 px, rounded orthogonal routing | `edge/observed` | `accent/solid`, 1.5 px | Added: added solid; removed: dashed removed solid at 50% |
| Group | Stacked card look (two offset outlines), count in caption | Slate 4 fill | Accent outline | Shows the strongest change state inside it |
| Live frame | Frame label in Small, Slate 11; 10 px radius; no border | Element outlines in `accent/solid` at 50% | Element outline `accent/solid` + source tag (`accent/solid` fill, `text/on-accent` text) | Corner badge "updated" in modified text on modified tint |
| Tag / pill | State tint fill, state text, 4 px radius, 11 px Caption | — | — | — |
| Button (primary) | `surface/inverse` fill (off-white), `text/on-accent` (dark) text | Slightly darker off-white (1a) | 2 px focus ring `accent/solid` offset 2 px | — |
| Button (secondary) | Slate 3 fill, Slate 7 border, Slate 12 text | Slate 4 fill | Focus ring | — |
| Button (ghost) | Transparent, Slate 11 text | Slate 4 fill | Focus ring | — |
| Input | Slate 3 fill, Slate 7 border | Slate 8 border | `accent/solid` border + `accent/tint` halo | — |
| List row | Transparent | Slate 4 | Slate 5 fill + Slate 12 text | Small state dot before the label |
| Panel | Slate 2, 1 px Slate 6 edge toward the canvas only | — | — | — |
| Review bar tab | Small, Slate 11 + count tag | Slate 12 | Slate 12 on Slate 5 fill (review bar) or 2 px `accent/solid` underline (panel tabs) | Count tag in the state's colours |

**Fewer boxes.** Inside panels, separate sections with 16–24 px spacing and an 11 px label, not with borders or filled cards. Only things you can click or drag get a container.

## Accessibility

**Every text pair passes WCAG AA, every meaningful graphic passes 3:1, and no state relies on colour alone.** Ratios below are calculated from the hex values in this document.

| Pair | Ratio | Requirement | Result |
| --- | --- | --- | --- |
| Primary text Slate 12 on canvas Slate 1 | 17.0 : 1 | 4.5 : 1 | Pass |
| Primary text Slate 12 on node Slate 3 | 15.0 : 1 | 4.5 : 1 | Pass |
| Secondary text Slate 11 on panel Slate 2 | 7.9 : 1 | 4.5 : 1 | Pass |
| Icons and placeholders Slate 9 on panel Slate 2 | 3.9 : 1 | 3 : 1 (non-text) | Pass; not for body text |
| Primary button: #0B0C0E on #E6E8EB | 15.9 : 1 | 4.5 : 1 | Pass |
| Link and accent text #A9B7D3 on panel | 9.2 : 1 | 4.5 : 1 | Pass |
| Focus ring and selection #7487AD on canvas / on node | 5.4 / 4.8 : 1 | 3 : 1 (non-text) | Pass |
| Source tag: #0B0C0E on #7487AD | 5.4 : 1 | 4.5 : 1 | Pass |
| Change tags (text on tint), all five hues | 7.3 – 8.8 : 1 | 4.5 : 1 | Pass |
| Change-state solids (bars, dashed outlines) on canvas | 5.2 – 7.3 : 1 | 3 : 1 (non-text) | Pass |
| Edges #6B7380 on canvas | 4.1 : 1 | 3 : 1 | Pass (Slate 8 scored 2.5 : 1, too faint for meaningful lines) |
| Tertiary #6B7380 on node #181B20 | 3.6 : 1 | 3 : 1 (non-text) | Pass for icons and placeholders; not for body text |
| Light: text #16191D on canvas #FCFCFD / secondary #5C6470 on panel #F6F7F9 | 17.2 / 5.6 : 1 | 4.5 : 1 | Pass |
| Light: state text on tint (five hues) / primary button #FCFCFD on #1E2228 | 6.4 – 7.2 / 15.6 : 1 | 4.5 : 1 | Pass |
| Light: tertiary on nodes / edges / focus ring / state solids | 3.4 / 3.3 / 6.0 / 4.0 – 5.1 : 1 | 3 : 1 (non-text) | Pass |

Ratios recalculated on 26 Oct 2026 from the muted hex values.

**Beyond contrast:**

- Every change state has a shape cue (bar, tag, dash, ghost, flag), so it reads in greyscale and for all common forms of colour blindness.
- Keyboard: every node, edge and panel item is reachable with arrow keys and Tab; the focus ring is always visible (2 px `accent/solid`, 2 px offset).
- Minimum target size 24 × 24 px; most controls are 28–32 px.
- A high-contrast theme option raises borders one step and text to Slate 12 throughout.

## Alternatives considered

**Three other directions were weighed; each is either noisier or weaker at showing change, which is the one job the visuals cannot fail.**

| Direction | What it would look like | Why not |
| --- | --- | --- |
| Light-first, paper-like (Notion / Figma light) | White canvas, black text, soft greys | Agent sessions and long debugging days happen mostly in dark mode for developers; change colours lose punch on white. Kept as the secondary theme instead |
| Vibrant brand (purple or teal chrome, gradients) | Coloured sidebar, gradient buttons, tinted panels | Competes directly with the change colours on the canvas; looks dated within a year |
| Terminal-native (monospace everywhere, green on black) | Code-editor aesthetic throughout | Strong personality but poor for reading flows and prompts; alienates the wider "directing agents" audience |
| Graphite (chosen) | Near-achromatic slate, one blue accent, colour only for meaning | Lets the change language carry the product; matches what professionals already trust |

## What changes in the Figma file once approved

> *Historical checklist from the original proposal. The Figma file has since been rebuilt with the muted palette; where this list says "Blue", read the muted steel-blue accent, and the primary button is off-white.*

**Most of the update is token-level, so the existing screens restyle in place; a handful of components need structural edits.**

**Tokens**

- [ ] Replace the current colour variables with the Slate 1–12, Blue 3/7/9/10/11 and five change-state scales (steps 3, 9, 11).
- [ ] Rename tokens by role (e.g. `surface/canvas`, `surface/panel`, `text/primary`, `state/added/solid`) so screens stay bound.
- [ ] Add text styles for the type scale and effect style for popover shadow.

**Components**

- [ ] Flow node: Slate 3 fill, Slate 6 border, 2 px state bar, tag moved inside the node's top-right, 1.5 px blue selection with halo.
- [ ] Pill: 4 px radius instead of fully round; step 3 fill + step 11 text.
- [ ] Buttons: 28 px height, Blue 9 primary, focus-ring variant.
- [ ] New: Edge styles (resolved, observed, suggested, unknown, selected), Tab, List row, Input.

**Screens**

- [ ] Workspace: 40 px bars, sentence-case section labels, borders removed between panel sections, "possibly affected" moved to violet, edges at Slate 9, dot grid on the canvas.
- [ ] Start screen: same tokens; quieter action cards (no tinted fill on the highlighted card, blue outline only).
- [ ] Add a light-theme copy of the workspace once your plan supports a second variable mode, or as a duplicated frame.

Reply with approval or changes, and the Figma update follows this list.
