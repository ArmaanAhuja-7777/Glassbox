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
- Open the **control plane's `/health`** URL and see the same version and commit as JSON.
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
| Web app runs locally | step 6 | *pending* |
| Control plane runs locally | step 7 | *pending* |
| End-to-end test | step 9 | *pending* |
| PR preview URL | step 11 | *pending* |
| Staging and `/health` | step 12 | *pending* |

### Steps

| # | Step | Status |
| --- | --- | --- |
| 1 | Tooling and repository | done · `7e59ec1` · Claude |
| 2 | Workspace root | done · `6b074cb` · Claude |
| 3 | Shared TypeScript config and `packages/graph-model` with its first test | done · `f7b99cd` · Claude |
| 4 | Turborepo tasks and caching | done · `5a010d9` · Claude |
| 5 | ESLint and Prettier | done · `d88f916` · Claude |
| 6 | `apps/web`: Vite + React, version and commit injected at build time, test | **next** |
| 7 | `services/control-plane`: Fastify `/health`, tests, log redaction | *planned* |
| 8 | Minimal `workspace/agent` and `packages/engine` | *planned* |
| 9 | Playwright smoke test | *planned* |
| 10 | GitHub Actions CI, open the PR, branch protection | *planned* |
| 11 | Cloudflare Pages: account, previews per PR, URL comment, smoke test on preview | *planned* |
| 12 | Fly.io: Dockerfile, `fly.toml`, deploy on merge, staging deploy | *planned* |
| 13 | ADRs, `STATUS.md`, `CHANGELOG.md`, phase report, merge | *planned* |

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
