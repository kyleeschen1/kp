# KaTeX Transform Gallery Slice 21

Target: `frontier.dashboard.katex-transform-gallery-v1`

## Summary

Added a dashboard-facing KaTeX transform fixture gallery:

- Renders every `katexTransformFixtures` record as a selectable dashboard
  control.
- Defaults to `fraction.make.inline-to-stacked`.
- Keeps the selected fixture in browser memory only.
- Shows the selected fixture family, intent, source/target LaTeX, token counts,
  artifact counts, and role-change expectations.

This gives the dashboard a concrete bridge from the object gallery to future
sample cards and scrubbers without creating a persistence decision for V1.

## Sources

- `src/project-dashboard/render.ts`
  - Added render options for the selected KaTeX fixture, fixture selection UI,
    sample details, and diagnostics display.
- `src/main.ts`
  - Added in-memory fixture selection state and a dashboard click action for
    changing the selected fixture.
- `src/styles.css`
  - Added restrained dashboard styling for fixture controls, sample statistics,
    LaTeX fields, and role-change details.
- `tests/project-dashboard.test.ts`
  - Added render-contract coverage for selected fixture output.
- `tests/project-dashboard.browser.spec.ts`
  - Added browser coverage for selecting a fixture and preserving editor round
    trip behavior.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the Slice 21 checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/project-dashboard.test.ts`
  - Failed because the dashboard did not render `data-kp-katex-fixture-gallery`.
- Green: same focused command
  - Passed 29 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/project-dashboard.test.ts`
  - Passed 29 tests.
- `npm run test:browser:dashboard`
  - Initial sandboxed run failed with `listen EPERM` on `127.0.0.1:4173`.
  - Escalated rerun passed 1 Playwright test.
- `npm run typecheck`
  - Passed after making the optional selected fixture id accept explicit
    `undefined`.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 255 tests.

## Next

Proceed to `frontier.authoring.transform-fixture-contract-v1`.
