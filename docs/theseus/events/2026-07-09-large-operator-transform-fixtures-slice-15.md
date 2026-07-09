# Large-Operator Transform Fixtures Slice 15

Target: `frontier.katex.large-operator-fixtures-v1`

## Summary

Extended the KaTeX transform fixture registry with large-operator cases:

```text
\sum a_i                  -> \sum_{i=1}^{n} a_i
\prod_{i=1}^{n} a_i       -> \prod_{i=0}^{n-1} a_i
\int f(x)\,dx             -> \int_{a}^{b} f(x)\,dx
\lim_{x \to 0} f(x)       -> \lim_{h \to 0} f(h)
```

The fixtures distinguish semantic token roles from visual layout roles. This is
needed because a limit approach is semantically a `limit-approach`, while its
rendered placement follows lower-limit geometry.

## Sources

- `src/rendering/katex-transform-fixtures.ts`
  - Added `largeOperatorTransformFixtures`.
  - Added large-operator transform intents for summation bounds, product bound
    changes, integral bounds, and limit approach changes.
  - Added token roles for large operators, bounds, bodies, integrands,
    differentials, and limit approaches.
  - Added optional `layoutRole` metadata for baseline, upper-limit, and
    lower-limit geometry.
- `tests/katex-token-snapshot.test.ts`
  - Added fixture coverage for large-operator glyphs and under/over limit
    geometry.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the large-operator fixture checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts`
  - Failed because `largeOperatorTransformFixtures` was not exported.
- Green: same focused command
  - Passed 14 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts`
  - Passed 14 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 243 tests.

## Next

Proceed to `frontier.katex.matrix-transform-fixtures-v1` if verification passes.
