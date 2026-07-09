# Semantic Beat Compiler Slice 20

Target: `frontier.motion.semantic-beat-compiler-v1`

## Summary

Added a semantic beat compiler for the current equation demo timeline:

- 20 total beats.
- Named beat ranges for layout shift, introduced-token entry, cancellation,
  post-cancel layout shift, and final simplification reveal.
- Helpers for raw beat progress, eased beat progress, and lowering a beat range
  to a normal `EquationMotionTrack`.

The equation motion demo now reads from the compiled timeline instead of local
hard-coded beat constants. This keeps the current behavior and scrubber contract
while moving timing semantics into reusable data.

## Sources

- `src/rendering/semantic-beat-compiler.ts`
  - Added timeline/beat types, compiler validation, current demo timeline,
    beat progress helpers, easing helper, and beat-to-track lowering.
- `src/editor/equation-motion-demo-controller.ts`
  - Migrated demo beat math to the compiled timeline.
- `tests/equation-motion-sampler.test.ts`
  - Added coverage for the current 20-beat timeline and sampler-compatible beat
    tracks.
- `tests/equation-motion-player.test.ts`
  - Added coverage that semantic beat tracks play and rewind on the existing
    player clock.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the semantic beat compiler checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts tests/equation-motion-player.test.ts`
  - Failed because `src/rendering/semantic-beat-compiler.ts` did not exist.
- Green: same focused command
  - Passed 34 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts tests/equation-motion-player.test.ts`
  - Passed 34 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 254 tests.

## Next

Proceed to `frontier.dashboard.katex-transform-gallery-v1` if verification
passes.
