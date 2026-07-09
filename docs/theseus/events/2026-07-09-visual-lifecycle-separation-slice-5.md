# Visual Lifecycle Separation Slice 5

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.semantic.visual-lifecycle-separation-v1`
Status: complete

## Summary

Split equation motion-plan tokens into three related but distinct fields:

- `correspondenceRelation`: selector relationship such as identity, fan-in, or
  cancelation;
- `semanticLifecycle`: semantic status such as identity-preserved, introduced,
  derived, or cancelled;
- `visualLifecycle`: render behavior such as persist, enter, vanish, wrap, or
  shift.

The legacy `lifecycle` field remains as the current equation-token compatibility
alias for timing and existing renderers.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts`
- Failed because plan tokens and tracks did not expose separate semantic and
  visual lifecycle fields.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts`
- `npm run typecheck`
- `git diff --check`
- `npm test`

## Next Slice

Proceed to `frontier.expression.selector-paths-linear-equation-v1`.
