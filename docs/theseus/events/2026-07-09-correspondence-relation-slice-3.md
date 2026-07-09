# Correspondence Relation Slice 3

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.semantic.correspondence-relation-v1`
Status: complete

## Summary

Defined the first shared selector correspondence relation vocabulary and threaded
default relation ids into equation motion-plan tokens.

The vocabulary distinguishes:

- identity preservation;
- role changes;
- introductions and removals;
- cancelation;
- fan-in and fan-out derivation;
- visual artifacts;
- focus annotations.

Equation motion plans now derive a default relation from each token lifecycle so
later `CorrespondenceMap` records have stable relation names to point at.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts`
- Failed because motion-plan tokens did not expose `correspondenceRelation`.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts`
- `npm run typecheck`
- `git diff --check`

## Next Slice

Proceed to `frontier.semantic.correspondence-map-record-v1`.
