# KaTeX Correspondence Overrides Slice 18

Target: `frontier.render.katex-correspondence-overrides-v1`

## Summary

Added a backward-compatible correspondence override path for KaTeX token
matching:

- `createKatexTransitionPlan(source, target, { correspondenceMatches })`
- `transitionKatexEquations(sourceEl, targetEl, { correspondenceMatches })`

Overrides are explicit source-token-id to target-token-id pairs. They run before
the existing heuristic matcher and are accepted only when both token ids exist,
neither endpoint has already been used, and the token text matches. This keeps
the first version useful for repeated-token ambiguity while avoiding a renderer
lie where a source glyph texture would be moved into a different target glyph.

## Sources

- `src/rendering/katex-token-matcher.ts`
  - Added matcher options and correspondence override records.
  - Added override application before heuristic matching.
  - Added optional diagnostics for accepted and invalid overrides.
- `src/rendering/katex-transition-controller.ts`
  - Added optional transition-level `correspondenceMatches` pass-through.
- `src/rendering/katex-transition-types.ts`
  - Added optional override diagnostics fields.
- `tests/katex-token-matcher.test.ts`
  - Added coverage that explicit overrides win over repeated-token heuristic
    ordering.
- `tests/katex-transition-controller.test.ts`
  - Added coverage that transition options reach the matcher.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the matcher override checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-token-matcher.test.ts tests/katex-transition-controller.test.ts`
  - Failed because overrides were ignored by the matcher.
  - Failed because transition options were not passed to the matcher.
- Green: same focused command
  - Passed 14 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/katex-token-matcher.test.ts tests/katex-transition-controller.test.ts`
  - Passed 14 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 249 tests.

## Next

Proceed to `frontier.motion.role-aware-primitives-v1` if verification passes.
