# Architecture

The system as it is **today** (end of phase 1). Kept current at the end of every phase. Why things are this way is in `docs/adr/`; what's deferred is in `docs/upgrade-later.md`.

## Parts

| Package | Folder | Runs in | Today |
| --- | --- | --- | --- |
| `@flowcanvas/web` | `apps/web` | The user's browser (static files from Cloudflare) | Vite + React page showing product name, version and commit |
| `@flowcanvas/control-plane` | `services/control-plane` | Our cloud (a container; not deployed yet) | Fastify service with `GET /health`; logs are JSON (pino) with secret redaction |
| `@flowcanvas/graph-model` | `packages/graph-model` | Shared library (browser and Node) | `BuildInfo` type and `formatBuildInfo()`; becomes the flow graph model in phase 6 |
| `@flowcanvas/engine` | `packages/engine` | Inside each user workspace (later) | Wired-in placeholder package; indexer arrives in phase 4 |
| `@flowcanvas/workspace-agent` | `workspace/agent` | Inside each user workspace VM (later) | Wired-in placeholder package; daemon arrives in phase 1d |
| `@flowcanvas/e2e` | `e2e` | Developer machine / CI | Playwright smoke test against any URL |

Dependencies between packages: `web → graph-model`, `control-plane → graph-model`, `e2e → web` (for build order only).

## Tooling

- **pnpm 12** workspaces with catalogs (one version per dependency).
- **Turborepo 2**: task graph and cache for `build`, `typecheck`, `test`, `lint`, `dev` and `test:e2e`.
- **TypeScript 6.0**, strict, shared `tsconfig.base.json`.
- **ESLint 10** (type-aware typescript-eslint) and **Prettier 3**.
- **Vitest 5** for unit and component tests; **Playwright** (Chromium) for end-to-end tests.
- Node **24 LTS**.

## How the version and commit travel

```
git commit ──► root package.json "version" (0.1.0)
           └─► commit SHA
                 ├─ web build:     FLOWCANVAS_COMMIT (root `build` script, or Cloudflare's clone) → Vite `define` __FLOWCANVAS_BUILD__ → page text "0.1.0 · abc1234"
                 └─ control plane: FLOWCANVAS_COMMIT (env / Docker build arg) or `git rev-parse` in dev → GET /health
```

If no commit is known, every surface shows "unknown commit". A commit is never invented.

## From commit to URL

```
push to a PR branch ──► Cloudflare Workers Builds ──► build web ──► wrangler versions upload ──► preview URLs
                                                                       • <version-id-8>-flowcanvas.<subdomain>.workers.dev
                                                                       • <branch>-flowcanvas.<subdomain>.workers.dev (branch alias)
merge to main       ──► Cloudflare Workers Builds ──► build web ──► wrangler deploy ──► staging: flowcanvas.<subdomain>.workers.dev
push / PR           ──► GitHub Actions CI (lint, typecheck, unit, build, e2e): defined in .github/workflows/ci.yml,
                        currently unable to start (account billing lock; docs/upgrade-later.md item 8)
control plane       ──► docker build -f services/control-plane/Dockerfile .  (local only; deploy deferred to phase 1c)
```

## Security posture (phase 1)

- Static UI with a strict Content-Security-Policy (`apps/web/public/_headers`).
- Control plane binds to loopback by default, runs as a non-root user in its container, and redacts secret-shaped log fields (canary-tested).
- No secrets in the repository, image layers or front-end environment.
- Telemetry off for Turborepo and Wrangler.
- Supply-chain defaults: ADR 0006.

## Local development

```fish
pnpm install
pnpm dev            # web on http://localhost:5173, control plane on http://127.0.0.1:8080
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```
