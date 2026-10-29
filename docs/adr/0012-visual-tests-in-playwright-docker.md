# 0012 — Visual tests run in Playwright's official Docker image

- Status: accepted
- Date: 29 Oct 2026
- Phase: 1b (step 4a)

## Context

The visual tests compare screenshots with approved baselines pixel for pixel (`threshold: 0`, phase 1a). Baselines taken on the owner's CachyOS machine won't match screenshots taken on CI's Ubuntu machines: different fonts and font smoothing (upgrade-later 16). Measured: the same stories rendered in Playwright's Ubuntu image differ by 1–2% of pixels, all in text smoothing.

## Options considered

1. **Run the visual tests in Playwright's official image everywhere** (`mcr.microsoft.com/playwright:v<version>-noble`), on developer machines and in CI. One environment, one set of baselines.
2. **Separate baselines per OS.** Developers' baselines would never be checked by CI, and the two sets drift apart.
3. **Loosen the comparison** to absorb font differences. Gives up the colour-exact check that caught the palette change.

## Decision

Option 1.
- `e2e/scripts/visual.sh` runs `playwright test --config playwright.visual.config.ts` inside the image. The image tag is read from the `@playwright/test` version in `pnpm-workspace.yaml`, so the two can't drift.
- Locally it starts the container:
  - it runs as the current user, so files aren't owned by root
  - it mounts the repo at the same path and reuses the installed `node_modules` (same Linux platform)
- CI's `visual` job runs inside the same image as a container job, and the script then runs the tests directly.
- The Storybook server in the visual config starts with Vite's own binary, because the image has Node but no pnpm.

## Consequences

- **Identical everywhere:** baselines retaken in the image (52 of 58 changed, only text smoothing); stable across repeated runs.
- **Docker is required** for `pnpm test:visual`. The image is about 3.6 GB on disk, downloaded once.
- **A Playwright upgrade means a new image,** and possibly new baselines. Review them as a deliberate change.
- **The walkthroughs don't need this.** They don't compare pixels, and run against deployed previews.
- **Grey text smoothing only** (`--disable-lcd-text`, added while closing phase 1b). Chrome switches subpixel (LCD) text smoothing on or off per compositor layer, which made a few text pixels differ between otherwise identical runs: 4 pixels on the Popover story. With grey smoothing, 58 baselines were retaken, unchanged to the eye, and three consecutive runs passed.

