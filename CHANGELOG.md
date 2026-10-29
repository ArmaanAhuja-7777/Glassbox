# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] — 2026-10-29 — Phase 1b: see-and-test harness

### Try it

1. Open **What's new** on this page: the dot means changes you haven't seen. Read this build's notes, then close it; the dot stays gone after a reload.
2. Open **Labs**: unfinished features will appear here as switches, off by default. Nothing is in preview yet, and it says so.
3. Open the latest **test report** (linked on each pull request): watch the walkthrough videos and open a trace to step through every action.

### Added

- **Recorded walkthroughs:** one Playwright file per phase (`e2e/try-it/`), worded like the build plan's Try it steps; every run records a video and a trace.
- **Test reports online:** each run is published to its own Worker (`flowcanvas-reports`), with an index, the walkthroughs (videos, traces) and the visual results; one link per pull request.
- **CI workflow:** checks, visual tests in Playwright's Docker image, walkthroughs against the deployed preview once it serves the exact commit, published report and one updating PR comment. It runs once GitHub Actions is available on the account; verified locally with `act` and `actionlint`.
- **What's new:** release notes in the app, generated from this changelog at build time, with Try it first and a dot for unseen changes.
- **Labs:** switches for unfinished features, off by default and marked Preview.
- **Popover** component in `@flowcanvas/ui`.
- **Test corpus:** six public forks pinned to exact commits (Rallly, Documenso, LibreChat, Twenty, Excalidraw, Medusa), with a check of fork, commit, licence and stack.

### Changed

- Visual tests compare our own approved screenshots, pixel for pixel, inside Playwright's Docker image on every machine. The automated comparison with Figma exports is retired; Figma is a reference reviewed by eye.

### Security

- The reports site has its own origin and headers, kept out of search engines.
- CI gives write access and the Cloudflare token only to the publishing job, and pull requests from forks never receive secrets.
- The test corpus never enters this repository, and its commercial or enterprise parts are never enabled.

## [0.2.0] — 2026-10-28 — Phase 1a: design system in code

### Try it

1. Choose **Theme → Light** on this page; reload, and it stays light.
2. Open the **component catalogue** from the link here, and flip **dark and light** with the paintbrush in its toolbar.
3. In the catalogue, look at **Flow node**, **Tag**, **Button** and **Menu**: the Signal colours, the change states and the event menu.

### Added

- `@flowcanvas/tokens`: the Graphite tokens (colours, Slate scale, text styles, spacing, radii, sizes, motion, shadows) as DTCG JSON, generated into CSS variables and typed TypeScript, in a dark theme and a new light theme. Contrast is checked by tests.
- `tools/figma-tokens`: the generator, reading the Figma variables export format.
- `@flowcanvas/ui`: Button, Tag, Input, Toggle, Tabs, Panel, Menu (icons, details, shortcuts, single-choice picker), Tooltip and Flow node (change states, failing and analysing status, selection, 12 node-type icons), with self-hosted Inter and JetBrains Mono, theme switching and reduced motion.
- Component catalogue (Storybook) with dark/light switch and accessibility checks, deployed to its own Cloudflare Worker.
- Visual tests: every story in both themes against approved baselines, axe on every story, and a side-by-side comparison with the Figma components within measured budgets.
- Version page rebuilt with the design system: theme menu (System / Dark / Light, remembered) and a link to the catalogue.
- **Signal palette** for the five change states and the selection accent (owner decision): clearer, colour-blind-friendlier hues on the unchanged greys, in dark and light.

### Changed

- Product version 0.2.0. The web build now rebuilds when the root version changes.

### Security

- The app keeps its strict CSP: React Aria's injected style is pre-empted. The catalogue, which needs inline scripts, is isolated on its own origin with its own headers.
- Storybook telemetry disabled; Storybook's build metadata is not deployed.

## [0.1.0] — 2026-10-27 — Phase 1: project skeleton

### Added

- Monorepo: pnpm 12 workspaces with catalogs, Turborepo 2 task pipeline, strict TypeScript 6, type-aware ESLint, Prettier.
- `@flowcanvas/web`: Vite + React app showing the product name, version and the commit it was built from.
- `@flowcanvas/control-plane`: Fastify service with `GET /health` (status, version, commit), JSON logs with secret redaction, graceful shutdown, and a production Docker image.
- `@flowcanvas/graph-model`: shared `BuildInfo` formatter that never invents a commit.
- `@flowcanvas/engine` and `@flowcanvas/workspace-agent`: packages wired into build, lint and test, ahead of their real work.
- Tests: unit (Vitest), component (Testing Library + jsdom), end-to-end (Playwright in Chromium), including a secret-redaction canary test.
- CI workflow for GitHub Actions (format, lint, typecheck, unit tests, build, e2e).
- Hosting on Cloudflare Workers static assets: a preview URL per pull request and staging from `main`.

### Security

- Strict Content-Security-Policy and security headers on the web app.
- Control plane binds to loopback by default and runs as a non-root user in its container.
- Actions pinned to commit SHAs; pnpm minimum release age respected; install scripts explicitly decided; telemetry off for Turborepo and Wrangler.
