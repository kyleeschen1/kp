# Evaluate Constant Expression Slice 9

Target: `frontier.transform.evaluate-constant-expression-v1`

## Summary

Generalized right-side constant-difference simplification beyond the original
`x = 7 - 3` fixture for a first parser-backed dynamic case:

```text
y = 10 - 2  -- evaluate right constant difference -->  y = 8
```

The generated transition now preserves the left identifier and equals sign,
marks the source numeric difference as `simplify-into`, introduces the result
token, and records a `fan-in` correspondence from the source number, minus
operator, and subtrahend into the simplified result.

## Sources

- `src/math/expression.ts`
  - Added `evaluateConstantExpression` for finite numeric expression trees.
  - Returns `undefined` for variables, division by zero, non-finite results, and
    non-arithmetic calls.
- `src/math/equation-transform.ts`
  - Added a generated `evaluate-constant-difference` transition for simple
    equations with an identifier on the left and a numeric difference on the
    right.
  - Kept the original hardcoded `x = 7 - 3` transition as the first matching
    path.
- `tests/math-expression.test.ts`
  - Added evaluator coverage for numeric-only expressions and rejected
    variable/divide-by-zero cases.
- `tests/equation-transform.test.ts`
  - Added transition coverage for `y = 10 - 2 -> y = 8`, including selector
    paths and fan-in correspondence.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/math-expression.test.ts`
  - Failed because `evaluateConstantExpression` was not exported.
  - Failed because `y = 10 - 2` with `evaluate-constant-difference` was
    unsupported.
- Green: same focused command
  - Passed 11 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/math-expression.test.ts`
  - Passed 11 tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 233 tests.

## Next

Proceed to `frontier.transform.notation-transform-category-v1`.
