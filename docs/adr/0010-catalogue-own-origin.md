# 0010 — The component catalogue gets its own Worker and origin

- Status: accepted
- Date: 28 Oct 2026
- Phase: 1a (step 11)

## Context

Phase 1a's *Try it* opens the component catalogue (Storybook) from a link and flips dark and light. CI can't publish reports yet (GitHub billing lock, upgrade-later item 8), so the catalogue needs a free hosted URL.

Storybook's built pages contain **inline scripts and inline styles** (checked in `storybook-static/index.html` and `iframe.html`), so they cannot run under the app's CSP (`script-src 'self'; style-src 'self'`).

## Options considered

1. **Serve it from the app's Worker under `/catalogue/`**, with a looser CSP for that path (`_headers` can detach and replace a header per path). A single deploy, but the catalogue would share the app's origin. Any script injection in Storybook could then reach the app's storage, and later its sessions.
2. **A second Worker on its own origin** (`flowcanvas-catalogue.<account>.workers.dev`), deployed by its own Workers Builds project.
3. **Chromatic or another Storybook host.** Free tiers exist, but it adds another account and sends our build to a third party.

## Decision

Option 2.
- `packages/ui/wrangler.jsonc` defines the `flowcanvas-catalogue` Worker serving `storybook-static/`.
- `packages/ui/.storybook/public/_headers` gives it its own headers:
  - CSP: `'self'` plus `'unsafe-inline'` for scripts and styles, `frame-ancestors 'self'` (Storybook frames its own preview)
  - `nosniff`, a strict referrer policy and a permissions policy
- `.assetsignore` keeps Storybook's `project.json` build metadata off the site.
- The app links to the catalogue's production URL.

## Consequences

- **Isolation:** the app keeps its strict CSP; the catalogue's weaker CSP is isolated on an origin with no cookies or data.
- **Owner setup:** a second Workers Builds project, the same way as the app's (step 1a.11 in `docs/build-steps.md`).
- **Branch previews:** catalogue previews get their own URLs per branch. The app's link always points to the production catalogue (built from `main`).
- **Access control:** when the catalogue needs protecting, use Cloudflare Access (upgrade-later item 11).
