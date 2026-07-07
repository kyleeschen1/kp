# Expression-Backed 3D Curves

Recorded: 2026-07-07

3D curve semantic objects now carry executable parametric expressions for `x(t)`,
`y(t)`, and `z(t)`. The renderer samples those expressions with the shared math
AST/compiler instead of using a hard-coded time spiral formula.

This keeps 3D curves aligned with existing 2D curves and 3D surfaces:
semantic JSON owns the math, and SVG rendering projects sampled graph-space
geometry from that executable object.

Verification:
- Red tests first: semantic curve object lacked `expressions`, and the sampler
  still returned the old fixed spiral.
- `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
- `npm run typecheck`
- `git diff --check`

Deferred:
- LaTeX parsing for parametric 3D curves remains separate from this slice.
