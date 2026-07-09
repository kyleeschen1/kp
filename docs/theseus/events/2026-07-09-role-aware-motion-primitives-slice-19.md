# Role-Aware Motion Primitives Slice 19

Target: `frontier.motion.role-aware-primitives-v1`

## Summary

Added a descriptor layer for role-aware motion primitives:

- `inline-to-fraction`
- `inline-to-script`
- `wrap`
- `unwrap`

Each descriptor includes source/target roles, token lifecycle, visual lifecycle,
timing, easing, and default from/to poses. Descriptors compile into ordinary
`EquationMotionTrack` records, proving the existing sampler and player can
handle role-specific scale and baseline shifts without a new clock or sampler
rewrite.

## Sources

- `src/rendering/role-aware-motion-primitives.ts`
  - Added descriptor types, four primitive descriptors, lookup helper, and
    descriptor-to-track compiler.
- `tests/equation-motion-sampler.test.ts`
  - Added coverage that descriptors compile to sampler-compatible tracks and
    produce interpolated scale/baseline poses.
- `tests/equation-motion-player.test.ts`
  - Added coverage that descriptor tracks rewind through the existing player.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the role-aware motion primitive checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/equation-motion-sampler.test.ts tests/equation-motion-player.test.ts`
  - Failed because `src/rendering/role-aware-motion-primitives.ts` did not
    exist.
- Green: same focused command
  - Passed 16 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-sampler.test.ts tests/equation-motion-player.test.ts`
  - Passed 16 tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 251 tests.

## Next

Proceed to `frontier.motion.semantic-beat-compiler-v1` if verification passes.
