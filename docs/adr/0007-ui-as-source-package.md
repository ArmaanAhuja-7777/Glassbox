# 0007 — `@flowcanvas/ui` is consumed as source, not compiled

- Status: accepted
- Date: 27 Oct 2026
- Phase: 1a (step 3)

## Context

ADR 0001 made workspace packages **compiled**: each builds `src/` to `dist/`, and consumers import `dist`. `@flowcanvas/ui` is different:
- It contains React components with **CSS Modules** and imports global CSS and fonts.
- Its only consumers are built by **Vite**: the web app and Storybook. Vite already compiles TSX and CSS Modules.

## Options considered

1. **Compile it like the others.** That needs a library build (Vite library mode) that also extracts and bundles CSS and font assets, plus a second CSS import in every consumer. It's more build configuration and slower feedback, with no consumer that needs it.
2. **Consume as source.** `exports` points at `src/index.ts` and `src/styles/global.css`, and each consumer's Vite compiles it.

## Decision

Option 2. `@flowcanvas/ui` exports source: `"exports": { ".": "./src/index.ts", "./styles.css": "./src/styles/global.css" }`. It has no `build` script; it is still type-checked, linted (ESLint and Stylelint) and tested like every package.

## Consequences

- An edit in `packages/ui` hot-reloads instantly in the web app and in Storybook.
- Consumers type-check `ui`'s source with their own compiler settings, so `ui` must compile under the strictest consumer (it does: same base config).
- A consumer not built by Vite (for example a Node service) can't import `@flowcanvas/ui`. None should: UI stays in the browser.
- If `ui` is ever published or used outside Vite, revisit with a library build.
