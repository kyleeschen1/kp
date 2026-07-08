# Phase 6: Browser Verification

## Goal

Add browser-level checks for the rendering behaviors that unit tests cannot fully prove.

## Scope

- Verify WebGL ready-state hydration.
- Capture screenshots for default mesh, higher resolution, generated modes, and 3D-to-2D transition endpoints if exposed.
- Keep screenshots in `/private/tmp`; record evidence in a Theseus event or plan result doc.

## Expected Files

- `tests/` if a Playwright test harness becomes available.
- `docs/theseus/events/` or a plan results file for evidence.

## Verification

- Playwright screenshot commands.
- Full verification if test harness files are added.

## Commit

Commit any new browser harness or final evidence docs.
