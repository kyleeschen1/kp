# Fixture Animation Browser Selection Slice 3

Target: `frontier.browser.animation-selector-smoke-v1`

## Summary

Added browser coverage for the editor animation dropdown.

The KaTeX browser smoke now selects each fixture-backed animation and verifies
that the panel re-renders:

- selected animation id;
- one-step max step;
- source LaTeX metadata;
- target LaTeX metadata.

The test then switches back to `x + 3 = 7` and runs the existing deep semantic
playback assertions.

## Sources

- `tests/katex-transition.browser.spec.ts`
  - Added dropdown selection coverage for the five new fixture animations.

## Verification

- `npm run test:browser:katex`
  - Passed 2 Playwright tests.

## Next

Improve fixture lowering from whole-expression source/target transitions toward
token-level correspondence for the simpler fixtures.
