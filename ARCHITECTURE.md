# Architecture

The system as it is **today** (end of phase 1b). Kept current at the end of every phase. Why things are this way is in `docs/adr/`; what's deferred is in `docs/upgrade-later.md`.

## Parts

| Package | Folder | Runs in | Today |
| --- | --- | --- | --- |
| `@flowcanvas/web` | `apps/web` | The user's browser (static files from Cloudflare) | Version page built from the design system: name, status, build line, What's new (from `CHANGELOG.md`, parsed at build time), Labs (switches for unfinished features, off by default; `src/labs/`), theme menu, link to the catalogue |
| `@flowcanvas/ui` | `packages/ui` | The browser (consumed as source by Vite, ADR 0007) | Graphite components (Button, Tag, Input, Toggle, Tabs, Panel, Menu, Popover, Tooltip, Flow node), global styles, fonts, theme switching; Storybook catalogue |
| `@flowcanvas/tokens` | `packages/tokens` | Shared (CSS and TypeScript) | Design tokens: DTCG source JSON → generated `css/tokens.css` and typed `vars` / `themeValues`; dark and light themes |
| `@flowcanvas/figma-tokens` | `tools/figma-tokens` | Developer machine / build | Generator: DTCG token JSON (Figma variable export format) → CSS variables + TypeScript |
| `@flowcanvas/control-plane` | `services/control-plane` | Our cloud (a container; not deployed yet) | Fastify service with `GET /health`; logs are JSON (pino) with secret redaction |
| `@flowcanvas/graph-model` | `packages/graph-model` | Shared library (browser and Node) | `BuildInfo` type and `formatBuildInfo()`; becomes the flow graph model in phase 6 |
| `@flowcanvas/engine` | `packages/engine` | Inside each user workspace (later) | Wired-in placeholder package; indexer arrives in phase 4 |
| `@flowcanvas/workspace-agent` | `workspace/agent` | Inside each user workspace VM (later) | Wired-in placeholder package; daemon arrives in phase 1d |
| `@flowcanvas/corpus` | `corpus` | Developer machine / CI | The test corpus: six public forks pinned in `manifest.json`; `pnpm corpus:check` verifies fork, commit, licence and stack through the GitHub API |
| `@flowcanvas/e2e` | `e2e` | Developer machine / CI | Playwright: one recorded walkthrough per phase (`try-it/`, video and trace) against any URL; visual tests (catalogue baselines in both themes, axe) |

Dependencies between packages:
- `web → ui, graph-model`
- `ui → tokens`
- `tokens → figma-tokens` (generator, dev only)
- `control-plane → graph-model`
- `e2e → web` (build order only)

## Design system

```
packages/tokens/source/*.tokens.json   (DTCG; the source of truth for tokens; Figma is a reference only, decisions log 29 Oct 2026)
        │  pnpm --filter @flowcanvas/tokens generate   (tools/figma-tokens; a test fails if the output is stale)
        ▼
packages/tokens/css/tokens.css  +  src/tokens.generated.ts
        │  imported by packages/ui/src/styles/global.css
        ▼
packages/ui components (CSS Modules; Stylelint rejects raw colours, sizes, fonts, radii, motion)
        ├─► apps/web            (strict CSP)
        └─► Storybook catalogue (own Worker and origin, ADR 0010)
```

- **Themes:** `data-theme="dark|light"` on `<html>`, or none to follow the OS (`prefers-color-scheme`). Pure CSS, chosen with `useThemePreference()`.
- **Accessible behaviour** (menus, tooltips, focus, keyboard) comes from React Aria Components (ADR 0008). Its one injected style is pre-empted, so the strict CSP holds.
- **Icons** come from Lucide (ADR 0009).
- **Proof:**
  - `tokens` tests check WCAG contrast in both themes.
  - `ui` tests check behaviour and accessibility.
  - `pnpm test:visual` compares every story in both themes, pixel for pixel, with approved baselines of our own rendering, and runs axe on each (`e2e/visual/`). It runs inside Playwright's Docker image on every machine and in CI, so the baselines match everywhere (ADR 0012). Figma is not compared automatically; the owner reviews against it by eye.

## Tooling

- **pnpm 12** workspaces with catalogs (one version per dependency).
- **Turborepo 2**: task graph and cache for `build`, `typecheck`, `test`, `lint`, `dev`, `test:e2e` and `build-storybook`. Always build through Turbo, so dependencies build first.
- **TypeScript 6.0**, strict, shared `tsconfig.base.json`.
- **ESLint 10** (type-aware typescript-eslint), **Stylelint 17** (tokens only) and **Prettier 3**.
- **Storybook 10**: the component catalogue, with the accessibility and theme addons.
- **Vitest 5** for unit and component tests; **Playwright** (Chromium) for end-to-end tests.
- Node **24 LTS**.

## How the version and commit travel

```
git commit ──► root package.json "version" (0.3.0; a Turbo input of the web build)
           └─► commit SHA
                 ├─ web build:     FLOWCANVAS_COMMIT (root `build` script, or Cloudflare's clone) → Vite `define` __FLOWCANVAS_BUILD__ → page text "0.3.0 · abc1234"
                 └─ control plane: FLOWCANVAS_COMMIT (env / Docker build arg) or `git rev-parse` in dev → GET /health
```

If no commit is known, every surface shows "unknown commit". A commit is never invented.

## From commit to URL

```
push to a PR branch ──► Cloudflare Workers Builds ──► build web ──► wrangler versions upload ──► preview URLs
                                                                       • <version-id-8>-flowcanvas.<subdomain>.workers.dev
                                                                       • <branch>-flowcanvas.<subdomain>.workers.dev (branch alias)
merge to main       ──► Cloudflare Workers Builds ──► build web ──► wrangler deploy ──► staging: flowcanvas.<subdomain>.workers.dev
push / merge        ──► Cloudflare Workers Builds (project flowcanvas-catalogue) ──► turbo run build-storybook ──► previews per branch,
                        catalogue from main: flowcanvas-catalogue.<subdomain>.workers.dev (packages/ui/wrangler.jsonc)
push / PR           ──► GitHub Actions CI (.github/workflows/ci.yml): checks · visual in the Playwright image ·
                        walkthroughs against the PR preview (or staging on main) once it serves the commit ·
                        publish to flowcanvas-reports + one PR comment. Runs on GitHub since 31 Oct 2026 (repository
                        moved to ArmaanAhuja/Flowcanvas; upgrade-later 8 closed)
test runs           ──► e2e/scripts/publish-report.ts ──► Worker flowcanvas-reports (ADR 0011): one version per run,
                        alias per PR (pr-<n>-flowcanvas-reports.<subdomain>.workers.dev), main address = latest from main
control plane       ──► docker build -f services/control-plane/Dockerfile .  (local only; deploy deferred to phase 1c)
```

## Security posture (phase 1b)

- Static UI with a strict Content-Security-Policy (`apps/web/public/_headers`); no inline scripts or styles anywhere in the app (React Aria's injected style is pre-empted).
- The catalogue runs on its own origin with a looser CSP that Storybook needs (`packages/ui/.storybook/public/_headers`, ADR 0010); it has no cookies or data.
- Control plane binds to loopback by default, runs as a non-root user in its container, and redacts secret-shaped log fields (canary-tested).
- No secrets in the repository, image layers or front-end environment.
- Telemetry off for Turborepo, Wrangler and Storybook.
- Supply-chain defaults: ADR 0006.

## Local development

```fish
pnpm install
pnpm dev            # web on http://localhost:5173, control plane on http://127.0.0.1:8080
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
pnpm --filter @flowcanvas/ui storybook   # catalogue on http://localhost:6006
pnpm test:visual                         # catalogue baselines in both themes, axe
```
