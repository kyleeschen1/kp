# Linear Equation Selector Paths Slice 6

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.expression.selector-paths-linear-equation-v1`
Status: complete

## Summary

Added stable expression selector paths for the current `x + 3 = 7` equation
fixture and its two later states.

The generated equation transitions now expose source and target selector path
maps for:

- `x + 3 = 7`;
- `x + 3 - 3 = 7 - 3`;
- `x = 7 - 3`;
- `x = 4`.

Also added a parser helper that walks parsed LaTeX expressions and emits stable
paths such as `equation.left.left`, `equation.left.operator`, and
`equation.left.right`.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/latex-parser.test.ts`
- Failed because the parser helper was not exported and generated transitions
  did not expose `selectorPaths`.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/latex-parser.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/latex-parser.test.ts tests/equation-motion-plan.test.ts`
- `npm run typecheck`
- `git diff --check`
- `npm test`

## Next Slice

Proceed to `frontier.transform.subtract-both-sides-general-v1`.
