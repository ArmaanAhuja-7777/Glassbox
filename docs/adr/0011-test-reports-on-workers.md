# 0011 — Test reports and recordings on their own Worker

- Status: accepted
- Date: 29 Oct 2026
- Phase: 1b (step 3)

## Context

Phase 1b's Done-when needs every merged phase to produce a test report and a recording that anyone can open from a link, without manual steps. GitHub's own artifacts need a GitHub login and expire after 90 days, and Actions is blocked for now (upgrade-later 8). The owner chose a free Cloudflare Worker (decisions log, 29 Oct 2026).

Playwright's HTML report embeds videos, and its trace viewer needs inline scripts, `blob:` media and a service worker. Our app's CSP would block all of these.

## Options considered

1. **Worker versions with preview aliases** (chosen). Every upload is a new version with its own unchanging URL. A readable alias (`pr-12`, `main`) points to the latest version uploaded under it, and the Worker's main address can be moved to any version. Same tooling as the app and the catalogue.
2. **Cloudflare Pages direct upload.** Also gives per-deployment URLs, but adds a second deployment product next to Workers (ADR 0005).
3. **R2 object storage behind a Worker.** Gives full control over retention, but R2 needs a payment method on the account (not free-first).
4. **CI artifacts only.** Needs a login, expires in 90 days, and isn't available while Actions is blocked.

## Decision

Option 1.
- **Worker:** `flowcanvas-reports` (`e2e/reports.wrangler.jsonc`).
- **Publishing:** `e2e/scripts/publish-report.ts` assembles a small site (an index with the commit, branch, time and pass counts; `walkthroughs/`; `visual/`), then runs `wrangler versions upload --preview-alias <alias>`.
- **`--production`** also deploys that version to the main address, for `main`.
- **First publish:** creates the Worker with one `wrangler deploy`.
- **Headers** (`e2e/reports/_headers`): a CSP loose enough for the report and trace viewer, on this origin only; `nosniff`; strict referrer and permissions policies; `X-Robots-Tag: noindex, nofollow`.

## Consequences

- **Links:**
  - per PR: `https://pr-<n>-flowcanvas-reports.<subdomain>.workers.dev`
  - per run: `https://<version>-flowcanvas-reports.<subdomain>.workers.dev`
  - latest from `main`: `https://flowcanvas-reports.<subdomain>.workers.dev`
- **Retention:**
  - Cloudflare keeps the 1,000 most recently deployed aliases.
  - It doesn't document how long old *version* URLs keep working, so per-run links may eventually expire. The alias links are the ones to share.
- **Public by link.** Fine while reports show our public app and the public test forks. Before they show real user or project data, the reports site goes behind Cloudflare Access (upgrade-later 11). The earlier "before phase 1d" deadline was dropped when the corpus became public forks (decisions log, 29 Oct 2026).
- **Credentials:**
  - CI uses a Workers-only API token stored as GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
  - Locally, `wrangler login`.
- **Known console message:** the trace viewer creates an empty placeholder frame that `frame-src 'self'` blocks, and logs "Framing '' violates…". Nothing visible is affected (steps, snapshots, network and video all work), so the policy isn't loosened for it.
