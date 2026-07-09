# Correspondence Map Slice 4

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.semantic.correspondence-map-record-v1`
Status: complete

## Summary

Introduced `CorrespondenceMap` and `SelectorCorrespondenceRecord` data
structures, then attached explicit maps to the current equation transition
fixtures.

The current maps cover:

- identity preservation for persisted selectors;
- target-only introduction for `subtractBothSides`;
- grouped cancelation for the left additive inverse;
- fan-in provenance for `7 - 3 -> 4`.

`createEquationMotionPlan` now carries the map forward so renderers can consume
semantic correspondence instead of reconstructing intent from token lifecycle
alone.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts`
- Failed because generated transitions and motion plans did not expose
  `correspondenceMap`.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts`
- `npm run typecheck`
- `git diff --check`

## Next Slice

Proceed to `frontier.semantic.visual-lifecycle-separation-v1`.
