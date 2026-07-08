# SVG Shadow Layer

Recorded: 2026-07-07

Rendered projected surface shadows in SVG. Each prepared 3D surface now carries
shadow quads projected onto the graph's low `z` plane along the semantic light
direction. The graph root and per-surface shadow layer expose shadow plane,
quad-count, caster, and projection metadata.

The shadow layer is drawn before opaque surface quads so the current surface
still controls visual occlusion.

TDD evidence:
- Red: `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  failed because SVG output did not expose shadow metadata or shadow polygons.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/surface-shadow.test.ts`
  - `npm run typecheck`
  - `git diff --check`
