# Radical And Script Token Identity Slice

Target: `frontier.motion.radical-script-token-identity-v1`

## Summary

Fixed the diagnosed token-identity gaps in the equation animation catalog:

- `x^{1/2} -> \sqrt{x}` no longer falls through the whole-expression fallback.
  The base `x` is a persistent `group-wrap` token from the source base to the
  target radicand, so measured layout deltas can interpolate it smoothly.
- The radical exponent exits, while the radical glyph/rule enters as a
  visual-only artifact through the structural `hide-tail` selector.
- `x \cdot x -> x^2` now treats the second source `x` as one derived
  source-to-target token that shrinks and fades toward the target exponent slot,
  rather than vanishing separately while `2` appears independently.
- `simplify-into` endpoints now allow a target motion id for derived visuals.
  `cancel` and ordinary `exit` remain source-only lifecycles.

## Sources

- `src/editor/equation-animation-catalog.ts`
  - Added radical-specific annotated render data and fixture transition.
  - Updated script combine transition to connect the source factor to the
    target exponent.
- `src/editor/editor.ts`
  - Added `hide-tail` structural motion annotation support for radical
    artifacts.
- `src/rendering/equation-motion-plan.ts`
  - Relaxed derived `simplify-into` endpoint validation while keeping
    destructive lifecycles strict.
- `tests/equation-motion-plan.test.ts`
  - Added radical persistence coverage and updated script derived-token
    expectations.
- `tests/editor.test.ts`
  - Added rendered radical anchor coverage.
- `tests/katex-transition.browser.spec.ts`
  - Added browser-level radical anchor assertions.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/editor.test.ts`
  - Failed because the radical fixture emitted `source.expression` and
    `target.expression` fallback anchors instead of base/radicand anchors.
- Red: same focused plan test after the radical fix
  - Failed because the script fixture still emitted a separate target-only
    exponent instead of one source-to-target derived token.
- Green: same focused command
  - Passed 39 tests.

## Runtime Probe

Sampled the editor at `http://127.0.0.1:8000/` after applying measured motion
deltas:

- Radical at progress `0.25`
  - Source `x` transform: `translate(9.35156px, 0.203125px) scale(1)`
  - Target `x` hidden until handoff
  - Motion ids present: source `x`, source exponent, target `x`, target radical
- Script at progress `0.4`
  - Source factor transform: `translate(-5.67797px, -1.12179px) scale(0.641028)`
  - Source factor opacity: `0.447736`
  - Target exponent hidden until handoff

## Verification

- `npm test`
  - Passed 272 tests.
- `npm run test:browser:dashboard`
  - Passed 1 Playwright test.
- `npm run typecheck`
  - Passed.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `git diff --check`
  - Passed.

## Next

Use this endpoint pattern for the remaining role-change fixtures: source tokens
that visually become derived target tokens need explicit source and target
motion ids, not independent fallback enter/exit tracks.
