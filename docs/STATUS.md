# Status

One row per phase of the build plan (`docs/reference/build-plan.md`). Status: planned / in progress / in review / accepted.

| Phase | Name | Status | Build | Notes |
| --- | --- | --- | --- | --- |
| 1 | Project skeleton | in review | `0.1.0` · staging `https://flowcanvas.ahujaarmaan7777.workers.dev` | All Done-when items met and verified (staging at `9a18708`: Playwright passed). Not yet accepted: CI must run green on GitHub (account billing lock; `docs/upgrade-later.md` item 8). PR #1 merged under a recorded exception (local checks + Cloudflare preview + Playwright green). Report: `docs/reports/phase-1.md` |
| 1a | Design system in code | in review | `0.2.0` · catalogue preview `https://phase-1a-design-system-flowcanvas-catalogue.ahujaarmaan7777.workers.dev` | All Done-when items met: Figma comparison test passes for every Figma component variant (`pnpm test:visual`, 68 passed). Light theme approved. Acceptance pending the owner's review; CI still can't run (upgrade-later 8). Report: `docs/reports/phase-1a.md` |
| 1b | See-and-test harness | planned | | |
| 1c | Sign-in and control plane | planned | | Control-plane deploy (`docs/upgrade-later.md` item 12) is due here |
| 1d | Workspace sandbox | planned | | |
| 2 | Canvas and app shell | planned | | List differences between the prototype screenshots and Figma (decision A5) |
