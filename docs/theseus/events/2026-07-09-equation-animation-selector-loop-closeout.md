# Equation Animation Selector Loop Closeout

Target: `frontier.loop.equation-animation-selector-closeout-v1`

## Summary

Closed the approved equation animation selector loop after broad verification.

In hindsight, this was the right loop: it turned the single `x + 3 = 7`
equation panel into a small animation lab, added fixture-backed entries for the
awkward KaTeX transition classes, verified selection and playback in browser
tests, and linked the dashboard fixture gallery back to the editor animation
catalog.

## Completed Commits

- `7588c1a` editor: add equation animation catalog
- `7bbbb90` editor: add fixture animation entries
- `f332624` test: cover fixture animation selector
- `76171b5` test: cover fixture animation playback
- `c48c15e` dashboard: link fixtures to editor animations

## Structural Improvements

- The editor equation panel now reads from a catalog instead of one hardcoded
  transition list.
- Fixture-backed animations share the same player, step controls, beat count,
  duration setting, and collapse-scale setting as the linear equation solve.
- Five awkward KaTeX transition families are now selectable in the editor:
  fractions, radicals, wrappers/functions, scripts/exponents, and matrix
  delimiters.
- Browser coverage verifies both selecting fixture entries and stepping a
  fixture animation forward and backward.
- Dashboard fixture samples can now report when an editor animation exists for
  the selected fixture.

## Product Behavior Unlocked

- The equation animation panel can be used as a quick fixture preview surface.
- The dashboard can grow from static fixture taxonomy into clickable sample
  cards without inventing another animation registry.
- Future per-token fixture lowering can happen behind the same catalog ids and
  browser tests.

## Verification

- `npm test`
  - Passed 259 tests.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run test:browser:dashboard`
  - Passed 1 Playwright test.
- `git diff --check`
  - Passed.

## Residual Risks

- Fixture-backed animations are currently whole-expression source-to-target
  transitions, so fractions, radicals, wrappers, exponents, and matrix delimiter
  swaps preserve proper KaTeX rendering but do not yet expose fine-grained
  token identity.
- The dashboard only marks that an editor animation exists; it does not yet open
  or embed the live sample card from the fixture gallery.
- The dropdown has useful fixtures but no category grouping or search yet.

## Recommended Next Slices

1. Lower one fixture family, likely fractions, from whole-expression motion to
   per-token semantic tracks.
2. Add dashboard-to-editor deep linking for a selected fixture animation.
3. Add category grouping/search to the editor animation dropdown once the list
   grows beyond the current six entries.
