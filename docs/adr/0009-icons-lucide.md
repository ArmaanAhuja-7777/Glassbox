# 0009 — Icons: Lucide (`lucide-react`)

- Status: accepted
- Date: 27 Oct 2026
- Phase: 1a (step 9)

## Context

Graphite specifies line icons from the **Lucide** set: 16 px in panels and nodes, 18 px in the rail, one icon per node type (UI, function, route, rule, data, external service, AI call, queue, config, auth, error, file). The Figma generator script draws a few icons from hand-written SVG paths in a Lucide-like style, but it doesn't cover all twelve node types or the icons later screens need.

## Options considered

1. **`lucide-react`**: the official React package. ISC licence, no runtime dependencies, one component per icon, so unused icons are tree-shaken away. Each icon renders an inline `<svg>` with attributes only (no `style`), so it is safe under our CSP.
2. **Copy the Figma script's SVG paths into our own components.** This matches the Figma file exactly, but it is an incomplete set that we would have to keep drawing ourselves.
3. **An icon sprite or icon font.** Harder to tree-shake; a font fails accessibility and colour control.

## Decision

`lucide-react`, pinned at 1.55.0 in the catalog. That release was 17 days old when chosen (newer releases were too recent for our minimum-release-age rule).
- **Size:** set by CSS from tokens (`--size-icon-sm`).
- **Stroke:** a new token `--icon-stroke-width: 2.25`. That is 1.5 px at 16 px on Lucide's 24-unit grid, as in the Figma file; Lucide's default is 2.
- **Colour:** `currentColor` from the CSS.

Node-type icons:

| Node type | Lucide icon | Node type | Lucide icon |
| --- | --- | --- | --- |
| UI | `AppWindow` | AI call | `BrainCircuit` |
| Function | `Code` | Queue | `Layers` |
| Route | `Route` | Config | `SlidersHorizontal` |
| Rule | `ListChecks` | Auth | `KeyRound` |
| Data | `Database` | Error | `TriangleAlert` |
| External service | `Globe` | File | `File` |

`BrainCircuit` rather than a "sparkles" glyph for AI calls, in line with Graphite's "avoid the AI-generated look".

## Consequences

- **Accessibility:** icons are decorative by default (`aria-hidden`). Where an icon carries meaning, such as the node type, it gets `role="img"` and an `aria-label`.
- **Product code** takes icons through `@flowcanvas/ui` components where one exists, so the type-to-icon mapping lives in one place.
- **Small differences from Figma:** the Figma file's function icon (`</>` chevrons) matches Lucide's `Code`; its other node icons differ slightly in drawing. Step 10's visual comparison shows them side by side.
