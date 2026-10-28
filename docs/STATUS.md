# Status

One row per phase of the build plan (`docs/reference/build-plan.md`). Status: planned / in progress / in review / accepted.

| Phase | Name | Status | Build | Notes |
| --- | --- | --- | --- | --- |
| 1 | Project skeleton | in review | `0.1.0` · staging `https://flowcanvas.ahujaarmaan7777.workers.dev` | All Done-when items met and verified (staging at `9a18708`: Playwright passed). Not yet accepted: CI must run green on GitHub (account billing lock; `docs/upgrade-later.md` item 8). PR #1 merged under a recorded exception (local checks + Cloudflare preview + Playwright green). Report: `docs/reports/phase-1.md` |
| 1a | Design system in code | accepted | `0.2.0` · staging `https://flowcanvas.ahujaarmaan7777.workers.dev` · catalogue `https://flowcanvas-catalogue.ahujaarmaan7777.workers.dev` | Accepted by the owner on 29 Oct 2026. Merged as `ec07da3` (PR #3) under the PR #1 exception (GitHub Actions blocked, upgrade-later 8). Signal palette adopted; Figma file update pending (upgrade-later 19). Report: `docs/reports/phase-1a.md` |
| 1b | See-and-test harness | in progress | | Scope amended 29 Oct 2026 (decisions log): no automated Figma comparison; six-repo corpus; demo-project button moves to 1d; reports on Cloudflare. Done-when can only be proven once GitHub Actions run (upgrade-later 8) |
| 1c | Sign-in and control plane | planned | | Control-plane deploy (`docs/upgrade-later.md` item 12) is due here |
| 1d | Workspace sandbox | planned | | Also: the "Open demo project" button (moved from 1b) |
| 2 | Canvas and app shell | planned | | List differences between the prototype screenshots and Figma (decision A5) |
