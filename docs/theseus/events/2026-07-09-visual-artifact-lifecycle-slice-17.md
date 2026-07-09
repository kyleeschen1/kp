# Visual Artifact Lifecycle Slice 17

Target: `frontier.render.visual-artifact-lifecycle-v1`

## Summary

Added explicit visual artifact lifecycle records for:

- fraction bars;
- matrix brackets;
- radical glyph groups;
- accents.

The records define stable artifact ids, source/target artifact endpoints, and
visual enter/exit behavior. They also convert to `artifact` correspondence
records, which keeps visual-only render artifacts in the same provenance layer
as semantic selectors without giving them semantic identity.

## Sources

- `src/rendering/visual-artifact-lifecycle.ts`
  - Added lifecycle record types, four KaTeX artifact records, summary helper,
    and correspondence conversion helper.
- `tests/katex-token-snapshot.test.ts`
  - Added coverage for stable artifact categories and lifecycle summaries.
- `tests/equation-motion-plan.test.ts`
  - Added coverage that lifecycle records convert to visual-only `artifact`
    correspondence records.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the visual artifact lifecycle checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/katex-token-snapshot.test.ts`
  - Failed because `src/rendering/visual-artifact-lifecycle.ts` did not exist.
- Green: same focused command
  - Passed 31 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/katex-token-snapshot.test.ts`
  - Passed 31 tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 247 tests.

## Next

Proceed to `frontier.render.katex-correspondence-overrides-v1` if verification
passes.
