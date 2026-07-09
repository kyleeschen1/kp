# Generalized Subtract Both Sides Slice 7

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.transform.subtract-both-sides-general-v1`
Status: complete

## Summary

Generalized `subtractBothSides` beyond the original `x + 3 = 7` fixture for a
first conservative case: simple equations of the form `identifier = number`.

The new generator supports examples such as:

```txt
y = 10  -- subtractBothSides(2) -->  y - 2 = 10 - 2
```

It emits dynamic motion ids, selector paths, correspondence records, annotations,
and a motion plan with semantic and visual lifecycles.

The richer `x + 3 = 7` fixture still uses its existing hand-authored transition
so the current demo behavior remains unchanged.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts`
- Failed because `y = 10` with `subtractBothSides(2)` was unsupported.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts tests/latex-parser.test.ts`
- `npm run typecheck`
- `git diff --check`
- `npm test`

## Next Slice

Proceed to `frontier.transform.cancel-additive-inverse-general-v1`.
