# Semantic Light Fill

Recorded: 2026-07-07

Surface quad fill now uses the `Graph3DObject.light` semantic settings instead
of a renderer-local hard-coded light. Ambient, diffuse, and depth-haze values
flow into `surfaceQuadFill`, so authored graph light settings affect the actual
SVG surface colors as well as the exported metadata.

TDD evidence:
- Red:
  - `node --disable-warning=ExperimentalWarning --test tests/surface-lighting.test.ts`
    failed because low ambient/diffuse inputs still produced the default fill.
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
    failed because low-light graph SVG fills matched the default graph fills.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/surface-lighting.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `npm run typecheck`
  - `git diff --check`
