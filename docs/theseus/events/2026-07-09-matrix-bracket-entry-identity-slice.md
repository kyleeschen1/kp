# Matrix Bracket Entry Identity Slice

Target: `frontier.motion.matrix-bracket-entry-identity-v1`

## Summary

Fixed the matrix bracket-swap animation so matrix entries persist instead of
being treated as a changed whole expression.

The fixture already defined stable matrix entry selectors, but the equation
animation catalog sent `matrix.bracket.change-delimiter` through the generic
fixture fallback. That fallback created one source-expression token and one
target-expression token, which made the animation behave as if the matrix
contents changed.

The matrix bracket-swap fixture now has a token-level transition:

- the four entries are `persist` tokens with matching source/target cell ids;
- source square brackets `exit`;
- target parentheses `enter`;
- the correspondence map records target parentheses as visual-only artifacts.

`createEquationMotionPlan` now lets explicit visual-only correspondence records
(`artifact` and `focus`) override generic lifecycle-derived semantic labels for
matching tokens. This keeps delimiter artifacts visual-only without relabeling
ordinary algebraic entries.

## Sources

- `src/editor/equation-animation-catalog.ts`
  - Adds matrix-specific trusted KaTeX render metadata and token-level
    transition construction for `matrix.bracket.change-delimiter`.
- `src/rendering/equation-motion-plan.ts`
  - Lets explicit visual-only correspondence records mark matching tokens as
    `visual-only`.
- `tests/equation-motion-plan.test.ts`
  - Covers entry identity preservation and bracket artifact correspondences.
- `tests/editor.test.ts`
  - Covers rendered matrix fixture motion anchors.
- `tests/katex-transition.browser.spec.ts`
  - Covers the live dropdown path exposing per-entry anchors instead of
    whole-expression anchors.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts`
  - First failed because the catalog produced source/target expression tokens.
- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/editor.test.ts`
  - Passed 37 tests after the fix.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm test`
  - Passed 265 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run test:browser:dashboard`
  - Passed 1 Playwright test.
- `git diff --check`
  - Passed.
- Runtime Chromium probe against `http://127.0.0.1:8000/`
  - Confirmed the matrix fixture renders six source anchors and six target
    anchors, including entry ids and bracket ids, with no page errors.

## Error Note

The dev server briefly logged `ReferenceError:
createMatrixBracketSwapFixtureTransition is not defined` while Vite hot-reloaded
an intermediate edit. After the helper was added, the server reloaded cleanly.
