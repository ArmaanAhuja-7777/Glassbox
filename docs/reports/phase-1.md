# Phase 1 — Project skeleton: report

- Version: `0.1.0`
- Pull request: https://github.com/ArmaanAhuja/Flowcanvas/pull/1
- Dates: 26–27 Oct 2026
- Status: **in review** (see "Result")

## From the build plan

- **Build:** Monorepo (web app, workspace agent, engine, control plane, shared types); React web app deployed to a staging URL; CI with lint, type checks and tests.
- **Done when:** The staging URL loads the app; every pull request gets its own preview URL.
- **Try it:** Open the staging link; the app loads and shows its version.

## Result

| Item | Result | Evidence |
| --- | --- | --- |
| Monorepo with web app, workspace agent, engine, control plane, shared types | ✅ | 6 workspace projects (`pnpm ls -r --depth -1`): `@flowcanvas/web`, `control-plane`, `graph-model`, `engine`, `workspace-agent`, `e2e` |
| React web app deployed to a staging URL | ✅ | `https://flowcanvas.ahujaarmaan7777.workers.dev`, deployed by Cloudflare from `main`; Playwright verification recorded in the follow-up section below |
| CI with lint, type checks and tests | ⚠ defined, can't run | `.github/workflows/ci.yml` (format, lint, typecheck, unit, build, e2e). Jobs don't start: "account is locked due to a billing issue". Every check passes locally. `docs/upgrade-later.md` item 8 |
| Done when: the staging URL loads the app | ✅ | Playwright passed against staging at `9a18708` (follow-up section) |
| Done when: every pull request gets its own preview URL | ✅ (with a gap) | PR #1 has the Cloudflare check "Workers Builds: flowcanvas"; preview `https://phase-1-project-skeleton-flowcanvas.ahujaarmaan7777.workers.dev` (branch alias) and `https://dadc1dc8-flowcanvas.ahujaarmaan7777.workers.dev` (version). Gap: the URL isn't posted on the PR (`docs/upgrade-later.md` item 10) |
| Try it: staging shows the version | ✅ | `0.1.0 · 9a18708` on staging (follow-up section) |

Phase 1 can't be **accepted** until the CI workflow runs green on GitHub (trigger of `docs/upgrade-later.md` item 8).

## How to try it

1. Open the staging link (above): **Flowcanvas** and `0.1.0 · <main's short commit>`.
2. Open the PR preview link (above) for the branch's latest commit.
3. Locally: `pnpm install && pnpm dev`, then open `http://localhost:5173` and `curl http://127.0.0.1:8080/health`.
4. The full "Run and check it" table is in `docs/build-steps.md` (phase 1).

## Evidence

| Kind | Command | Result |
| --- | --- | --- |
| Format | `pnpm format:check` | all files use Prettier style |
| Lint (type-aware) | `pnpm lint` | 8 tasks successful; verified to catch `no-floating-promises` and `require-await` |
| Type-check | `pnpm typecheck` | 8 tasks successful |
| Unit + component | `pnpm test` | 10 tests passed: graph-model 3, web 2, control-plane 3 (including the secret-redaction canary, verified to fail when redaction is removed), engine 1, workspace-agent 1 |
| Build | `pnpm build` | 5 tasks; web bundle about 220 kB (69 kB gzip); commit embedded and verified to change with each new commit |
| End-to-end | `pnpm test:e2e` | 1 passed in Chromium locally, against the Cloudflare preview and against `wrangler dev` with the CSP applied; verified to **fail** on a wrong expected commit and against a 404 page |
| Security headers | `curl -sI <preview>` | `content-security-policy`, `x-content-type-options`, `referrer-policy`, `permissions-policy` present |
| Container | `docker build -f services/control-plane/Dockerfile …` + `docker run` | `/health` returns the build commit (`17b96b7`); runs as `node`; `/app` holds only `dist`, production `node_modules`, package files; `docker stop` exit 0 after "shutting down" |

Recordings and Figma screenshot comparison arrive with phase 1b. This phase has no UI from Figma.

## Deviations from the plan and why

1. **TypeScript 6.0, not the latest 7.0.** TS 7's API is unstable and typescript-eslint doesn't support it; phase 5 needs the API. ADR 0003.
2. **Node 24, not 26.** Node 26 wasn't LTS yet. ADR 0004.
3. **Cloudflare Workers static assets with Workers Builds, instead of Pages deployed from GitHub Actions.** Actions are blocked by the account billing lock, and Cloudflare now creates Workers by default. ADR 0005.
4. **Control plane not deployed to Fly.io.** It needs payment; free-first policy. The image is built and verified locally instead. Deploy in phase 1c (`docs/upgrade-later.md` item 12).
5. **No enforced branch protection.** Unavailable on the free plan for private repositories when decided; the repository was later made public while debugging Actions, which didn't help. Rule followed instead: merge only when green, no direct pushes to `main`.
6. **Merge exception for PR #1.** CI couldn't run, so the owner approved merging on: all checks green locally + the Cloudflare preview build green + Playwright green against the preview.

## Decision records added

- 0001 Monorepo with pnpm workspaces and Turborepo
- 0002 Vite + React single-page app
- 0003 TypeScript 6.0, strict
- 0004 Node.js 24 LTS
- 0005 Hosting: Cloudflare Workers static assets, free first
- 0006 Supply-chain and safety defaults

## Known issues and follow-ups

- GitHub Actions can't start: account billing lock (`docs/upgrade-later.md` item 8). **Blocks acceptance.**
- The preview URL isn't posted on PRs; the e2e test runs against previews manually (item 10).
- Previews and staging are public URLs (item 11).
- Control-plane image builds are slow on a busy connection; no `buildx` on the dev machine (item 13).
- End-of-phase review of `docs/upgrade-later.md`: nothing else is due yet. Items 1, 5 (branch protection, merge-result testing) depend on 8; item 12 is due in phase 1c; items 2, 3 wait for their external triggers.

## Next phase preview: 1a, design system in code

- Graphite tokens: `tools/figma-tokens` reads a Figma variables export (seed JSON with the muted palette until then) into CSS variables and typed tokens.
- Base components: Button, Tag, Input, Toggle, Menu, Tooltip, Tabs, Panel, Flow node, in dark and a proposed light theme.
- A Storybook component catalogue, with screenshot comparison against the Figma components.
- The version page gets the Graphite look.

## Follow-up: staging verification after merge

PR #1 was merged on 26 Oct 2026 as merge commit `9a18708` (under the recorded exception). Cloudflare Workers Builds deployed `main` to staging (check "Workers Builds: flowcanvas": success).

| Check | Result |
| --- | --- |
| `https://flowcanvas.ahujaarmaan7777.workers.dev` | HTTP 200 |
| Security headers | `content-security-policy`, `x-content-type-options`, `referrer-policy`, `permissions-policy` present |
| Commit in the deployed bundle | `9a18708`, equal to `main`'s HEAD |
| `E2E_BASE_URL=https://flowcanvas.ahujaarmaan7777.workers.dev E2E_EXPECTED_COMMIT=9a18708… pnpm --filter @flowcanvas/e2e test:e2e` | ✓ 1 passed (Chromium) |

**Done when: "the staging URL loads the app": met.** **Try it: "open the staging link; the app loads and shows its version": met.**
