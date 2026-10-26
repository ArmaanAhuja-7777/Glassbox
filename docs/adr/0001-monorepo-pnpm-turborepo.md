# 0001 — Monorepo with pnpm workspaces and Turborepo

- Status: accepted
- Date: 26 Oct 2026
- Phase: 1 (steps 2, 4)

## Context

Flowcanvas has many parts that change together: the web app, the control plane, the workspace agent, the engine and shared types. The build prompt suggests a pnpm + Turborepo monorepo. A change to a shared type and every use of it should land in one commit and one review, and CI should only rebuild what changed.

## Options considered

1. **Polyrepo** (one repository per part). Clear ownership, but shared types need publishing and version bumps, and cross-cutting changes need several PRs.
2. **npm or Yarn workspaces + plain scripts.** Simple, but no task graph or caching, and a hoisted `node_modules` lets packages use dependencies they never declared.
3. **pnpm workspaces + Turborepo.** pnpm's strict, content-addressed `node_modules` and catalogs (one version per dependency); Turborepo's dependency-aware task graph and caching.
4. **Nx.** More powerful generators and plugins, but heavier and more opinionated than we need.

## Decision

pnpm workspaces (pnpm 12, pinned with `packageManager` through Corepack) with catalogs for shared versions, and Turborepo 2 for `build`, `typecheck`, `test`, `lint`, `dev` and `test:e2e`. Packages are **compiled** (each builds `src/` to `dist/`, and `exports` points at `dist`), so every consumer (Vite, Node, Docker) sees the same JavaScript. Package scope `@flowcanvas/*`.

## Consequences

- One install, one lockfile, one version per dependency (catalog).
- `^build` ordering means a package's dependencies are built first; unchanged tasks are cache hits.
- Env vars that affect outputs must be declared in `turbo.json` (strict env mode). `FLOWCANVAS_COMMIT` is declared for the web build so a cached bundle can never show a stale commit.
- Turbo telemetry is disabled on dev machines and in CI.
- Compiled packages need a build before dependents type-check; Turbo handles the order.
- Root-level files that affect every package (`tsconfig.base.json`) are listed in `globalDependencies`.
