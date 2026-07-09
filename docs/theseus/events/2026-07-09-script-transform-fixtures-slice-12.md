# Script Transform Fixtures Slice 12

Target: `frontier.katex.script-transform-fixtures-v1`

## Summary

Extended the KaTeX transform fixture registry with exponent and subscript
geometry cases:

```text
x \cdot x   -> x^2
x^2         -> x \cdot x
a_i         -> a_{i+1}
```

The fixtures encode role-change expectations such as `factor -> superscript`,
`superscript -> factor`, and `subscript -> subscript`. They also provide
synthetic rows/columns so WebGL quad-frame sampling can validate baseline and
scale changes before semantic script transforms are implemented.

## Sources

- `src/rendering/katex-transform-fixtures.ts`
  - Added `scriptTransformFixtures`.
  - Added script transform intents, script token roles, role-change
    expectations, and combined fixture lookup.
- `tests/katex-token-snapshot.test.ts`
  - Added script fixture expectation coverage.
- `tests/katex-webgl-transition.test.ts`
  - Added a WebGL frame sample for a factor moving into superscript geometry.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the script fixture checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/katex-webgl-transition.test.ts`
  - Failed because `scriptTransformFixtures` was not exported.
  - Failed because `script.combine-factor-as-power` was not registered.
- Green: same focused command
  - Passed 20 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/katex-webgl-transition.test.ts`
  - Passed 20 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.

## Next

Proceed to `frontier.katex.radical-transform-fixtures-v1`.
