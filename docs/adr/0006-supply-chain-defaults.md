# 0006 — Supply-chain and safety defaults

- Status: accepted
- Date: 27 Oct 2026
- Phase: 1 (steps 2, 4, 7, 10, 11, 12)

## Context

Flowcanvas will run untrusted code and agents for its users. Its own build pipeline must not be the weak point. The non-negotiable rules require secrets never to be logged or committed, telemetry off by default, and safe defaults throughout. Several tools in phase 1 have defaults that work against this, or new protections we should keep switched on.

## Decision

Keep these defaults across the repository:

1. **Pin everything.**
   - `packageManager` pins pnpm.
   - Catalogs pin dependency versions; the lockfile is committed and CI uses `--frozen-lockfile`.
   - GitHub Actions are pinned to full commit SHAs (with the tag in a comment).
   - Wrangler is a pinned dev dependency, never `npx wrangler` at latest.
2. **Respect pnpm's minimum release age.** Never commit a `minimumReleaseAgeExclude`. If a package is too new, use the previous release (Wrangler 4.152.0 instead of a 4.153.0 published hours earlier). A lockfile that bypassed the policy is rejected (`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`).
3. **Decide every install script.** pnpm 12 fails on undecided `postinstall` scripts. Approve only what's needed; `esbuild` and `workerd` are denied (`allowBuilds: false`) because everything works without them.
4. **Telemetry off.** Turborepo (`turbo telemetry disable`, `TURBO_TELEMETRY_DISABLED=1`), Wrangler (`send_metrics: false`, `WRANGLER_SEND_METRICS=false`).
5. **Secrets stay out.**
   - `.gitignore` and `.dockerignore` exclude `.env*`.
   - The control plane redacts secret-shaped log fields, proven by a canary test that fails if redaction is removed.
   - Nothing account-related goes into the (currently public) repository.
6. **Least privilege.**
   - The workflow token is read-only by default.
   - The Cloudflare GitHub app is limited to this repository.
   - The control plane binds to `127.0.0.1` by default (`0.0.0.0` only inside its container).
   - The container runs as the unprivileged `node` user.
7. **Strict browser policy.** A strict Content-Security-Policy with no inline scripts or styles, plus `nosniff`, `Referrer-Policy` and `Permissions-Policy`.

## Consequences

- Upgrades are deliberate: a version bump is a reviewed change, and brand-new releases wait about a day.
- A new dependency with an install script fails the install until someone approves or denies it, which is intended.
- Inline styles or scripts (if phase 1a needs them) require a new decision record before relaxing the CSP.
