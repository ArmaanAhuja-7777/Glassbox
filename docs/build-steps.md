# Build steps

A running record of every step to build Flowcanvas, in order. Each step is explained in chat first and added here at the same time. The project owner then decides who does it (owner or Claude). Status: **done** (with commit and who did it), **next** (explained, waiting) or *planned*.

Machine conventions: fish shell, Node from the system (26.x locally; the repo pins 24 LTS), pnpm through Corepack.

---

## Phase 1 — Project skeleton

**Build:** Monorepo (web app, workspace agent, engine, control plane, shared types); React web app deployed to a staging URL; CI with lint, type checks and tests.
**Done when:** The staging URL loads the app; every pull request gets its own preview URL.
**Try it:** Open the staging link; the app loads and shows its version.

### Expected outcome

When phase 1 is done you can:

- Open a **staging URL** in your browser and see a page saying **Flowcanvas**, the version (`0.1.0`) and the commit it was built from. The page is plain and unstyled; the Graphite look arrives in phase 1a.
- Open any **pull request** on GitHub and find a bot comment with that PR's own **preview URL**, showing the PR's commit.
- Run the **control plane** in a Docker container locally and see the same version and commit from its `/health` as JSON. (Deploying it to Fly.io is deferred until phase 1c because it needs a payment method; see `docs/upgrade-later.md` item 12.)
- Run the same app **locally** with one command and see it in your browser at `http://localhost:5173`.
- Run **all checks** (lint, type-check, unit tests, end-to-end test) locally with one command each, and see them run automatically on every PR.

### Run and check it

*(Filled in as the steps land; complete at step 13.)*

```fish
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # all green
pnpm format:check
```

| What to check | How | Expected |
| --- | --- | --- |
| Code quality gates | the commands above | every task "successful"; `format:check` says all files use Prettier style |
| Shared package logic | `pnpm test` | `@flowcanvas/graph-model`: 3 tests passed |
| Web app runs locally | `pnpm dev` → http://localhost:5173 | heading **Flowcanvas** and `0.1.0 · <short commit>` matching `git rev-parse --short HEAD`; `pnpm test` → web: 2 passed |
| Control plane runs locally | `pnpm dev`, then `curl http://127.0.0.1:8080/health` | `{"status":"ok","version":"0.1.0","commit":"<git rev-parse HEAD>"}`; `pnpm test` → control-plane: 3 passed (incl. secret-redaction canary) |
| End-to-end test | `pnpm test:e2e` (first time: `pnpm --filter @flowcanvas/e2e exec playwright install chromium`) | real Chromium opens the production build: `1 passed`; `E2E_EXPECTED_COMMIT=deadbeef00 pnpm test:e2e` must fail |
| PR preview URL | `https://phase-1-project-skeleton-flowcanvas.ahujaarmaan7777.workers.dev` (branch alias, always the latest push) or `https://<first 8 chars of version id>-flowcanvas.ahujaarmaan7777.workers.dev` (one version) | **Flowcanvas** and `0.1.0 · <PR head commit>`; `curl -sI <url>` shows `content-security-policy`; `E2E_BASE_URL=<url> E2E_EXPECTED_COMMIT=(git rev-parse HEAD) pnpm --filter @flowcanvas/e2e test:e2e` → 1 passed |
| Staging (web) | step 13: `https://flowcanvas.ahujaarmaan7777.workers.dev` after merge | *pending* |
| Control plane in a container | step 12: `docker run` locally, then `curl /health` | *pending* |

### Steps

| # | Step | Status |
| --- | --- | --- |
| 1 | Tooling and repository | done · `7e59ec1` · Claude |
| 2 | Workspace root | done · `6b074cb` · Claude |
| 3 | Shared TypeScript config and `packages/graph-model` with its first test | done · `f7b99cd` · Claude |
| 4 | Turborepo tasks and caching | done · `5a010d9` · Claude |
| 5 | ESLint and Prettier | done · `d88f916` · Claude |
| 6 | `apps/web`: Vite + React, version and commit injected at build time, test | done · `3e33324` · Claude |
| 7 | `services/control-plane`: Fastify `/health`, tests, log redaction | done · `f03f422` · Claude |
| 8 | Minimal `workspace/agent` and `packages/engine` | done · `c30c1c0` · Claude |
| 9 | Playwright smoke test | done · `9f4245f` · Claude |
| 10 | GitHub Actions CI, open the PR, branch protection | done · `a3247c7` · Claude · ⚠ CI can't run until the GitHub account billing lock is resolved (`docs/upgrade-later.md` item 8) |
| 11 | Cloudflare (Workers static assets): previews per PR, smoke test on preview | done · `6359831` · Claude (repo) + owner (Cloudflare setup) · verified on preview of `be3cf59` |
| 12 | Control-plane Docker image, built and run locally (Fly.io deploy deferred: `docs/upgrade-later.md` item 12) | done · `17b96b7` · Claude · image verified in scratch; repo image build running |
| 13 | ADRs, `ARCHITECTURE.md`, `STATUS.md`, `CHANGELOG.md`, phase report, merge, staging live | **next** |

### Step 1 — Tooling and repository

**Goal:** pnpm installed reproducibly, the GitHub CLI on the owner's account, reference docs organised, first commit pushed to `main`.

**Node version.** Check https://nodejs.org/en/about/previous-releases (or `https://nodejs.org/dist/index.json`, field `lts`). On 26 Oct 2026, Node 26 was not yet LTS, so the repo pins **Node 24** ("Krypton", LTS since 24.11.0). Switch to 26 once it becomes LTS (ADR 0005).

**pnpm through Corepack.** Node 25+ no longer bundles Corepack, so install it from npm. Corepack reads `packageManager` in `package.json` and runs exactly that pnpm version everywhere.

```fish
npm config set prefix ~/.local          # user-level global installs, no sudo
fish_add_path ~/.local/bin              # persistent PATH entry in fish
npm install -g corepack@latest
corepack enable pnpm
pnpm --version                          # answer Y if asked to download
```

**GitHub CLI on the right account.**

```fish
gh auth login                           # only if the account isn't listed in `gh auth status`
gh auth switch --user ArmaanAhuja-7777
gh auth setup-git                       # plain `git push` uses the active gh account
gh auth status
```

**Folder layout.** Reference docs in `docs/reference/` (`build-plan.md`, `research-report.md`, `design-brief.md`, `design-language-graphite.md`), screenshots in `docs/reference/screens/`, Figma generator scripts in `docs/reference/figma-scripts/`. The build prompt is `CLAUDE.md` at the root, so Claude Code loads it every session.

**`.gitignore`:** build output (`node_modules/`, `dist/`, `build/`, `.turbo/`, `*.tsbuildinfo`), test output (`coverage/`, `playwright-report/`, `test-results/`, `blob-report/`), secrets (`.env`, `.env.*`, but `!.env.example`), tooling (`.wrangler/`, `.DS_Store`, `*.log`, `.idea/`).

**First commit.**

```fish
git init -b main
git add .gitignore CLAUDE.md docs
git status                              # only docs; nothing secret
git commit -m "docs: add product, design and build reference documents"
git remote add origin https://github.com/ArmaanAhuja-7777/Glassbox.git
git push -u origin main
```

**Gotchas:** a `403` on push means the wrong `gh` account is active. If `pnpm` isn't found in a new terminal, `~/.local/bin` isn't on PATH. A secret committed once stays in git history even after it's deleted.

### Step 2 — Workspace root

**Goal:** make the repo a pnpm workspace with pinned tool versions and shared editor rules, on the phase branch.

**Concepts:**
- A **workspace** is one repo with many packages, one install, one lockfile, and local cross-package links through `workspace:*`. Docs: https://pnpm.io/workspaces
- The root `package.json` is the control centre, not a shipped package. `"private": true` prevents accidental publishing.
- **`packageManager`** pins pnpm through Corepack.
- **`engines`** + **`engineStrict`** turn a wrong Node version into an error. In pnpm 10+ the setting lives in `pnpm-workspace.yaml`. Docs: https://pnpm.io/settings#enginestrict
- The **lockfile** pins the whole dependency tree. Always commit it; CI uses `--frozen-lockfile`.
- **`.nvmrc`** is the single source of the Node version for CI (`setup-node` reads it).
- **`.editorconfig`** sets indentation, line endings and final newline for every editor. Docs: https://editorconfig.org
- **`"type": "module"`** makes `.js` files ES modules. Every tool we use is ESM-first.

**Branch:**

```fish
git switch -c phase/1-project-skeleton
```

**`package.json`:**

```json
{
  "name": "flowcanvas",
  "version": "0.1.0",
  "private": true,
  "description": "Canvas-first, AI-native development environment (working name)",
  "type": "module",
  "packageManager": "pnpm@12.15.0",
  "engines": {
    "node": ">=24.11"
  },
  "scripts": {}
}
```

**`pnpm-workspace.yaml`:**

```yaml
packages:
  - "apps/*"
  - "services/*"
  - "workspace/*"
  - "packages/*"
  - "packages/connectors/*"
  - "tools/*"
  - "e2e"

engineStrict: true
```

**`.nvmrc`:** `24`

**`.editorconfig`:**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

**Commands:**

```fish
pnpm install                  # "Already up to date … using pnpm v12.15.0"; creates pnpm-lock.yaml (lockfileVersion '9.0')
pnpm ls -r --depth -1         # flowcanvas@0.1.0 (PRIVATE)
```

**Verify:**
- `pnpm --version` prints `12.15.0` inside the repo.
- Set `engines.node` to `">=99"` and run `pnpm install --frozen-lockfile`. Expect `ERR_PNPM_UNSUPPORTED_ENGINE`. Restore `>=24.11` afterwards.

**Gotchas:**
- A plain `pnpm install` on an already-installed repo says "Already up to date" and **skips the engine check**. Only fresh installs and `--frozen-lockfile` (CI) enforce it.
- Trailing commas and comments make `package.json` invalid.
- Always commit `pnpm-lock.yaml`.
- Check `git branch --show-current` before committing.

**Commit:** `chore: set up pnpm workspace root`

### Step 3 — Shared TypeScript config and the first package

**Goal:** one strict TypeScript configuration for the whole repo, and the first real package (`@flowcanvas/graph-model`) that builds, type-checks and has passing tests. It proves the package pattern every later package copies.

**Concepts:**
- **Why TypeScript 6.0.x, not 7.** TypeScript 7 is the native (Go) compiler. Its JavaScript API is published only as `typescript/unstable/*`, and typescript-eslint supports `typescript <6.1`. Phase 5 needs the stable compiler API, so we pin **6.0.3**, the last JavaScript-implemented line. We revisit when TS 7's API is stable (ADR 0004). Docs: https://www.typescriptlang.org/docs/
- **pnpm catalogs.** Shared dependency versions are defined once in `pnpm-workspace.yaml` under `catalog:`. Packages write `"typescript": "catalog:"`, so every package uses the same version and an upgrade is a one-line change. Docs: https://pnpm.io/catalogs
- **`tsconfig.base.json` + `extends`.** Every package inherits the same strict settings and only adds its own paths. Docs: https://www.typescriptlang.org/tsconfig/#extends
- **Strictness flags beyond `strict`:**
  - `noUncheckedIndexedAccess`: `arr[i]` is `T | undefined`.
  - `exactOptionalPropertyTypes`: `{ a?: string }` doesn't accept an explicit `undefined`.
  - `noImplicitOverride`
  - `noFallthroughCasesInSwitch`

  They catch whole classes of runtime bugs at compile time. Docs: https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
- **`module`/`moduleResolution: nodenext`.** TypeScript follows Node's real ESM rules, so relative imports need the **`.js` extension** (`./build-info.js`) even though the file is `.ts`; the extension names the file that will exist at runtime. The web app overrides this with `bundler` in step 6. Docs: https://www.typescriptlang.org/docs/handbook/modules/theory.html
- **`verbatimModuleSyntax` + `isolatedModules`.** Type-only imports must say `import type` (or `type` inline), so tools that compile one file at a time (Vite, Vitest, esbuild) can safely drop them.
- **`types: []`.** No ambient global types (such as `@types/node`) leak into a package unless it opts in. `graph-model` is pure TypeScript and shouldn't see Node globals.
- **Compiled internal packages.** Each package builds `src/` into `dist/` (JS + `.d.ts`). `exports` points consumers at `dist`, and Turborepo (step 4) builds dependencies first. The alternative, consuming raw `.ts` source, saves a build but forces every consumer (Vite, Node, the Fastify service, Docker images) to transpile other packages' TypeScript. Compiled packages behave the same everywhere. Docs: https://nodejs.org/api/packages.html#package-entry-points
- **Two tsconfigs per package.** `tsconfig.json` type-checks everything, including tests. `tsconfig.build.json` extends it, excludes tests and emits `dist/`.
- **Vitest basics.**
  - `describe` groups tests, `it` is one case, and `expect(x).toBe(y)` asserts.
  - `vitest run` runs once (CI style). Plain `vitest` watches.
  - Test files sit next to the code as `*.test.ts`. Imports come from `'vitest'` explicitly; no globals.
  - Docs: https://vitest.dev/guide/
- **What makes a good unit test:** the normal case, the edge cases (already-short SHA), and the "honest failure" case (no commit known → say "unknown" instead of inventing one, the product's never-fabricate rule in miniature).

**`pnpm-workspace.yaml`** (append):

```yaml

catalog:
  typescript: 6.0.3
  vitest: 5.0.5
```

**Root `package.json`:** add a dev dependency so editors and root commands use the same TypeScript:

```json
  "devDependencies": {
    "typescript": "catalog:"
  }
```

**`tsconfig.base.json`** (repo root):

```json
{
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "types": [],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

`es2024` is fully supported by Node 24 and current browsers. `declarationMap` lets "go to definition" jump into a package's `.ts` source instead of its `.d.ts`.

**`packages/graph-model/package.json`:**

```json
{
  "name": "@flowcanvas/graph-model",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**`packages/graph-model/tsconfig.json`:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**`packages/graph-model/tsconfig.build.json`:**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.test.ts"]
}
```

**`packages/graph-model/src/build-info.ts`:**

```ts
export interface BuildInfo {
  readonly version: string;
  readonly commit: string;
}

const SHORT_SHA_LENGTH = 7;

export function formatBuildInfo(info: BuildInfo): string {
  const commit = info.commit.trim();
  const shown = commit === '' ? 'unknown commit' : commit.slice(0, SHORT_SHA_LENGTH);
  return `${info.version} · ${shown}`;
}
```

**`packages/graph-model/src/index.ts`:**

```ts
export { formatBuildInfo, type BuildInfo } from './build-info.js';
```

**`packages/graph-model/src/build-info.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { formatBuildInfo } from './build-info.js';

describe('formatBuildInfo', () => {
  it('shortens a full commit SHA to 7 characters', () => {
    expect(
      formatBuildInfo({ version: '0.1.0', commit: '7e59ec1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e' }),
    ).toBe('0.1.0 · 7e59ec1');
  });

  it('keeps a commit that is already short', () => {
    expect(formatBuildInfo({ version: '0.1.0', commit: 'abc12' })).toBe('0.1.0 · abc12');
  });

  it('says the commit is unknown instead of inventing one', () => {
    expect(formatBuildInfo({ version: '0.1.0', commit: '  ' })).toBe('0.1.0 · unknown commit');
  });
});
```

**Commands:**

```fish
pnpm install                                   # adds typescript 6.0.3 and vitest 5.0.5
pnpm --filter @flowcanvas/graph-model typecheck
pnpm --filter @flowcanvas/graph-model test     # 1 file, 3 tests passed
pnpm --filter @flowcanvas/graph-model build    # dist/ gets index.js, index.d.ts, build-info.js, maps
```

`--filter` runs a script in one workspace package from the repo root. Docs: https://pnpm.io/filtering

**Verify:**
- Type-check prints nothing (silence means success).
- Tests: `Tests 3 passed (3)`.
- `dist/` has no `*.test.*` files.
- `ls -la packages/graph-model/node_modules` shows `typescript` and `vitest` as **symlinks** into `node_modules/.pnpm/…`: pnpm's content-addressed store.
- Break something on purpose: change `'unknown commit'` to `'n/a'`, rerun the tests, see one fail with a diff, then revert.

**Gotchas:**
- Writing `./build-info` without `.js` fails under `nodenext` (`Relative import paths need explicit file extensions`).
- Exporting a type without `type` under `verbatimModuleSyntax` gives error TS1205/TS1484.
- `dist/` is git-ignored. Never edit it.
- `tsc` doesn't delete stale files from `dist/`. If you rename a source file, delete `dist/` before rebuilding (a `clean` task comes later).

**Commit:** `feat(graph-model): add shared TypeScript config and build info formatter`

**Done notes (step 3):** the deliberate-failure check worked (`Expected: "0.1.0 · unknown commit"`, `Received: "0.1.0 · n/a"`). `dist/` stays out of git.

### Step 4 — Turborepo tasks and caching

**Goal:** one command at the root (`pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint`) runs that task in every package, in dependency order, in parallel where possible, and skips work whose inputs haven't changed.

**Concepts:**
- **Task graph.** Turborepo reads each package's `package.json` dependencies and the task rules in `turbo.json`, then builds a graph of tasks such as `@flowcanvas/web#build` and `@flowcanvas/graph-model#build`. Docs: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks
- **`dependsOn: ["^build"]`.** The caret means "the `build` task of my **dependencies** first". So `web#typecheck` waits for `graph-model#build`, because `web` imports `graph-model`'s `dist/*.d.ts`. Without the caret (`["build"]`) it would mean "my own build first".
- **Caching.**
  - Before running a task, Turbo hashes its inputs: the package's files, the hashes of its dependencies' tasks, the relevant lockfile entries, `globalDependencies`, and any env vars you declare.
  - If that hash has run before, Turbo **restores the declared `outputs`** (such as `dist/**`) and replays the saved logs instead of running the task ("cache hit, replaying logs", "FULL TURBO").
  - Tasks with no `outputs` (test, typecheck) cache only their logs and success.
  - The local cache lives in `.turbo/` (git-ignored). A shared remote cache can come later.
  - Docs: https://turborepo.dev/docs/crafting-your-repository/caching
- **`globalDependencies`.** Files outside any package that affect every task. `tsconfig.base.json` sits at the root, so without this line, changing it would **not** invalidate the cache and you'd get stale "passing" results.
- **Telemetry is off.** Turborepo sends anonymous usage telemetry by default. Our rule is telemetry off by default, for our tools too: disable it once per machine, and in CI with `TURBO_TELEMETRY_DISABLED=1` (step 10). Docs: https://turborepo.dev/docs/telemetry
- **Running one package.** `pnpm --filter @flowcanvas/graph-model test` runs that package's script directly, without Turbo. `pnpm exec turbo run test --filter=@flowcanvas/graph-model` runs it through Turbo, with its dependencies and cache.

**`pnpm-workspace.yaml`:** add to the catalog (alphabetical):

```yaml
catalog:
  turbo: 2.11.10
  typescript: 6.0.3
  vitest: 5.0.5
```

**Root `package.json`:** scripts and dev dependency:

```json
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "catalog:",
    "typescript": "catalog:"
  }
```

**`turbo.json`** (repo root):

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": ["tsconfig.base.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

- `$schema` gives editor autocomplete and validation.
- `lint` depends on `^build` because type-aware ESLint rules (step 5) need dependencies' types.
- A `dev` task (persistent, uncached) comes in step 6 with the web app.

**Commands:**

```fish
pnpm install
pnpm exec turbo telemetry disable    # once per machine
pnpm build                           # 1 successful, 0 cached
pnpm build                           # again: 1 cached, ">>> FULL TURBO", a few ms
pnpm test                            # Tests 3 passed
pnpm test                            # "cache hit, replaying logs"
pnpm typecheck
pnpm lint                            # "0 total": no package has a lint script yet (step 5)
pnpm exec turbo run build --dry=json # inspect the task graph and cache status without running
```

**Verify:**
- The second `pnpm build` is a full cache hit.
- Delete `packages/graph-model/dist`, then run `pnpm build`. It's still a cache hit, **and `dist/` is back**: Turbo restored the declared outputs from cache.
- Add a blank line to `tsconfig.base.json` and run `pnpm build`. It should be a cache **miss** (proves `globalDependencies`). Revert the change.
- `pnpm exec turbo telemetry status` says you've opted out.

**Gotchas:**
- Forgetting `outputs` on `build` means a cache hit restores **nothing**: logs say success, `dist/` is missing, and the next package fails confusingly.
- Turbo only sees env vars you declare (`env` / `globalEnv`). From step 6 on, any env var that changes a build output (such as the commit SHA) must be declared, or the cache will serve a build with a stale value.
- Running `vitest` directly inside a package bypasses Turbo and its `^build` ordering. If a dependency's `dist/` is stale, build first.

**Commit:** `build: add Turborepo task pipeline`

**Done notes (step 4):**
- Cache hits restore `dist/` (deleted, rebuilt from cache, 8 files back).
- Touching `tsconfig.base.json` causes a cache miss.
- Telemetry status: Disabled.
- Quick-check answer: changing **only a test file** in `graph-model` still invalidates `graph-model#build`. Turbo hashes all files in the package by default, regardless of what `tsc` compiles. It could be narrowed with `"inputs": ["$TURBO_DEFAULT$", "!src/**/*.test.ts"]` on `build`; not done yet, since the build is fast.

### Step 5 — ESLint and Prettier

**Goal:** every package is linted with type-aware rules through `pnpm lint` (via Turbo), and the whole repo has one consistent format enforced by `pnpm format:check`, ready to become CI gates in step 10.

**Concepts:**
- **Linter vs formatter.** ESLint finds *problems* (bugs, unsafe patterns). Prettier only decides *layout* (quotes, wrapping, commas). Keeping them separate means style never shows up as a lint error. `eslint-config-prettier` switches off the few ESLint rules that would fight Prettier. Docs: https://prettier.io/docs/integrating-with-linters
- **Flat config (`eslint.config.js`).**
  - ESLint 9+ uses one JavaScript file that exports an array of config objects. Later objects override earlier ones for the files they match.
  - `defineConfig()` (from `eslint/config`) gives typing and supports `extends` inside an object.
  - `globalIgnores()` excludes paths everywhere.
  - `typescript-eslint`'s older `tseslint.config()` helper is deprecated in favour of `defineConfig()`.
  - Docs: https://eslint.org/docs/latest/use/configure/configuration-files
- **Where ESLint finds the config.** ESLint 10 looks for `eslint.config.js` starting from each linted file's folder and walking up. A package running `eslint .` finds the one root config; there's no per-package copy.
- **Type-aware linting.** `strictTypeChecked` rules use the TypeScript type checker, not just syntax. Examples:
  - `no-floating-promises`: an unawaited promise silently swallows errors.
  - `require-await`
  - `no-unnecessary-condition`
  - `no-non-null-assertion`

  `projectService: true` lets each file use its nearest `tsconfig.json`. Plain `.js` config files have no types, so `disableTypeChecked` turns those rules off for `**/*.js`. Docs: https://typescript-eslint.io/getting-started/typed-linting
- **Which rule sets.** `strictTypeChecked` is the opinionated bug-catching set. `stylisticTypeChecked` covers consistent TypeScript idioms (for example, prefer `interface` for object types). Both are recommended for new projects by the typescript-eslint team. Docs: https://typescript-eslint.io/users/configs
- **Prettier settings.** We keep the defaults except single quotes, 100-column lines and trailing commas everywhere (smaller diffs). `.prettierignore` skips generated files, the lockfile, the reference docs, and Markdown, because the docs' hand-aligned tables would be rewritten. Docs: https://prettier.io/docs/options
- **Why Prettier runs at the root and not through Turbo.** It is fast, has no package dependencies, and one `prettier --check .` covers config files outside packages too (`turbo.json`, `pnpm-workspace.yaml`, workflows later).

**`pnpm-workspace.yaml`:** catalog becomes (Prettier will turn the double quotes into single quotes):

```yaml
catalog:
  '@eslint/js': 10.0.1
  eslint: 10.13.0
  eslint-config-prettier: 10.1.8
  prettier: 3.9.10
  turbo: 2.11.10
  typescript: 6.0.3
  typescript-eslint: 8.72.0
  vitest: 5.0.5
```

**Root `package.json`:** add scripts and dev dependencies:

```json
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "@eslint/js": "catalog:",
    "eslint": "catalog:",
    "eslint-config-prettier": "catalog:",
    "prettier": "catalog:",
    "turbo": "catalog:",
    "typescript": "catalog:",
    "typescript-eslint": "catalog:"
  }
```

The config file at the root imports `@eslint/js`, `typescript-eslint` and `eslint-config-prettier`, so they are root dev dependencies. pnpm's strict `node_modules` only lets a file import what its own `package.json` declares.

**`packages/graph-model/package.json`:** add a `lint` script and `eslint` (each package runs its own `eslint` binary):

```json
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "devDependencies": {
    "eslint": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
```

**`eslint.config.js`** (repo root):

```js
// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/', '**/coverage/', '**/.turbo/', 'docs/reference/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
]);
```

- `// @ts-check` makes your editor type-check this JavaScript file, catching config typos.
- Order matters: recommended rules, then strict and stylistic, then parser options, then the `.js` exception, then `prettier` **last** so it can switch off conflicting rules.

**`.prettierrc.json`:**

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

**`.prettierignore`:**

```
dist/
coverage/
.turbo/
pnpm-lock.yaml
docs/reference/
*.md
```

**Commands:**

```fish
pnpm install
pnpm format          # rewrites files to Prettier style (pnpm-workspace.yaml gets single quotes)
pnpm format:check    # "All matched files use Prettier code style!"
pnpm lint            # turbo → @flowcanvas/graph-model:lint → eslint . → no problems
```

**Verify:** prove the type-aware rules are really on. Add `packages/graph-model/src/bad.ts`:

```ts
export async function load(): Promise<number> {
  return 1;
}
export function run(): void {
  load();
}
```

`pnpm lint` should report **`@typescript-eslint/require-await`** and **`@typescript-eslint/no-floating-promises`**, both of which need type information. Delete the file and lint is clean again.

**Editor (optional):** install the VS Code extensions "ESLint" (`dbaeumer.vscode-eslint`) and "Prettier" (`esbenp.prettier-vscode`), and turn on "Format on save". You then see the same results as CI while typing.

**Gotchas:**
- `Parsing error: … was not found by the project service` means the file isn't in any `tsconfig.json` `include`. Add it to a tsconfig, or lint it as plain JS.
- Running `eslint` from the root with no config file found means an ESLint version mismatch or a missing root dev dependency.
- If `pnpm format` reformats a file you didn't mean to touch, add it to `.prettierignore`. Don't fight Prettier with manual layout.
- Lint errors are fixed in code. Disable a rule only with a comment that explains why (`// eslint-disable-next-line rule-name -- reason`).

**Commit:** `chore: add ESLint (type-aware) and Prettier`

### Step 6 — The web app (`apps/web`)

**Goal:** a React app, built with Vite, that shows "Flowcanvas", the version and the exact commit it was built from. It runs locally with `pnpm dev` and has component tests. This is the page staging and previews will serve.

**Expected outcome:** `pnpm dev` and open http://localhost:5173: a plain page with the heading **Flowcanvas** and a line like **0.1.0 · d88f916** (your current commit). It's unstyled on purpose; phase 1a applies the Graphite design.

**Concepts:**
- **How Vite works.**
  - In dev, Vite doesn't bundle. The browser loads `index.html`, which imports `/src/main.tsx`, and Vite transforms each file on request (TS/JSX → JS) and serves it as a native ES module. That is why startup is instant and edits hot-reload (HMR) in milliseconds.
  - `vite build` bundles everything with Rolldown (Vite 8's Rust bundler) into `dist/`, with hashed file names for caching.
  - `vite preview` serves that `dist/` locally, so you can check the real production output.
  - Docs: https://vite.dev/guide/why.html and https://vite.dev/guide/
- **`index.html` is the entry point.** It sits at the package root (not in `public/`). Vite follows its `<script type="module">` to find the app.
- **`define`: compile-time constants.** `define: { __FLOWCANVAS_BUILD__: JSON.stringify(buildInfo) }` makes Vite replace every `__FLOWCANVAS_BUILD__` in the source with that literal object at build time. Nothing is fetched at runtime; the version is baked into the bundle. The `declare const` in `vite-env.d.ts` tells TypeScript the global exists and what type it has. Docs: https://vite.dev/config/shared-options.html#define
- **Where the commit comes from.** `vite.config.ts` uses `FLOWCANVAS_COMMIT` if set (CI sets it), otherwise `git rev-parse HEAD`, otherwise an empty string. The shared formatter then shows "unknown commit": we never invent one.
- **Turbo's strict env mode and the cache.** Turbo 2 passes a task only the env vars it declares, and hashes them. `@flowcanvas/web#build` declares `env: ["FLOWCANVAS_COMMIT"]`, and the root `build` script sets it to the current commit (`FLOWCANVAS_COMMIT=$(git rev-parse HEAD) turbo run build`; pnpm runs scripts with `sh`, so `$(…)` works). A new commit therefore means a new hash and a rebuild of `web` only, while `graph-model` stays cached. Without this, a cached bundle could show an **old** commit, which is exactly the "stale value shown as current" mistake the product forbids. Docs: https://turborepo.dev/docs/crafting-your-repository/using-environment-variables
- **Package-specific task (`@flowcanvas/web#build`).** It overrides the generic `build` rule for one package only.
- **The `dev` task.** `persistent: true` (it never exits) and `cache: false` (a running server can't be cached). It still depends on `^build`, so `graph-model` is compiled before Vite starts.
- **`moduleResolution: bundler`.** The web app is bundled by Vite, not run by Node, so it uses bundler resolution: extensionless relative imports (`./App`) are fine here, unlike the `.js` rule in Node packages. `jsx: react-jsx` uses React's automatic JSX runtime (no `import React` needed). `lib` adds `dom` types. Docs: https://www.typescriptlang.org/docs/handbook/modules/reference.html#bundler
- **`types: ["vite/client", "node"]`.** `vite/client` types things like `import.meta.env` and asset imports. `node` is there for `vite.config.ts`, which runs in Node. Trade-off: browser code could type-check a Node-only API like `process`. We accept that for now with one tsconfig, rather than splitting `tsconfig.app.json` and `tsconfig.node.json`, because typescript-eslint's project service picks up a single `tsconfig.json` cleanly.
- **Component tests with Testing Library.**
  - Vitest runs the test in **jsdom**, a simulated browser DOM in Node (`test.environment: 'jsdom'`).
  - `render()` mounts the component. `screen.getByRole('heading', { name: 'Flowcanvas' })` finds it the way a user or screen reader would, and **throws** if it isn't there, so the lookup itself is the assertion.
  - `cleanup` after each test unmounts components, so tests don't leak into each other (automatic only when Vitest globals are on; we keep imports explicit).
  - Docs: https://testing-library.com/docs/react-testing-library/intro/ and https://testing-library.com/docs/queries/about#priority
- **Props over globals for testability.** `App` receives `buildInfo` as a prop. Only `main.tsx` reads the global `__FLOWCANVAS_BUILD__`. Tests pass a fixed value, so they don't depend on whichever commit you're on.
- **Fail loudly at startup.** If `#root` is missing, `main.tsx` throws a clear error instead of rendering nothing silently.

**`pnpm-workspace.yaml`:** the catalog becomes:

```yaml
catalog:
  '@eslint/js': 10.0.1
  '@testing-library/dom': 10.4.2
  '@testing-library/react': 16.3.3
  '@types/node': 24.19.2
  '@types/react': 19.3.0
  '@types/react-dom': 19.3.0
  '@vitejs/plugin-react': 6.1.2
  eslint: 10.13.0
  eslint-config-prettier: 10.1.8
  jsdom: 30.1.3
  prettier: 3.9.10
  react: 19.3.1
  react-dom: 19.3.1
  turbo: 2.11.10
  typescript: 6.0.3
  typescript-eslint: 8.72.0
  vite: 8.3.5
  vitest: 5.0.5
```

`@types/node` is pinned to the 24 line to match the Node version we target, not your local 26.

**Root `package.json`:** scripts become:

```json
  "scripts": {
    "dev": "turbo run dev",
    "build": "FLOWCANVAS_COMMIT=$(git rev-parse HEAD) turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
```

**`turbo.json`:** add two tasks:

```json
    "@flowcanvas/web#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["FLOWCANVAS_COMMIT"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
```

**`apps/web/package.json`:**

```json
{
  "name": "@flowcanvas/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "@flowcanvas/graph-model": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@testing-library/dom": "catalog:",
    "@testing-library/react": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "eslint": "catalog:",
    "jsdom": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vitest": "catalog:"
  }
}
```

`"@flowcanvas/graph-model": "workspace:*"` links the local package; `*` means "whatever version is in the workspace".

**`apps/web/tsconfig.json`:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["es2024", "dom", "dom.iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client", "node"],
    "noEmit": true
  },
  "include": ["src", "vite.config.ts"]
}
```

**`apps/web/index.html`:**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flowcanvas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`apps/web/vite.config.ts`:**

```ts
/// <reference types="vitest/config" />
import { execFileSync } from 'node:child_process';
import type { BuildInfo } from '@flowcanvas/graph-model';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import rootPackage from '../../package.json' with { type: 'json' };

function resolveCommit(): string {
  const fromEnv = process.env.FLOWCANVAS_COMMIT?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const buildInfo: BuildInfo = { version: rootPackage.version, commit: resolveCommit() };

export default defineConfig({
  plugins: [react()],
  define: {
    __FLOWCANVAS_BUILD__: JSON.stringify(buildInfo),
  },
  test: {
    environment: 'jsdom',
  },
});
```

- `/// <reference types="vitest/config" />` lets the same file hold Vitest's `test` options with types.
- The version comes from the **root** `package.json`: the product version, one source of truth.
- `execFileSync('git', [...])` runs git without a shell, so there's no shell-injection surface.
- If git isn't available (for example, a Docker build without `.git`), the commit is empty and the page says "unknown commit".

**`apps/web/src/vite-env.d.ts`:**

```ts
/// <reference types="vite/client" />

declare const __FLOWCANVAS_BUILD__: import('@flowcanvas/graph-model').BuildInfo;
```

**`apps/web/src/App.tsx`:**

```tsx
import { formatBuildInfo, type BuildInfo } from '@flowcanvas/graph-model';

interface AppProps {
  readonly buildInfo: BuildInfo;
}

export function App({ buildInfo }: AppProps) {
  return (
    <main>
      <h1>Flowcanvas</h1>
      <p>{formatBuildInfo(buildInfo)}</p>
    </main>
  );
}
```

**`apps/web/src/main.tsx`:**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Flowcanvas could not start: the #root element is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App buildInfo={__FLOWCANVAS_BUILD__} />
  </StrictMode>,
);
```

`StrictMode` runs extra development-only checks (for example, double-invoking effects to expose missing cleanups). It has no effect in production.

**`apps/web/src/App.test.tsx`:**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('shows the product name', () => {
    render(<App buildInfo={{ version: '0.1.0', commit: '7e59ec1a2b3c' }} />);
    expect(screen.getByRole('heading', { name: 'Flowcanvas' })).toBeTruthy();
  });

  it('shows the version and short commit it was built from', () => {
    render(<App buildInfo={{ version: '0.1.0', commit: '7e59ec1a2b3c' }} />);
    expect(screen.getByText('0.1.0 · 7e59ec1')).toBeTruthy();
  });
});
```

**Commands:**

```fish
pnpm install
pnpm format
pnpm lint && pnpm typecheck && pnpm test   # 3 tasks each; tests: graph-model 3 passed, web 2 passed
pnpm build                                 # web: dist/index.html + dist/assets/index-<hash>.js (~220 kB, ~69 kB gzip)
pnpm dev                                   # open http://localhost:5173
pnpm --filter @flowcanvas/web preview      # serves the production build at http://localhost:4173
```

**Run and check it:**
1. `pnpm dev`, open http://localhost:5173. You see **Flowcanvas** and **0.1.0 · <your short commit>** (compare with `git rev-parse --short HEAD`).
2. Edit the `<h1>` text in `App.tsx` and save. The browser updates instantly without a reload (HMR). Revert.
3. `pnpm build`, then `pnpm build` again: the second is "FULL TURBO". Make a commit and build again: only `@flowcanvas/web#build` re-runs, and `dist` now contains the new commit.
4. `pnpm --filter @flowcanvas/web preview`, open http://localhost:4173: the production build, same text.

**Gotchas:**
- **Blank page in the browser?** Open the devtools console. An error such as "#root element is missing" points straight at `index.html`.
- **`__FLOWCANVAS_BUILD__ is not defined` in the browser** means you ran a build that bypassed `vite.config.ts`. Always build through Vite.
- **Port 5173 already in use?** Vite picks the next free port and prints it. Read the terminal.
- **Running `vite build` directly in `apps/web`** skips the root script, so `FLOWCANVAS_COMMIT` isn't set. The config falls back to `git rev-parse`, so the commit is still right, but Turbo's cache wasn't involved.
- **Forgetting `afterEach(cleanup)`** makes the second test see two headings and fail with "Found multiple elements".

**Commit:** `feat(web): add Vite React app showing version and commit`

### Step 7 — The control-plane stub (`services/control-plane`)

**Goal:** the first back-end service. It's a Fastify server with a `GET /health` endpoint that returns its status, version and commit, has tests, and has log redaction from day one, so secrets can never reach logs. It becomes the real control plane (accounts, projects, vault) in phase 1c. For now it proves the service pattern and gives staging a back end to check.

**Expected outcome:** `pnpm dev` now starts **both** apps. `curl http://127.0.0.1:8080/health` returns `{"status":"ok","version":"0.1.0","commit":"<your full commit>"}`, and `pnpm test` shows 3 control-plane tests passing, including one that plants fake secrets and proves they never appear in the logs.

**Concepts:**
- **Fastify.**
  - A fast, schema-friendly Node HTTP framework with first-class TypeScript types.
  - Route handlers can simply `return` a value; Fastify serialises it to JSON.
  - It logs through **pino**, which writes structured JSON log lines (one object per line, easy to search later) and has built-in **redaction**.
  - Docs: https://fastify.dev/docs/latest/Guides/Getting-Started/ and https://getpino.io/#/docs/redaction
- **Why redaction now.** Non-negotiable rule 5: secrets are never logged.
  - `redact` paths (`*.token`, `*.apiKey`, `req.headers.authorization`…) are replaced with `[Redacted]` **before** a line is written. A careless `log.info(config)` can't leak a key.
  - Phase 1c adds the vault; this guard is already in place when it does.
  - The `*` wildcard matches one level of nesting (`config.token`), not every depth. Deeper secrets need their own paths. Keep secrets out of log calls anyway: redaction is the safety net, not the plan.
- **`buildApp()` vs `server.ts`.**
  - `app.ts` builds and returns the app without listening on a port.
  - `server.ts` reads config, calls `listen`, and handles shutdown.
  - Tests import `buildApp` and call routes with **`app.inject()`**, which simulates an HTTP request in-process: no port, no network, fast and deterministic.
  - Docs: https://fastify.dev/docs/latest/Guides/Testing/
- **Dependency injection for testability.** `buildApp` receives `buildInfo` and the `logger` options as arguments. Tests pass a fixed build info and a capture stream (a `Writable` that collects log lines into an array), so they can assert on exactly what would be logged.
- **Canary tests.** Put a fake, unmistakable secret (`CANARY-TOKEN-123`) where a real one could be, then assert it appears nowhere in the output. CLAUDE.md §8 asks for this style of security test on every merge. **Check the test can fail:** remove `redact` and it must go red (verified: it does).
- **Where the version and commit come from at runtime.**
  - The version is read from the package's own `package.json`. `src/` and `dist/` both sit one level below it, so `new URL('../package.json', import.meta.url)` works in dev and in production.
  - All packages share the product version (`0.1.0`, versioned in lockstep).
  - The commit comes from `FLOWCANVAS_COMMIT` (set by the Docker build in step 12), otherwise `git rev-parse HEAD`, otherwise empty ("unknown"), never invented.
- **Bind address.** `127.0.0.1` (loopback) by default. `0.0.0.0` listens on every network interface, which on your laptop exposes the server to anyone on your Wi-Fi (seen in testing: it bound to `192.168.1.14`). The container sets `HOST=0.0.0.0` explicitly, because a container must accept traffic from outside itself. Safe by default; open on purpose.
- **Graceful shutdown.** On `SIGTERM` (sent by Fly.io, Docker or Ctrl+C), `app.close()` stops accepting new connections and lets in-flight requests finish before exiting.
- **Running TypeScript in dev with `tsx`.**
  - Node 24 can strip TypeScript types itself, but it won't map our `./app.js` import specifiers to `app.ts`.
  - `tsx watch src/server.ts` handles that and restarts on every save. Production runs the compiled `dist/server.js` with plain `node`.
  - Docs: https://tsx.is/
- **Top-level `await`** in `server.ts` is allowed because the package is ESM (`"type": "module"`) and the target is ES2024.

**`pnpm-workspace.yaml`:** add to the catalog (alphabetical):

```yaml
  fastify: 5.12.7
  tsx: 4.23.15
```

**`services/control-plane/package.json`:**

```json
{
  "name": "@flowcanvas/control-plane",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "@flowcanvas/graph-model": "workspace:*",
    "fastify": "catalog:"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "eslint": "catalog:",
    "tsx": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**`services/control-plane/tsconfig.json`:** same pattern as `graph-model`, plus Node types:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src"]
}
```

**`services/control-plane/tsconfig.build.json`:**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.test.ts"]
}
```

**`services/control-plane/src/build-info.ts`:**

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { BuildInfo } from '@flowcanvas/graph-model';

interface PackageJson {
  readonly version: string;
}

function readVersion(): string {
  // src/ and dist/ both sit one level below package.json, so this works in dev and in production.
  const packageJsonUrl = new URL('../package.json', import.meta.url);
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as PackageJson;
  return packageJson.version;
}

function readCommit(env: NodeJS.ProcessEnv): string {
  const fromEnv = env.FLOWCANVAS_COMMIT?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function readBuildInfo(env: NodeJS.ProcessEnv = process.env): BuildInfo {
  return { version: readVersion(), commit: readCommit(env) };
}
```

**`services/control-plane/src/app.ts`:**

```ts
import type { BuildInfo } from '@flowcanvas/graph-model';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

export interface AppOptions {
  readonly buildInfo: BuildInfo;
  readonly logger?: FastifyServerOptions['logger'];
}

// Log fields that may carry secrets. Values are replaced before a log line is written.
export const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.secret',
  '*.token',
  '*.apiKey',
];

export function buildApp({ buildInfo, logger = true }: AppOptions): FastifyInstance {
  const app = Fastify({
    logger:
      logger === false ? false : { ...(logger === true ? {} : logger), redact: REDACTED_LOG_PATHS },
  });

  app.get('/health', () => ({
    status: 'ok',
    version: buildInfo.version,
    commit: buildInfo.commit,
  }));

  return app;
}
```

**`services/control-plane/src/server.ts`:**

```ts
import { buildApp } from './app.js';
import { readBuildInfo } from './build-info.js';

const port = Number(process.env.PORT ?? 8080);
// Loopback by default so a dev server is never exposed on the local network; containers set HOST=0.0.0.0.
const host = process.env.HOST ?? '127.0.0.1';

const app = buildApp({ buildInfo: readBuildInfo() });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error, 'control plane failed to start');
  process.exit(1);
}
```

**`services/control-plane/src/app.test.ts`:**

```ts
import { Writable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const buildInfo = { version: '0.1.0', commit: '7e59ec1a2b3c' };
let app: ReturnType<typeof buildApp> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /health', () => {
  it('returns status, version and commit', async () => {
    app = buildApp({ buildInfo, logger: false });
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', version: '0.1.0', commit: '7e59ec1a2b3c' });
  });

  it('returns 404 for unknown routes', async () => {
    app = buildApp({ buildInfo, logger: false });
    const response = await app.inject({ method: 'GET', url: '/nope' });
    expect(response.statusCode).toBe(404);
  });
});

describe('logging', () => {
  it('never writes secret values to the log', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    app = buildApp({ buildInfo, logger: { stream } });
    await app.ready();

    app.log.info(
      { config: { token: 'CANARY-TOKEN-123', apiKey: 'CANARY-KEY-456' } },
      'loaded config',
    );
    await app.inject({
      method: 'GET',
      url: '/health',
      headers: { authorization: 'Bearer CANARY-AUTH-789' },
    });

    const output = lines.join('');
    expect(output).toContain('loaded config');
    expect(output).not.toMatch(/CANARY-/);
  });
});
```

**Commands:**

```fish
pnpm install
pnpm lint && pnpm typecheck && pnpm test   # 4 tasks each; control-plane: 3 passed
pnpm build                                 # services/control-plane/dist/server.js etc.
pnpm dev                                   # starts web (5173) AND control plane (8080)
```

**Run and check it:**
1. With `pnpm dev` running, in another terminal: `curl http://127.0.0.1:8080/health` returns `{"status":"ok","version":"0.1.0","commit":"<git rev-parse HEAD>"}`. The `pnpm dev` terminal shows a JSON log line for the request.
2. Production mode: `pnpm build`, then `FLOWCANVAS_COMMIT=test123 PORT=8081 pnpm --filter @flowcanvas/control-plane start`, then `curl http://127.0.0.1:8081/health` shows `"commit":"test123"`.
3. Prove the safety net: in `app.ts`, delete `, redact: REDACTED_LOG_PATHS`, run `pnpm --filter @flowcanvas/control-plane test`, and watch "never writes secret values to the log" **fail**. Restore it.
4. The startup log says `Server listening at http://127.0.0.1:8080` (loopback only), not your LAN IP.

**Gotchas:**
- `EADDRINUSE` means port 8080 is taken. Run with `PORT=8090` or stop the other process (`ss -ltnp | grep 8080`).
- Pino logs are JSON lines, which is good for machines. For humans in dev, pipe through `pino-pretty` later if wanted; don't log with `console.log`.
- Forgetting `await app.close()` in tests can leave handles open and make Vitest hang or warn.
- `app.inject()` doesn't open a port. If a test passes but `curl` fails, check `listen()`, `HOST` and `PORT`, not the route.
- Never put real secrets in tests. Use obvious canaries like `CANARY-…`.

**Commit:** `feat(control-plane): add Fastify health endpoint with log redaction`

### Step 8 — Minimal `packages/engine` and `workspace/agent`

**Goal:** give the two remaining packages named in the phase 1 Build line ("web app, workspace agent, engine, control plane, shared types") a real place in the monorepo. From today, lint, type-check, test and build cover them, so they can never quietly rot before their real work starts (agent in phase 1d, engine in phase 4).

**Expected outcome:** `pnpm ls -r --depth -1` lists 6 projects (root + 5 packages). `pnpm test` runs 6 tasks with 10 tests in total, all green.

**Concepts:**
- **Skeleton vs placeholder feature.**
  - CLAUDE.md forbids *placeholder features*: fake UI or fake data in the product.
  - An empty-but-wired *package* is different. It is infrastructure: a name, a build and a test, and the user sees nothing.
  - We keep it to the minimum. Each package exports only its own name, with a comment stating what it will hold and in which phase.
- **Why a test for one constant.** It proves the package is wired in: Turbo finds it, `tsc` builds it, Vitest runs it. Vitest also fails on a package with **no** test files (by design, so a typo in a test path can't pass silently). One honest smoke test is better than `--passWithNoTests`, which would hide that safety.
- **Copying the package pattern.** `engine` and `workspace-agent` reuse `graph-model`'s two tsconfigs unchanged. The folder depth is the same (`../../tsconfig.base.json`), and neither needs Node types yet. The engine and agent will add `"types": ["node"]` when they start touching files and processes.
- **Package names vs folders.** The folder `workspace/agent` holds the package `@flowcanvas/workspace-agent`. Package names are flat and must be unique; folders group by deployment target (`apps/` = browser, `services/` = our cloud, `workspace/` = inside each user's VM, `packages/` = shared libraries).

**Files:** for each of the two packages:

**`packages/engine/package.json`** (and `workspace/agent/package.json` with `"name": "@flowcanvas/workspace-agent"`):

```json
{
  "name": "@flowcanvas/engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "devDependencies": {
    "eslint": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**`tsconfig.json` and `tsconfig.build.json`:** identical copies of `packages/graph-model`'s.

**`packages/engine/src/index.ts`:**

```ts
// Analysis engine: indexer, parsers, resolvers and flow builder. It runs inside each workspace. Real code arrives in phase 4.
export const PACKAGE_NAME = '@flowcanvas/engine';
```

**`workspace/agent/src/index.ts`:**

```ts
// In-workspace daemon: file and process API, autosave journal, snapshots. Real code arrives in phase 1d.
export const PACKAGE_NAME = '@flowcanvas/workspace-agent';
```

**`src/index.test.ts`** (engine shown; the agent's uses its own name):

```ts
import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from './index.js';

describe('@flowcanvas/engine', () => {
  it('is wired into the workspace', () => {
    expect(PACKAGE_NAME).toBe('@flowcanvas/engine');
  });
});
```

**Commands:**

```fish
pnpm install
pnpm format
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # 6 / 6 / 6 / 5 tasks
pnpm ls -r --depth -1                                    # 6 projects
```

`build` is 5 tasks, not 6, because the root package has no build script.

**Run and check it:**
1. `pnpm test` shows `engine: 1 passed`, `workspace-agent: 1 passed`, alongside the other three packages: 10 tests in total.
2. `pnpm exec turbo run build --dry=json`: the plan now includes `@flowcanvas/engine#build` and `@flowcanvas/workspace-agent#build`, running in parallel with `graph-model` because they don't depend on each other.

**Gotchas:**
- If a new package doesn't show up in `pnpm ls -r`, its folder isn't matched by a glob in `pnpm-workspace.yaml`, or its `package.json` is missing or invalid.
- Two packages with the same `name` make pnpm refuse to install. Names must be unique across the workspace.
- `"files": ["dist"]` was expanded to three lines here because that's how Prettier formats `package.json`. Writing it on one line just gets reformatted by `pnpm format`.

**Commit:** `feat: add minimal engine and workspace-agent packages`

### Step 9 — Playwright end-to-end smoke test (`e2e/`)

**Goal:** the first test that opens a **real browser** (Chromium), loads the production build of the web app, and checks what a person would see. The same test later runs against the PR preview URL (step 11) and staging (step 12). This test is how "the staging URL loads the app and shows its version" gets *proved*, not just claimed.

**Expected outcome:** `pnpm test:e2e` builds the web app, serves it, opens Chromium, and prints `✓ … shows the product name and the version it was built from` with `1 passed`. `pnpm --filter @flowcanvas/e2e exec playwright show-report` opens an HTML report of the run.

**Concepts:**
- **Unit vs component vs end-to-end tests.**
  - Unit (graph-model) tests one function.
  - Component (web, Testing Library + jsdom) renders React in a *simulated* DOM.
  - End-to-end (Playwright) drives a *real* browser against a *real* server: real bundling, real HTML, real JavaScript execution.

  E2E is the slowest and most realistic, so we keep few of them and make each count. Docs: https://playwright.dev/docs/intro
- **Locators and auto-waiting.**
  - `page.getByRole('heading', { name: 'Flowcanvas' })` describes *what* to find, and Playwright re-checks it until it's true or a timeout (5 s by default) runs out.
  - So `await expect(locator).toBeVisible()` waits for the app to render. No `sleep`, and no flaky timing.
  - Docs: https://playwright.dev/docs/locators and https://playwright.dev/docs/test-assertions
- **`webServer`.** With no external URL, Playwright starts `vite preview` on `127.0.0.1:4173`, waits until it answers, runs the tests, then stops it. `reuseExistingServer` (locally only) reuses a preview you already have running. Docs: https://playwright.dev/docs/test-webserver
- **One test, any environment.**
  - `E2E_BASE_URL` points the same test at a deployed copy (PR preview, staging); then no local server starts.
  - `E2E_EXPECTED_COMMIT` makes the test demand the **exact** commit. In CI that's the commit being tested, so a preview showing a stale build fails.
  - Without it, the test accepts any 7-character hex commit, which still rejects "unknown commit".
- **Catching JavaScript errors.** `page.on('pageerror', …)` records uncaught exceptions in the page. The test asserts there were none, so a page can't pass by rendering text while throwing in the background.
- **Traces, videos and reports.**
  - `trace: 'retain-on-failure'` and `video: 'retain-on-failure'` keep a full recording (DOM snapshots, network, console) and a video of any **failed** test in `e2e/test-results/`.
  - The HTML report goes to `e2e/playwright-report/`. Both are git-ignored.
  - Phase 1b switches videos on for every run (the "recorded run" requirement).
  - Docs: https://playwright.dev/docs/trace-viewer
- **CI behaviour.** With `CI` set: `forbidOnly` (a forgotten `test.only` fails the run instead of silently skipping the others), 2 retries (absorbs rare network flakiness; repeated failures still fail), and the `github` reporter (annotates failures on the PR).
- **Browsers are separate downloads.** `@playwright/test` is the library; Chromium itself is installed with `playwright install chromium` into `~/.cache/ms-playwright`. **On CachyOS/Arch:** Playwright prints "your OS is not officially supported … downloading fallback build for ubuntu24.04-x64". That build runs fine here (verified). On CI's Ubuntu runner it's officially supported.
- **Wiring into Turbo.**
  - `e2e` lists `@flowcanvas/web` as a dev dependency, so `dependsOn: ["^build"]` builds the web app (and `graph-model`) first.
  - `cache: false`, because the result depends on a live server and browser, not just files.
  - The task declares `E2E_BASE_URL`, `E2E_EXPECTED_COMMIT` and `CI`, because Turbo's strict env mode passes only declared vars.
  - E2E has its own root script, `pnpm test:e2e`, and is **not** part of `pnpm test`, keeping the fast unit loop fast.

**`pnpm-workspace.yaml`:** add to the catalog:

```yaml
  '@playwright/test': 1.64.1
```

**Root `package.json`:** add after `"test"`:

```json
    "test:e2e": "FLOWCANVAS_COMMIT=$(git rev-parse HEAD) turbo run test:e2e",
```

`FLOWCANVAS_COMMIT` is set for the same reason as in `build`: the web build that the test serves must carry the current commit, and the Turbo hash must change with it.

**`turbo.json`:** add the task:

```json
    "test:e2e": {
      "dependsOn": ["^build"],
      "cache": false,
      "env": ["E2E_BASE_URL", "E2E_EXPECTED_COMMIT", "CI"]
    }
```

**`e2e/package.json`:**

```json
{
  "name": "@flowcanvas/e2e",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@flowcanvas/web": "workspace:*",
    "@playwright/test": "catalog:",
    "@types/node": "catalog:",
    "eslint": "catalog:",
    "typescript": "catalog:"
  }
}
```

**`e2e/tsconfig.json`:**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"],
    "noEmit": true
  },
  "include": ["tests", "playwright.config.ts"]
}
```

`e2e` sits one level below the root, so it's `../tsconfig.base.json`, not `../../`.

**`e2e/playwright.config.ts`:**

```ts
import { defineConfig, devices } from '@playwright/test';

// Point the tests at any deployed copy (PR preview, staging) with E2E_BASE_URL.
// Without it, Playwright serves the local production build of apps/web itself.
const externalBaseUrl = process.env.E2E_BASE_URL;
const localPreviewUrl = 'http://127.0.0.1:4173';
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseUrl ?? localPreviewUrl,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command:
            'pnpm --filter @flowcanvas/web exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
          url: localPreviewUrl,
          reuseExistingServer: !isCi,
          timeout: 30_000,
        },
      }),
});
```

**`e2e/tests/smoke.spec.ts`:**

```ts
import { expect, test } from '@playwright/test';

test('shows the product name and the version it was built from', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/');

  await expect(page).toHaveTitle('Flowcanvas');
  await expect(page.getByRole('heading', { name: 'Flowcanvas' })).toBeVisible();

  const expectedCommit = process.env.E2E_EXPECTED_COMMIT?.slice(0, 7);
  const buildLine = expectedCommit ? `0.1.0 · ${expectedCommit}` : /^0\.1\.0 · [0-9a-f]{7}$/;
  await expect(page.getByText(buildLine)).toBeVisible();

  expect(pageErrors).toEqual([]);
});
```

**Commands:**

```fish
pnpm install
pnpm --filter @flowcanvas/e2e exec playwright install chromium   # once per machine; ~150 MB to ~/.cache/ms-playwright
pnpm format
pnpm lint && pnpm typecheck                                      # now 8 tasks each (e2e lint/typecheck depend on the web build)
pnpm test:e2e                                                    # builds web, serves it, runs Chromium: 1 passed
```

**Run and check it:**
1. `pnpm test:e2e` prints `✓ 1 [chromium] › tests/smoke.spec.ts › shows the product name and the version it was built from` and `1 passed`.
2. Demand an exact commit: `E2E_EXPECTED_COMMIT=(git rev-parse HEAD) pnpm test:e2e` passes (fish syntax; in bash use `$(…)`).
3. **Prove it can fail:** `E2E_EXPECTED_COMMIT=deadbeef00 pnpm test:e2e` fails after ~5 s with `waiting for getByText('0.1.0 · deadbee')`. Then open `e2e/test-results/` (a video and a trace of the failure) and `pnpm --filter @flowcanvas/e2e exec playwright show-report`.
4. Against a running server: with `pnpm dev` running, `E2E_BASE_URL=http://localhost:5173 pnpm --filter @flowcanvas/e2e test:e2e` passes without starting its own server. This is exactly how it will test preview URLs.
5. Watch it happen: add `--headed` (`pnpm --filter @flowcanvas/e2e exec playwright test --headed`) to see the browser window, or `--ui` for Playwright's interactive runner.

**Gotchas:**
- `Executable doesn't exist at ~/.cache/ms-playwright/...` means browsers aren't installed. Run the `playwright install chromium` command.
- Port 4173 busy means another `vite preview` is running. Locally it's reused (`reuseExistingServer`). If it's a *different* app on 4173, stop it.
- Never use fixed waits (`page.waitForTimeout`). Assert on what the user would see and let auto-waiting do its job.
- A green unit suite with a red E2E usually means a wiring problem: the build, `define`, `index.html` or the server. Check the trace first.
- Use `pnpm test:e2e` from the root for a correct build; running `playwright test` inside `e2e/` uses whatever `apps/web/dist` happens to exist.

**Commit:** `test(e2e): add Playwright smoke test for version page`

### Step 10 — Continuous integration on GitHub Actions, and the phase PR

**Goal:** every push to a pull request and every push to `main` automatically runs format check, lint, type-check, unit tests, build and the Playwright test on a fresh GitHub machine. Results show on the PR, and the Playwright report is downloadable. Then we push the phase branch and open the phase 1 PR, which is where the preview URL (step 11) will appear.

**Expected outcome:** on GitHub, PR "Phase 1 — Project skeleton" shows two green checks: **Lint, typecheck, unit tests, build** and **End-to-end (Playwright)**. The Actions tab shows each step's log, and the e2e run has a `playwright-report` artifact.

**Concepts:**
- **What CI is for.** Your laptop is one machine with history (installed tools, caches, untracked files). CI runs the same commands on a **clean** machine for every change, so "works on my machine" becomes "works from a fresh clone". It's the gate between a branch and `main`. Docs: https://docs.github.com/en/actions/get-started/understand-github-actions
- **Workflow anatomy.** A workflow (`.github/workflows/ci.yml`) has:
  - **triggers** (`on:`)
  - **jobs**: each runs on its own fresh VM (`runs-on`), and different jobs run in parallel
  - **steps** inside a job, which run in order and share the machine
  - steps that either `uses:` a reusable **action** or `run:` a shell command

  Docs: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- **Triggers.** `pull_request` runs for every push to an open PR. `push` to `main` runs after merges, so `main` is always re-verified.
- **`concurrency` with `cancel-in-progress`.** Pushing again to the same PR cancels the older, now-pointless run. Saves minutes and avoids confusing results.
- **`permissions: contents: read`.** The workflow's `GITHUB_TOKEN` gets only read access by default (least privilege). Step 11 grants extra permission (PR comments) only to the job that needs it.
- **Pinning actions to a commit SHA.** `uses: actions/checkout@3d3c…ba90b1 # v7.0.1`, not `@v7`. A tag can be moved to different code by whoever controls the action's repo, which is a known supply-chain attack path. A full commit SHA can't change. The comment keeps it readable. Docs: https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions
- **Setting up the toolchain in CI.**
  - `pnpm/action-setup` installs the exact pnpm from our `packageManager` field.
  - `actions/setup-node` installs Node from `.nvmrc` (24) and caches pnpm's store between runs (`cache: pnpm`). That's why `pnpm/action-setup` must come **before** it.
  - `pnpm install --frozen-lockfile` fails if `package.json` and the lockfile disagree, instead of quietly changing dependencies. It also enforces `engineStrict` (see step 2).
- **Which commit CI tests and displays.** For `pull_request` events, `actions/checkout` by default checks out a temporary **merge commit** (your branch merged into `main`), which isn't in your branch's history. Our app would then show a SHA nobody recognises, and the e2e test expecting the PR's head commit would fail. We check out `github.event.pull_request.head.sha` instead, so CI tests exactly the commit you pushed, and the page shows the SHA you see on the PR. Trade-off: we don't test the merged result. Keep the branch up to date with `main` before merging (GitHub's "Update branch" button).
- **Two jobs.** `checks` (fast feedback) and `e2e` (needs a browser) run in parallel on separate machines. A failure in one doesn't hide the other's result.
- **Browsers in CI.** `playwright install --with-deps chromium` also installs the Linux libraries Chromium needs (via `apt`). Ubuntu is officially supported, so there's no "fallback build" warning there.
- **Artifacts.** `actions/upload-artifact` saves the Playwright HTML report (and on failure the traces and videos) for 14 days. Download it from the run page. `if: ${{ !cancelled() }}` uploads it even when tests fail, which is exactly when you need it.
- **`timeout-minutes`.** A hung job is killed after 15 minutes instead of burning up to 6 hours of runner time.
- **Turbo telemetry off in CI.** `TURBO_TELEMETRY_DISABLED: 1` (our rule; see step 4).
- **Cost.** Private repos on the free plan get 2,000 Linux runner minutes a month. This workflow uses about 3–5 minutes per push across both jobs.
- **Branch protection: needs a decision.** "Require status checks to pass before merging" is the normal way to make CI a hard gate. **On a free GitHub account it isn't available for private repositories.** The API answers "Upgrade to GitHub Pro or make this repository public". Options:
  1. **GitHub Pro** (about $4/month): full branch protection and rulesets on private repos.
  2. **Make the repository public**: not recommended (proprietary code; the forks' licences).
  3. **No enforcement for now**: CI still runs and shows red or green on every PR, and we follow the rule "merge only when green, never push to `main` directly". Upgrade later.

  Recommendation: option 3 now, option 1 before anyone else joins the project. Docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

**`.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  TURBO_TELEMETRY_DISABLED: 1

jobs:
  checks:
    name: Lint, typecheck, unit tests, build
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          # Test the commit that was pushed, not GitHub's temporary merge commit.
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

  e2e:
    name: End-to-end (Playwright)
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @flowcanvas/e2e exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          E2E_EXPECTED_COMMIT: ${{ github.event.pull_request.head.sha || github.sha }}
      - uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: |
            e2e/playwright-report/
            e2e/test-results/
          retention-days: 14
```

- `${{ … }}` are GitHub expressions, evaluated before the step runs.
- `github.event.pull_request.head.sha || github.sha` means "the PR's head commit, or, on a push to `main`, the pushed commit".
- `CI=true` is set automatically on GitHub's runners, so Playwright switches to its CI settings (retries, `forbidOnly`, `github` reporter).

**Commands:** push and open the PR.

```fish
pnpm format:check                       # the workflow file is YAML, so Prettier checks it too
git add .github && git commit -m "ci: add GitHub Actions workflow for checks and e2e"
git push -u origin phase/1-project-skeleton
gh pr create --base main --head phase/1-project-skeleton --title "Phase 1 — Project skeleton" --body "…"
gh pr checks --watch                    # follow both jobs live in the terminal
```

**Run and check it:**
1. Open the PR on GitHub (`gh pr view --web`). The bottom of the conversation tab shows two checks. Click **Details** for live logs per step.
2. Both turn green. Locally, `gh run list` shows the run and `gh run view --log-failed` shows only the failing step's log if something breaks.
3. On the run's summary page, download **playwright-report** and open `index.html`.
4. **Prove CI can fail:** push a commit that breaks formatting (for example an extra blank line in `turbo.json`). The checks job fails at `pnpm format:check` with the file named. Fix and push again, and it goes green. *Optional, but the best way to trust the gate.*

**Gotchas:**
- `ERR_PNPM_OUTDATED_LOCKFILE`: you changed a `package.json` without running `pnpm install` locally. Run it and commit `pnpm-lock.yaml`.
- A job passes locally but fails in CI: look for something your machine has that CI doesn't (an untracked file, a global tool, an env var). This is CI doing its job.
- Workflow changes only run when the YAML is on the branch being pushed; editing it on `main` doesn't affect an open PR until you update the branch.
- If a pinned SHA is mistyped, the job fails at "Set up job" with "Unable to resolve action". Copy SHAs exactly.
- Never print secrets in `run:` steps. GitHub masks registered secrets, but derived values (substrings, base64) aren't masked.

**Commit:** `ci: add GitHub Actions workflow for checks and e2e`

**Done notes (step 10):**
- Workflow committed (`a3247c7`), branch pushed, PR #1 opened: https://github.com/ArmaanAhuja-7777/Glassbox/pull/1
- Branch protection: option 3 (not enforced), and the free plan blocked it while the repo was private.
- **Blocked:** GitHub Actions jobs don't start ("account is locked due to a billing issue"), on private *and* public repos. Diagnosis: `gh run view <id>` showed only "workflow file issue"; a one-line probe workflow failed the same way, which ruled out our file; the check-run **annotations** (`gh api repos/<owner>/<repo>/check-runs/<id>/annotations`) gave the real reason. Lesson: when a run fails in 0–4 seconds with no steps, look at annotations, not logs.
- Until resolved, run the CI checks locally:

```fish
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

### Step 11 — Cloudflare: a preview URL for every pull request

**Goal:** the web app is deployed automatically by Cloudflare. Every push to a PR branch gets its **own preview URL**, posted on the PR, and `main` becomes the **staging** site. This satisfies half of phase 1's Done-when. GitHub Actions is blocked on the account (`docs/upgrade-later.md` item 8), so Cloudflare builds the repo itself (**Workers Builds**, Cloudflare's Git integration).

**Expected outcome:**
- On PR #1, a Cloudflare check or comment appears with a preview link on `*.workers.dev`.
- It shows **Flowcanvas** and `0.1.0 · <PR head commit>`, with the security headers.
- After merging to `main`, the production URL `https://flowcanvas.<your-subdomain>.workers.dev` is staging.
- The Playwright smoke test passes against the preview from your laptop.

**Concepts:**
- **Workers serving static assets.**
  - Cloudflare's dashboard now creates projects as **Workers**. A Worker can serve a folder of static files with no code of ours, which is all our web app is (`index.html` + one JS bundle).
  - Static asset requests are free and unlimited on the free plan.
  - Older guides use **Cloudflare Pages** for this. Pages still exists, but new projects are steered to Workers, which also leaves room to add server-side code later (the preview proxy, the gateway).
  - Docs: https://developers.cloudflare.com/workers/static-assets/
- **`wrangler.jsonc`.** Wrangler is Cloudflare's CLI. Its config file says what to deploy:
  - `name` must match the Worker name in the dashboard (`flowcanvas`).
  - `assets.directory` points at the built site (`./apps/web/dist`).
  - `not_found_handling: "single-page-application"` serves `index.html` for unknown paths, so client-side routes work on reload.
  - `compatibility_date` pins the runtime behaviour to a date, so Cloudflare upgrades can't change how our Worker behaves.
  - `preview_urls: true` gives every uploaded version its own URL.
  - `workers_dev: true` serves the production deployment on `*.workers.dev`.
  - `send_metrics: false` turns off Wrangler's usage telemetry (our rule: telemetry off).

  JSONC is JSON that allows comments and trailing commas (Prettier adds them; Wrangler accepts them, verified). Docs: https://developers.cloudflare.com/workers/wrangler/configuration/
- **Pinning Wrangler.** The dashboard suggests `npx wrangler deploy`, which downloads whatever Wrangler version is current on the day of the build. We add `wrangler` as a pinned root dev dependency (catalog) and use `pnpm exec wrangler …`, so builds are reproducible.
- **Workers Builds: build, then deploy.** On every push Cloudflare clones the repo and runs three things:
  - the **build command** (install, then build only the web app)
  - the **deploy command**, for the production branch `main`
  - the **non-production branch deploy command**, for every other branch: it uploads a new *version* without making it live, and gives it a **preview URL**

  Cloudflare reports the result on the commit/PR in GitHub. Docs: https://developers.cloudflare.com/workers/ci-cd/builds/
- **Building a pnpm monorepo there.**
  - `SKIP_DEPENDENCY_INSTALL=true` stops Cloudflare's own install (its pnpm may not read our pnpm 12 lockfile).
  - `corepack enable` provides exactly pnpm 12.15.0 (Node 24 still bundles Corepack).
  - `NODE_VERSION=24` pins Node.
  - `pnpm build --filter=@flowcanvas/web` passes `--filter` through to Turbo, so only the web app and its dependency `graph-model` are built.
- **The commit shown on the page.** Cloudflare clones with git history, so `git rev-parse HEAD` in our root `build` script returns the commit being deployed. If a preview ever shows "unknown commit", prefix the build with `FLOWCANVAS_COMMIT=$WORKERS_CI_COMMIT_SHA`.
- **Security headers (`_headers`).** Static assets on Workers honour a `_headers` file in the assets directory. Ours sets a strict **Content-Security-Policy** (only our own scripts, styles and connections; no framing), `nosniff`, a strict `Referrer-Policy` and a `Permissions-Policy`. Vite copies `apps/web/public/*` into `dist/`, so the file lives there. The production `index.html` has no inline scripts or styles (verified), so the strict CSP doesn't block our own code: the Playwright test passes with the CSP applied (verified under `wrangler dev`). Docs: https://developers.cloudflare.com/workers/static-assets/headers/
- **Previews are public links.** Fine while they only show a version string. Protecting them with Cloudflare Access is `docs/upgrade-later.md` item 11; leave "Protect with Cloudflare Access" **off** for now, because it would also block the Playwright test.

**`pnpm-workspace.yaml`:** add to the catalog:

```yaml
  wrangler: 4.152.0
```

**Root `package.json`:** add to `devDependencies`:

```json
    "wrangler": "catalog:"
```

**Supply-chain policies met along the way (pnpm 12):**
- **Minimum release age.** pnpm refuses packages published very recently (within about a day), because malicious releases are usually caught within that window. `wrangler@4.153.0` was only hours old, so pnpm wrote a `minimumReleaseAgeExclude` exemption into `pnpm-workspace.yaml` on its own. We **removed the exemption and pinned 4.152.0** instead (4 days old). The lockfile written during the exempted install was then rejected (`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`), which is the policy protecting us from a lockfile that bypassed it. Fix: `git checkout -- pnpm-lock.yaml && pnpm install`. Rule: **never commit a `minimumReleaseAgeExclude`**; pick an older version.
- **Install scripts must be decided.** pnpm 12 fails the install (`ERR_PNPM_IGNORED_BUILDS`) when a dependency wants to run a `postinstall` script that hasn't been approved or denied. `esbuild` and `workerd` (pulled in by Wrangler) both work without theirs (verified: build, deploy dry run, `wrangler dev`, e2e), so we deny them:

```fish
pnpm approve-builds '!esbuild' '!workerd'
```

That writes to `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: false
  workerd: false
```

Least privilege: a package only runs code at install time if we said yes.

**`wrangler.jsonc`** (repo root):

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "flowcanvas",
  "compatibility_date": "2026-10-01",
  "assets": {
    "directory": "./apps/web/dist",
    "not_found_handling": "single-page-application",
  },
  "preview_urls": true,
  "workers_dev": true,
  "send_metrics": false,
}
```

**`apps/web/public/_headers`:**

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Cloudflare dashboard (owner does this):** on "Set up your application" (Workers & Pages → Create → import the GitHub repo `ArmaanAhuja-7777/Glassbox`, granting the Cloudflare app access to **only** this repo):

| Field | Value |
| --- | --- |
| Project name | `flowcanvas` (must equal `name` in `wrangler.jsonc`) |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm build --filter=@flowcanvas/web` |
| Deploy command | `pnpm exec wrangler deploy` |
| Enable preview builds | **on** |
| Non-production branch deploy command | `pnpm exec wrangler versions upload` |
| Protect with Cloudflare Access | **off** (for now; `upgrade-later` item 11) |
| Advanced → Path (root directory) | `/` |
| Advanced → API token | "Create new token" (Cloudflare creates a deploy-only token for the build) |
| Advanced → Variables | `NODE_VERSION` = `24`, `SKIP_DEPENDENCY_INSTALL` = `true`, `TURBO_TELEMETRY_DISABLED` = `1`, `COREPACK_ENABLE_DOWNLOAD_PROMPT` = `0`, `WRANGLER_SEND_METRICS` = `false` |

- The dashboard may suggest `npx wrangler preview` as the preview command. That's Cloudflare's newer "Preview deployments" feature, still **open beta** in Wrangler 4.153. We use the stable `versions upload`, which also produces a preview URL per version.
- Push the repo changes **before** the first build runs (or click "Retry build" afterwards), otherwise the build can't find `wrangler.jsonc`.

**Commands (local, verify before pushing):**

```fish
pnpm install
pnpm build --filter=@flowcanvas/web
pnpm exec wrangler deploy --dry-run        # "Read 4 files from the assets directory …/apps/web/dist", no upload
pnpm exec wrangler dev --port 8787         # Cloudflare's runtime locally, WITH _headers applied
curl -sI http://127.0.0.1:8787/ | grep -i content-security-policy
E2E_BASE_URL=http://127.0.0.1:8787 pnpm --filter @flowcanvas/e2e test:e2e   # 1 passed (CSP doesn't break the app)
```

**Run and check it (after Cloudflare builds):**
1. PR #1 shows a Cloudflare check or comment with the preview URL. The Cloudflare dashboard shows the build log and the URLs under the Worker's **Deployments / Versions**.
2. The preview shows **Flowcanvas** and `0.1.0 · <short PR head commit>`.
3. `E2E_BASE_URL=<preview URL> E2E_EXPECTED_COMMIT=(git rev-parse HEAD) pnpm --filter @flowcanvas/e2e test:e2e` passes.
4. `curl -sI <preview URL> | grep -i content-security-policy` shows the header.
5. Push another commit: a new preview URL appears with the new commit.

**Gotchas:**
- **Build fails with `pnpm: command not found` or a lockfile error:** check `SKIP_DEPENDENCY_INSTALL=true` and that the build command starts with `corepack enable`.
- **Deploy fails with "Missing entry-point" or "no assets directory":** `wrangler.jsonc` isn't on the branch yet, or the build didn't produce `apps/web/dist`.
- **Name mismatch between dashboard and `wrangler.jsonc`:** Cloudflare warns or fails. Keep both `flowcanvas`.
- **Blank page on the preview:** check the browser console for CSP "Refused to load …" errors.
- **Never put secrets in this Worker's variables.** The browser bundle is public.

**Commit:** `feat(web): deploy to Cloudflare Workers with security headers`

**Done notes (step 11, Cloudflare setup):**
- The first Cloudflare build runs on the production branch `main` and **fails with `ERR_PNPM_NO_PKG_MANIFEST`**. That's expected until phase 1 is merged: `main` only contains the step 1 docs. The same log confirms the environment works (Node 24.22.1 picked up; `SKIP_DEPENDENCY_INSTALL` respected).
- Cloudflare only builds on pushes it sees **after** the repo is connected. A branch pushed earlier needs a new commit (or a manual build in the dashboard) to get its first preview.
- **Preview URL formats (Workers):**
  - *Version preview*: `https://<first 8 characters of the version ID>-flowcanvas.<account-subdomain>.workers.dev`. The full-UUID form shown in some places returns 404.
  - *Branch alias*: `https://<branch-name-with-slashes-as-dashes>-flowcanvas.<account-subdomain>.workers.dev`, always the branch's latest build. For this PR: `https://phase-1-project-skeleton-flowcanvas.ahujaarmaan7777.workers.dev`.
  - *Production (staging)*: `https://flowcanvas.ahujaarmaan7777.workers.dev`, live after the first successful build of `main` (step 13).
  - A brand-new version URL can return 404 for a short while until it propagates.
- **Where to find them:** Cloudflare dashboard → Workers & Pages → `flowcanvas` → Deployments / Versions, or Settings → Domains & Routes (`*-flowcanvas.<subdomain>.workers.dev`). Workers Builds reports pass/fail on the PR as the check **"Workers Builds: flowcanvas"**, but doesn't post the URL there; see `docs/upgrade-later.md` item 10.
- **Verified on `be3cf59`** (both preview URLs): HTTP 200; CSP, `nosniff`, `Referrer-Policy` and `Permissions-Policy` present; the bundle carries commit `be3cf59`; SPA fallback returns 200; Playwright `1 passed` with `E2E_EXPECTED_COMMIT` = the PR head. The e2e test also correctly **failed** against the wrong-format URL (404 page): the test catches a broken deployment.

### Step 12 — The control plane as a Docker image (built and run locally)

**Goal:** package the control plane the way it will run in the cloud, as a small, non-root Docker image that holds only the compiled JavaScript and production dependencies, and prove it works by running it locally. Deploying it to Fly.io needs a payment method, so it's deferred to phase 1c (`docs/upgrade-later.md` item 12). With a working image, that later deploy is essentially `fly deploy`.

**Expected outcome:** `docker build …` produces `flowcanvas-control-plane`. `docker run -p 127.0.0.1:8095:8080 …` serves `{"status":"ok","version":"0.1.0","commit":"<the commit you built>"}` at `http://127.0.0.1:8095/health`. The process runs as user `node`. `docker stop` shuts it down cleanly (log line "shutting down", exit code 0).

**Concepts:**
- **Why a container.** The image bundles the exact Node version, our compiled code and its production dependencies, and runs identically on a laptop, in CI, on Fly.io or anywhere else. Phase 1d's workspace VMs use the same idea. Docs: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/
- **Multi-stage build.**
  - Stage `build` has everything needed to *build*: pnpm, dev dependencies, TypeScript, Turbo.
  - Stage `runtime` starts again from a clean `node:24-slim` and copies in only the result.
  - Build tools never reach the final image: a smaller image and less attack surface. Verified: no Vitest, TypeScript, tsx or ESLint inside, and `node_modules` is 14 MB.
  - Docs: https://docs.docker.com/build/building/multi-stage/
- **The build context is the repo root.** The control plane depends on the workspace package `@flowcanvas/graph-model`, so Docker needs to see the whole workspace: `docker build -f services/control-plane/Dockerfile .` (note the final `.`).
- **`.dockerignore`.** Like `.gitignore` for the build context: local `node_modules`, `dist`, caches, `.git`, `docs` and **every `.env` file** are never sent into the build. That keeps builds reproducible and secrets out of images. Docs: https://docs.docker.com/build/concepts/context/#dockerignore-files
- **Installing only what's needed.** `pnpm install --filter @flowcanvas/control-plane...` installs the control plane and everything it depends on (the trailing `...`), not the web app or Playwright.
- **`pnpm deploy`.** Copies one workspace package into a standalone folder with its **production** dependencies (`--prod`), resolving `workspace:*` links into real copies (here: the compiled `graph-model`). What it copies from our own package is controlled by `"files"` in `package.json`, so we add `"files": ["dist"]` to the control plane; without it, `src/`, tsconfigs and the Dockerfile ended up in the image. Docs: https://pnpm.io/cli/deploy
- **The commit, baked in at build time.** `--build-arg FLOWCANVAS_COMMIT=…` becomes an `ENV` in the runtime image. The server reports it from `/health`, and git isn't needed inside the image.
- **Container defaults.**
  - `HOST=0.0.0.0` (a container must accept connections from outside itself; on your laptop the default stays `127.0.0.1`; see step 7). `-p 127.0.0.1:8095:8080` still publishes it on loopback only.
  - `NODE_ENV=production`.
  - `USER node`: the official Node image ships an unprivileged user, and running as root inside a container is an unnecessary risk.
- **PID 1 and signals.** `CMD ["node", "dist/server.js"]` (exec form, no shell) makes Node process ID 1, so `docker stop`'s SIGTERM reaches our handler directly. Our handler closes Fastify and exits 0. With a shell form (`CMD node dist/server.js`), the signal would hit the shell instead and Docker would kill the process after 10 seconds.
- **Layer caching.** Each Dockerfile instruction is a cached layer. On this connection the first build took **about 41 minutes**, almost all of it `pnpm install` inside the container with an empty package store. Rebuilds with unchanged dependencies are faster, but because we `COPY . .` before installing, *any* file change re-runs the install today. Fixing that (copy only lockfile and manifests first, `pnpm fetch`, BuildKit cache mounts) is `docs/upgrade-later.md` item 13.
- **No `buildx` on this machine.** Docker 29 here has no `buildx` plugin, so `docker build` uses the legacy builder. It works (verified), but it's deprecated and can't use BuildKit features like cache mounts. Installing it is free (CachyOS/Arch: `sudo pacman -S docker-buildx`) and part of item 13.

**`services/control-plane/Dockerfile`:**

```dockerfile
# Build context: the repository root (the control plane depends on workspace packages).
#   docker build -f services/control-plane/Dockerfile --build-arg FLOWCANVAS_COMMIT=$(git rev-parse HEAD) -t flowcanvas-control-plane .

FROM node:24-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @flowcanvas/control-plane...
RUN pnpm exec turbo run build --filter=@flowcanvas/control-plane
RUN pnpm --filter @flowcanvas/control-plane deploy --prod /out

FROM node:24-slim AS runtime
ARG FLOWCANVAS_COMMIT=""
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    FLOWCANVAS_COMMIT=${FLOWCANVAS_COMMIT}
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

**`.dockerignore`** (repo root):

```
**/node_modules
**/dist
**/.turbo
**/coverage
**/playwright-report
**/test-results
.git
.env
.env.*
docs
```

**`services/control-plane/package.json`:** add after `"type": "module",`:

```json
  "files": [
    "dist"
  ],
```

**Commands:**

```fish
pnpm install                      # the "files" change doesn't alter dependencies, but keeps the lockfile check happy
docker build -f services/control-plane/Dockerfile --build-arg FLOWCANVAS_COMMIT=(git rev-parse HEAD) -t flowcanvas-control-plane .
docker images flowcanvas-control-plane          # ~344 MB (mostly the node:24-slim base)
docker run -d --name flowcanvas-cp -p 127.0.0.1:8095:8080 flowcanvas-control-plane
curl http://127.0.0.1:8095/health               # {"status":"ok","version":"0.1.0","commit":"<full commit>"}
docker logs flowcanvas-cp                       # JSON log lines (pino), incl. the request
docker stop flowcanvas-cp                       # log "shutting down"; exit code 0
docker rm flowcanvas-cp
```

(fish: `(git rev-parse HEAD)`; bash: `$(git rev-parse HEAD)`.) The first build can take a long time on a slow connection. Watch `docker stats` (the NET I/O column) to see that it's still downloading.

**Run and check it:**
1. `curl http://127.0.0.1:8095/health` returns version `0.1.0` and the commit you passed as `FLOWCANVAS_COMMIT`.
2. `docker exec flowcanvas-cp id -un` prints `node` (not root).
3. `docker exec flowcanvas-cp ls /app` shows only `dist`, `node_modules`, `package.json` (plus pnpm's lockfile and workspace file), with no `src/`.
4. `docker exec flowcanvas-cp ls /app/node_modules` shows only `@flowcanvas` and `fastify` at the top level. No dev tools.
5. `docker stop flowcanvas-cp`, then `docker inspect flowcanvas-cp --format '{{.State.ExitCode}}'` prints `0`.

**Gotchas:**
- **`COPY failed` or "no such file" for `packages/...`:** you ran `docker build` from inside `services/control-plane`. Run it from the repo root with `-f`.
- **`ERR_PNPM_OUTDATED_LOCKFILE` in the build:** the lockfile doesn't match `package.json`. Run `pnpm install` locally and commit the lockfile.
- **`curl` can't connect:** check the `-p` mapping (`host:container` = `127.0.0.1:8095:8080`) and `docker logs flowcanvas-cp`.
- **"commit": ""**: the `--build-arg` was missing or empty.
- **Never `COPY` a `.env` file or pass secrets as build args.** They're stored in image layers and visible with `docker history`. Runtime secrets come from the secrets vault (phase 1c) as environment variables at *run* time.

**Commit:** `build(control-plane): add Docker image for deployment`

### Step 13 — Close phase 1: records, review, merge, staging live

**Goal:** finish phase 1 the way every phase will finish:
- write down the decisions (ADRs), the architecture and the status
- check every Done-when item against evidence
- review the upgrade-later list
- merge PR #1 so `main` deploys to the **staging URL**
- verify staging with the same browser test

**Expected outcome:**
- `https://flowcanvas.ahujaarmaan7777.workers.dev` shows **Flowcanvas** and `0.1.0 · <main's commit>`.
- The Playwright test passes against it.
- `docs/STATUS.md` shows phase 1 *in review*, with the open condition that CI must run on GitHub (`docs/upgrade-later.md` item 8) before it can be *accepted*.
- `CHANGELOG.md` has its first release entry, `0.1.0`.

**Concepts:**
- **Architecture Decision Records (ADRs).**
  - A short file per significant choice: *context* (what forced a decision), *options*, *decision*, *consequences*.
  - They're numbered and never edited after acceptance. A later change gets a new ADR that "supersedes" the old one.
  - Six months from now, "why TypeScript 6 and not 7?" has a one-page answer.
  - CLAUDE.md §9 requires one per significant choice.
  - Docs: https://adr.github.io/ and Michael Nygard's original post, https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- **`ARCHITECTURE.md`.** A map of the system as it is *today*: the parts, where each runs, how they talk, and how code gets from a commit to a URL. Unlike ADRs it is kept current (CLAUDE.md §7).
- **`CHANGELOG.md`.** A human-readable list of notable changes per version, in the "Keep a Changelog" format (`Added`, `Changed`, `Fixed`, `Security`…). Versions follow semantic versioning: `0.1.0` is the first pre-1.0 release. Docs: https://keepachangelog.com/en/1.1.0/ and https://semver.org/
- **`docs/STATUS.md`.** One table, one row per phase (planned, in progress, in review, accepted), in the format of CLAUDE.md §13.3.
- **Phase report.** CLAUDE.md §13.2 template: result per Done-when item with evidence, how to try it, test summary, deviations from the plan and why, ADRs added, known issues, next phase preview. Stored at `docs/reports/phase-1.md` (a project record, not a lesson).
- **Merging the PR.**
  - Use a merge commit (`gh pr merge 1 --merge`), which keeps every step's commit in history, so the build-steps table's commit links stay valid.
  - Squash would collapse 40+ commits into one and break those links.
  - Merging is normally gated on green CI. CI can't run while the account is billing-locked, so the gate for this merge is: all checks green **locally** + the Cloudflare preview build green + the Playwright test green against the preview. Record that exception in the report.
- **Staging = the production branch.** Cloudflare Workers Builds deploys `main` with `wrangler deploy` to `flowcanvas.<subdomain>.workers.dev`. Every later merge updates staging automatically.

**What gets written:**
1. `docs/adr/0001-monorepo-pnpm-turborepo.md`
2. `docs/adr/0002-vite-react-spa.md`
3. `docs/adr/0003-typescript-6-strict.md`
4. `docs/adr/0004-node-24-lts.md`
5. `docs/adr/0005-hosting-cloudflare-workers-free-first.md` (Cloudflare static assets + Workers Builds; Fly.io and Actions-based deploys deferred)
6. `docs/adr/0006-supply-chain-defaults.md` (pinned action SHAs, pnpm minimum release age, denied install scripts, telemetry off, loopback default)
7. `ARCHITECTURE.md` (root): packages, runtime locations, request and deploy flow, how the version and commit travel from git to the page and to `/health`
8. `CHANGELOG.md` (root): `0.1.0`
9. `docs/STATUS.md`: phases 1 … 1d with status
10. `docs/reports/phase-1.md`: the phase report
11. `docs/upgrade-later.md`: end-of-phase review (what's due now, what moved)

**Commands (merge and verify staging):**

```fish
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e   # all green locally
gh pr merge 1 --merge                       # merge commit; keeps step history
git switch main && git pull
# wait for Cloudflare's build of main (dashboard → flowcanvas → Builds), then:
curl -sI https://flowcanvas.ahujaarmaan7777.workers.dev | grep -i content-security-policy
E2E_BASE_URL=https://flowcanvas.ahujaarmaan7777.workers.dev E2E_EXPECTED_COMMIT=(git rev-parse HEAD) pnpm --filter @flowcanvas/e2e test:e2e
```

**Run and check it (the phase 1 Done-when, with evidence):**

| Done-when / Try-it | Evidence |
| --- | --- |
| The staging URL loads the app | Open `https://flowcanvas.ahujaarmaan7777.workers.dev`: **Flowcanvas** + `0.1.0 · <main commit>`; the Playwright test passes against it |
| Every pull request gets its own preview URL | PR #1: Cloudflare check "Workers Builds: flowcanvas" plus the branch alias `https://phase-1-project-skeleton-flowcanvas.ahujaarmaan7777.workers.dev`; verified with Playwright. (The URL isn't posted on the PR yet: upgrade-later item 10) |
| Try it: open the staging link; the app loads and shows its version | Same as the first row |
| Build: CI with lint, type checks and tests | Workflow `.github/workflows/ci.yml` committed; **can't run until the GitHub account billing lock is resolved** (upgrade-later item 8). The same checks pass locally |

**Gotchas:**
- **`main` shows the merge commit's SHA, not the last PR commit's.** That's correct: staging runs exactly what's on `main`.
- **A brand-new staging deploy can 404 for a minute.** Retry before debugging.
- **Don't delete the phase branch before Cloudflare finishes building `main`.** The branch alias preview stops updating after deletion, which is expected.

**Commit:** `docs: close phase 1 with ADRs, architecture, status, changelog and report`
