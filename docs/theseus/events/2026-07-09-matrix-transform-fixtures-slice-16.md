# Matrix Transform Fixtures Slice 16

Target: `frontier.katex.matrix-transform-fixtures-v1`

## Summary

Extended the KaTeX transform fixture registry with matrix/vector cases:

```text
\begin{bmatrix}1 & 0 \\ 0 & 1\end{bmatrix}
  -> \begin{pmatrix}1 & 0 \\ 0 & 1\end{pmatrix}

\begin{bmatrix}1 & 2 \\ 3 & 4\end{bmatrix}
  -> \begin{bmatrix}1 & 2 \\ 6 & 4\end{bmatrix}

\begin{bmatrix}a & b \\ c & d\end{bmatrix}
  -> \begin{bmatrix}c & d \\ a & b\end{bmatrix}

\begin{bmatrix}x \\ y\end{bmatrix}
  -> \begin{bmatrix}x & y\end{bmatrix}
```

The fixtures encode matrix bracket artifacts, entry selectors, and row/column
positions. This lets row swaps and vector transposes preserve identity while
their grid-relative placement changes.

## Sources

- `src/rendering/katex-transform-fixtures.ts`
  - Added `matrixTransformFixtures`.
  - Added matrix transform intents for delimiter changes, entry updates, row
    swaps, and vector transpose.
  - Added matrix/vector token roles, selector ids, and `matrixPosition`
    metadata.
- `tests/katex-token-snapshot.test.ts`
  - Added fixture coverage for bracket artifacts, selector ids, matrix
    positions, and row/vector role changes.
- `tests/rendering.test.ts`
  - Added KaTeX rendering coverage for matrix/vector fixture source and target
    LaTeX strings.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the matrix/vector fixture checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts tests/katex-token-snapshot.test.ts`
  - Failed because `matrixTransformFixtures` was not exported.
- Green: same focused command
  - Passed 37 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts tests/katex-token-snapshot.test.ts`
  - Passed 37 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 245 tests.

## Next

Proceed to `frontier.render.visual-artifact-lifecycle-v1` if verification passes.
