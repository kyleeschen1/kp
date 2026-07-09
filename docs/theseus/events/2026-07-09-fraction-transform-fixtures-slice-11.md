# Fraction Transform Fixtures Slice 11

Target: `frontier.katex.fraction-transform-fixtures-v1`

## Summary

Added a reusable KaTeX transform fixture registry for the first fraction
geometry cases:

```text
x / 3                       -> \frac{x}{3}
\frac{x}{3}                 -> x / 3
\frac{a}{b} + \frac{c}{d}   -> \frac{ad + bc}{bd}
```

The fixtures encode expected structural tokens for fraction bars and synthetic
token rows/columns so matcher behavior can be tested before semantic fraction
transforms exist.

## Sources

- `src/rendering/katex-transform-fixtures.ts`
  - Added `fractionTransformFixtures`.
  - Added fixture token roles, side definitions, structural-token
    expectations, and lookup helper.
- `tests/katex-token-snapshot.test.ts`
  - Added coverage for expected fraction structural tokens.
- `tests/katex-token-matcher.test.ts`
  - Added matcher behavior coverage for make/split/combine fixture artifacts.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the fraction fixture registry checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/katex-token-matcher.test.ts`
  - Failed because `src/rendering/katex-transform-fixtures.ts` did not exist.
- Green: same focused command
  - Passed 15 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/katex-token-matcher.test.ts`
  - Passed 15 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.

## Next

Proceed to `frontier.katex.script-transform-fixtures-v1`.
