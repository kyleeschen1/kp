# Radical Transform Fixtures Slice 13

Target: `frontier.katex.radical-transform-fixtures-v1`

## Summary

Extended the KaTeX transform fixture registry with radical/root geometry cases:

```text
x^{1/2}       -> \sqrt{x}
\sqrt{x}      -> x^{1/2}
\sqrt[3]{x^3} -> x
```

The fixtures encode expected radical SVG/rule artifacts:

- `structural:hide-tail`
- `structural:sqrt-line`

They also add fixture diagnostics for token counts, structural artifact counts,
and role-change counts.

## Sources

- `src/rendering/katex-transform-fixtures.ts`
  - Added `radicalTransformFixtures`.
  - Added radical transform intents, radicand/root-index roles, and diagnostics
    summarization.
- `tests/katex-token-snapshot.test.ts`
  - Added radical structural-token expectations and diagnostics coverage.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the radical fixture checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts`
  - Failed because `radicalTransformFixtures` was not exported.
- Green: same focused command
  - Passed 12 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts`
  - Passed 12 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.

## Next

Proceed to `frontier.katex.wrapper-transform-fixtures-v1`.
