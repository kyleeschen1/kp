# Fixture Operator Fade And Function Wrap Slice

Target: `frontier.motion.fixture-operator-fade-function-wrap-v1`

## Summary

Refined fixture-backed equation animations so visual-only operators do not imply
semantic persistence.

Fraction and repeated-factor fixtures now lower to token-level transitions: the
inline slash, target fraction line, and multiplication dot fade as artifacts or
removals, while the semantic operands retain identity. The function-wrap fixture
now moves `x` into argument position first, pauses, brings parentheses in wide
before settling them, then introduces `f` from the same 35% minimum scale used
by the existing shrink/grow motif.

## Sources

- `src/editor/equation-animation-catalog.ts`
  - Added fixture-specific token transitions and annotated KaTeX render metadata.
- `src/editor/editor.ts`
  - Added full-expression trusted KaTeX rendering with internal motion ids.
- `src/editor/equation-motion-demo-controller.ts`
  - Allows direct target-entry tracks for precise fixture staging.
- `src/math/equation-transform.ts`
  - Added optional token timing and entry-effect metadata.
- `src/rendering/equation-motion-plan.ts`
  - Uses token timing overrides and makes `exit` fade by default.
- `src/rendering/katex-adapter.ts`
  - Allows trusted KaTeX rendering only when requested.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/editor.test.ts`
  - Passed 34 tests.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm test`
  - Passed 262 tests.
- `npm run test:browser:dashboard`
  - Passed 1 Playwright test.
- Runtime Chromium probe against `http://127.0.0.1:8004/`
  - Confirmed slash/dot fade, fraction line fade-in, parens-before-`f`, and
    `f` entering from 35% scale.
- `git diff --check`
  - Passed.

## Next

Lower radical and matrix fixtures from whole-expression fallback to token-level
transitions when their visual semantics need the same fidelity.
