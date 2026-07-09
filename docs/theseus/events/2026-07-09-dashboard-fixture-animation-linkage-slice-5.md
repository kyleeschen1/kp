# Dashboard Fixture Animation Linkage Slice 5

Target: `frontier.motion.fixture-dashboard-linkage-v1`

## Summary

Linked KaTeX transform fixtures back to their editor equation animations.

The equation animation catalog now records the originating fixture id for
fixture-backed entries and exposes a lookup by fixture id. The project dashboard
uses that lookup to mark selected fixture samples when an editor animation is
available, giving the fixture gallery a visible bridge to the equation animation
dropdown.

## Sources

- `src/editor/equation-animation-catalog.ts`
  - Added fixture id metadata and fixture-to-animation lookup.
- `src/project-dashboard/render.ts`
  - Renders linked editor animation metadata on the selected fixture sample.
- `src/styles.css`
  - Added compact styling for the linked animation status.
- `tests/project-dashboard.test.ts`
  - Covers the radical fixture's linked editor animation metadata.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts tests/editor.test.ts`
  - Passed 31 tests.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `git diff --check`
  - Passed.

## Next

Run closeout verification across the editor, dashboard, and KaTeX browser
surfaces, then record the loop closeout.
