# 0003 — TypeScript 6.0, strict, Node-style module resolution

- Status: accepted
- Date: 26 Oct 2026
- Phase: 1 (step 3)

## Context

The engineering standards require strict TypeScript everywhere. On 26 Oct 2026 the latest TypeScript was 7.0 (the native Go compiler), but its JavaScript API was published only as `typescript/unstable/*`, and typescript-eslint supported `typescript <6.1`. Phase 5 depends on the TypeScript compiler API, and type-aware linting depends on typescript-eslint.

## Options considered

1. **TypeScript 7.0.** Much faster type-checking, but no stable programmatic API and no typescript-eslint support.
2. **TypeScript 6.0.x.** The last JavaScript-implemented line, with the full stable compiler API and tooling support.

## Decision

TypeScript **6.0.3**, pinned in the catalog. One `tsconfig.base.json` that every package extends, with `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` and `isolatedModules`; `types: []` so packages opt in to global types. Node packages use `module`/`moduleResolution: nodenext` (relative imports carry `.js`); the web app overrides to `bundler`. Each package has `tsconfig.json` (type-check, including tests) and `tsconfig.build.json` (emit, excluding tests).

## Consequences

- Strictness catches unchecked index access, optional-property misuse and missing `type` imports at compile time.
- `.js` extensions in relative imports of Node packages.
- Moving to TypeScript 7 is tracked in `docs/upgrade-later.md` item 3 (trigger: stable API and typescript-eslint support).
