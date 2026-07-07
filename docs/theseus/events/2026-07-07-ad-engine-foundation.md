# AD Engine Foundation

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Implemented the recommended executable-math foundation:

- Added a dependency-free expression AST for semantic mathematical objects.
- Added LaTeX rendering, numeric evaluator compilation, symbolic differentiation, and gradient compilation.
- Added the saddle surface as the first shared executable expression.
- Rewired the 3D saddle renderer to sample `z` values and compute surface normals from the AD-backed expression instead of hand-coded derivatives.
- Documented the intended future Wasm boundary: bulk numeric geometry over typed arrays, while TypeScript owns semantic JSON, editor state, LaTeX, and DOM/SVG/WebGL rendering.

## Source Refs

- `src/math/expression.ts`: expression AST, constructors, LaTeX rendering, compiled evaluators, differentiation, and gradient compilation.
- `src/math/surface-examples.ts`: shared saddle expression, compiled evaluator, and compiled gradient.
- `src/rendering/graph-svg.ts`: saddle surface sampling and normal computation now use the executable expression layer.
- `tests/math-expression.test.ts`: coverage for expression LaTeX, evaluation, partial derivatives, compiled gradients, and the saddle expression.
- `docs/semantic-editor-first-pass.md`: AD engine note and future Wasm/occlusion boundary.

## Verification

Passed:

- Focused math/rendering tests: 15 tests passed, 0 failed.
- `npm test`: 43 tests passed, 0 failed.
- `npm run build`: TypeScript and Vite production build passed.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
`package.json` has no `theseus` script, so this event was recorded manually under the configured `eventsRoot`.
