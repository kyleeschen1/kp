# LaTeX Equation Graph Loop Checkpoint

Date: 2026-07-07
Project: kp
Status: checkpoint

## Summary

Executed the approved LaTeX-to-graph long-loop through the first usable editor
checkpoint:

- Added a compact LaTeX math tokenizer with offsets for editor-friendly errors.
- Added a Pratt-style expression parser for numbers, variables, arithmetic,
  grouping, `\frac`, `\sin`, `\cos`, and `\sqrt`.
- Added lowering from parsed LaTeX into the existing `MathExpression` AD AST.
- Added explicit equation classification for `y = f(x)` and `z = f(x,y)`.
- Added semantic graph-scene factories for classified 2D curves and 3D surfaces.
- Made 2D curves and 3D surfaces carry required executable `MathExpression`
  values.
- Updated SVG sampling so generated curves and surfaces render from their stored
  expressions instead of hard-coded demo formulas.
- Added a minimal editor equation input that appends generated graph scenes and
  displays parse/classification errors.
- Updated the architecture note with the parser, graph, AD, and future Wasm
  boundaries.

## Source Refs

- `src/math/latex-tokenizer.ts`: LaTeX-ish math tokenizer.
- `src/math/latex-parser.ts`: parse AST and structured parse errors.
- `src/math/latex-to-expression.ts`: parsed AST to executable AD expression.
- `src/math/equation-classifier.ts`: explicit equation parser/classifier.
- `src/semantic/equation-graph.ts`: graph-scene factory from LaTeX equations.
- `src/semantic/graph.ts`: required expression fields on curve/surface objects.
- `src/rendering/graph-svg.ts`: expression-backed curve/surface sampling and surface normals.
- `src/editor/editor.ts`: equation input control.
- `src/editor/state.ts`: immutable append of generated graph scenes.
- `src/main.ts`: browser handler for equation graph creation.
- `src/styles.css`: equation input layout.
- `docs/semantic-editor-first-pass.md`: updated architecture and current limits.

## Verification

Passed at checkpoint:

- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/equation-graph.test.ts tests/rendering.test.ts`: 23 tests passed, 0 failed.
- `npm test`: 60 tests passed, 0 failed.
- `npm run build`: TypeScript and Vite production build passed.

## Deferred

- Full TeX parsing remains deferred; the current parser is a compact graphable
  equation language.
- Implicit equations such as `x^2 + y^2 = 1` remain deferred because they need
  contouring or implicit surface machinery.
- Piecewise functions and inequalities remain deferred until `MathExpression`
  has conditional/relational nodes.
- Wasm execution remains deferred until the TypeScript expression semantics are
  stable enough to compile to bytecode or typed-array kernels.
- WebGL remains deferred; this checkpoint keeps SVG semantics and expression
  execution moving first.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
`package.json` has no `theseus` script, so this approved long-loop checkpoint
was recorded manually under the configured `eventsRoot`.
