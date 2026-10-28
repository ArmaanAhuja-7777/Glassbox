#!/bin/sh
# Runs the visual tests inside Playwright's official Docker image, on every machine and in CI, so screenshots
# are rendered by the same Linux, browser and fonts everywhere and the approved baselines match pixel for pixel.
# Arguments are passed to `playwright test` (e.g. --update-snapshots).
set -eu
cd "$(dirname "$0")/.."

# Already inside the image (CI's container job, or the docker run below): run the tests directly.
if [ "${FLOWCANVAS_IN_PLAYWRIGHT_IMAGE:-}" = 1 ]; then
  exec ./node_modules/.bin/playwright test --config playwright.visual.config.ts "$@"
fi

# The image version always follows the @playwright/test version in the catalog.
version=$(sed -n "s/^  '@playwright\/test': //p" ../pnpm-workspace.yaml)
image="mcr.microsoft.com/playwright:v${version}-noble"
root=$(cd .. && pwd)

# Reuses the installed node_modules (same Linux platform), runs as you so files aren't owned by root,
# and mounts the repo at the same path so pnpm's links resolve.
exec docker run --rm --init --ipc=host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI -e FLOWCANVAS_IN_PLAYWRIGHT_IMAGE=1 \
  -v "$root:$root" -w "$root/e2e" \
  "$image" sh scripts/visual.sh "$@"
