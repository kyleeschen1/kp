# Wrapper Transform Fixtures Slice 14

Target: `frontier.katex.wrapper-transform-fixtures-v1`

## Summary

Extended the KaTeX transform fixture registry with delimiter and wrapper cases:

```text
x+1   -> (x+1)
|x|   -> x
v     -> \lVert v \rVert
x     -> f(x)
```

The fixtures encode delimiter and function-name artifacts as visual tokens. A
motion-plan test also connects the fixture category to the existing
`group-wrap` lifecycle, which maps to `role-change` correspondence and a `wrap`
visual lifecycle.

## Sources

- `src/rendering/katex-transform-fixtures.ts`
  - Added `wrapperTransformFixtures`.
  - Added wrapper transform intents for delimiter wrap, delimiter unwrap, and
    function wrap.
- `tests/katex-token-snapshot.test.ts`
  - Added wrapper fixture coverage for delimiter/function artifacts.
- `tests/equation-motion-plan.test.ts`
  - Added wrapper fixture coverage for `group-wrap` plus delimiter artifacts
    entering.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the wrapper fixture checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/equation-motion-plan.test.ts`
  - Failed because `wrapperTransformFixtures` was not exported.
  - Failed because `wrapper.parentheses.wrap` was not registered.
- Green: same focused command
  - Passed 27 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/equation-motion-plan.test.ts`
  - Passed 27 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.

## Next

Proceed to `frontier.katex.large-operator-fixtures-v1`.
