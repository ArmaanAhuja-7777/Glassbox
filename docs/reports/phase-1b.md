# Phase 1b — See-and-test harness: report

- Version: `0.3.0`
- Branch: `phase/1b-see-and-test`; PR https://github.com/ArmaanAhuja-7777/Glassbox/pull/5, merged as `8a6afbc`
- Dates: 29 Oct 2026
- Status: **in review** (owner decision, 29 Oct 2026). It is accepted once GitHub Actions runs and the upgrade-later item 8 steps pass, because the Done-when is about CI working on GitHub.

## From the build plan

- **Build:** staging and per-PR preview URLs; "Open demo project" that starts the current stage's forks in workspaces; end-to-end tests that drive the browser app and record video; screenshot comparison against Figma exports; What's new; Labs switches.
- **Done when:** every merged phase produces a link, a test report and a recording without manual steps.
- **Try it:** open the preview link, click Open demo project, watch the recording in the CI report.

**Amended by the owner on 29 Oct 2026** (decisions log):
- No automated Figma comparison; visual tests compare our own approved baselines.
- A six-repo, varied corpus of public forks.
- The "Open demo project" button moves to phase 1d.
- Reports are published on a Cloudflare Worker.
- CI stays on GitHub Actions; the lock is lifted later.

## Result

| Item | Result | Evidence |
| --- | --- | --- |
| Staging and per-PR preview URLs | ✅ (phase 1) | Cloudflare Workers Builds; CI now waits for the preview to serve the exact commit before testing it |
| End-to-end tests that drive the app and record video | ✅ | `e2e/try-it/`: 4 walkthroughs (phases 1, 1a, 1b ×2), each with a video and a trace; they pass locally, under `wrangler dev` with the production CSP, and against the branch preview |
| Screenshot comparison | ✅ (amended) | `pnpm test:visual`: 64 stories × themes, pixel-exact against approved baselines, axe on each, inside Playwright's Docker image (ADR 0012) |
| What's new | ✅ | Built from `CHANGELOG.md` at build time; a guard test keeps the newest entry equal to the version |
| Labs switches | ✅ | Typed registry (empty, rules tested), `LabsFeature`, Labs panel with an honest empty state |
| "Open demo project" | ➡ phase 1d (owner decision) | Needs cloud workspaces. 1b delivers the pinned corpus it will open (`corpus/manifest.json`, `pnpm corpus:check`: 6 of 6) |
| **Done when:** every merged phase produces a link, a report and a recording without manual steps | ⚠ **built, not provable yet** | The workflow (`.github/workflows/ci.yml`) does exactly this, verified job by job with `act`: checks ✅, visual ✅ (58 at that commit), walkthroughs against the preview ✅. Publishing works (`pr-test` report). Unverifiable locally: the artifact hand-off (an `act` limitation) and the real PR comment. **Proven only when Actions runs** (upgrade-later 8) |
| **Try it:** open the preview, watch the recording in the CI report | ⚠ partly | Preview ✅. The report with recordings is live from a manual publish (link below). The CI-made report waits for Actions |

## After the merge (29 Oct 2026)

| Check | Result |
| --- | --- |
| Staging `https://flowcanvas.ahujaarmaan7777.workers.dev` | `wait-for-deploy` saw `8a6afbc`; the 4 walkthroughs passed against it (`E2E_EXPECTED_COMMIT=8a6afbc`) |
| Catalogue `https://flowcanvas-catalogue.ahujaarmaan7777.workers.dev` | Rebuilt from `main` about a minute after the merge; includes the Popover stories |
| Reports `https://flowcanvas-reports.ahujaarmaan7777.workers.dev` | Main address moved to the `main` report (published manually with `--production`): commit `8a6afbc`, 4 walkthroughs and 64 visual passed |

## How to try it

1. Open the branch preview, `https://phase-1b-see-and-test-flowcanvas.ahujaarmaan7777.workers.dev`:
   - **What's new:** the dot, the 0.3.0 notes with Try it first, and the dot gone after closing and reloading.
   - **Labs:** "No previews right now".
2. Open the published report (the link is on the PR). Under **Walkthroughs**, play a video and open a trace.
3. Locally:
   ```fish
   pnpm test:e2e && pnpm --filter @flowcanvas/e2e report        # watch the 4 walkthroughs
   pnpm test:visual                                            # 64 passed, in Docker
   GITHUB_TOKEN=(gh auth token) pnpm corpus:check              # 6 of 6 repos pass
   ```
4. The full step-by-step "Run and check it" sections are in `docs/build-steps.md` (phase 1b).

## Evidence (29 Oct 2026; final run on a fresh clone, see below)

| Kind | Command | Result |
| --- | --- | --- |
| Format, lint (ESLint + Stylelint), types | `pnpm format:check && pnpm lint && pnpm typecheck` | pass |
| Unit and component | `pnpm test` | 178 passed: ui 66, tokens 49, web 25, figma-tokens 20, corpus 10, graph-model 3, control-plane 3, engine 1, workspace-agent 1 |
| Build | `pnpm build` | web bundle 126 kB gzip |
| Walkthroughs (recorded) | `pnpm test:e2e` | 4 passed, each with video and trace |
| Visual and accessibility | `pnpm test:visual` | 64 passed in `mcr.microsoft.com/playwright:v1.64.1-noble` |
| Corpus | `pnpm corpus:check` | 6 of 6 repos pass |
| Workflow | `actionlint`; `act` per job | no problems; jobs pass (see Result) |

## Deviations from the plan and why

1. **No automated Figma comparison** (owner): Figma is a reference reviewed by eye. The phase 1a comparison test was removed (step 1).
2. **"Open demo project" moves to 1d** (owner): it needs workspaces.
3. **Corpus of six public forks, not two** (owner). LibreChat replaces Inbox Zero, because Inbox Zero's licence restricts commercial use.
4. **CI not yet running on GitHub** (billing lock): verified with `act` and `actionlint`. Acceptance waits for item 8.
5. **Labs lives on the version page** until the phase 2 app shell has a Settings page.

## Decision records added

- 0011 Test reports and recordings on their own Worker
- 0012 Visual tests run in Playwright's official Docker image

## Known issues and follow-ups

- **CI on GitHub** (upgrade-later 8): run the workflow on a real PR and a merge, record both, then accept the phase.
- **Labs choices are per browser** (item 20); per account once sign-in exists (phase 1c).
- **Reports and previews are public by link** (item 11). Protect them before they show real user or project data.
- **Theme flash on load** (item 17) and **no bundle-size budget** yet (item 18; the web bundle grew from 121 to 126 kB gzip).
- **`act` can't run `upload-artifact` v7** (local-only; on GitHub it uses the real service).

## Upgrade-later review (end of phase 1b)

| Item | Status |
| --- | --- |
| 8 GitHub billing lock | Open; now also blocks phase 1b's acceptance. Its "then" list covers 1b |
| 11 Protect previews and reports | Open; deadline relaxed (public forks) |
| 14, 16, 19 | Closed in this phase (Figma no longer a source or test; visual baselines in Docker) |
| 17, 18 | Open, unchanged |
| 20 Labs per account | New; phase 1c |
| Others | Unchanged; triggers not reached |

## Next phase preview

**Phase 1c — Sign-in and control plane:**
- GitHub and Google sign-in, a projects list, workspace records
- a secrets vault (values never appear in logs), a usage-metering skeleton, an admin view
- Try it: sign in with GitHub, create a project, add a secret, confirm the logs show no value

The control-plane deploy (item 12, Fly.io needs a payment method) and Labs-per-account (item 20) are due there.
