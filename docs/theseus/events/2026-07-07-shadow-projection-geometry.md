# Shadow Projection Geometry

Recorded: 2026-07-07

Added a pure graph-space helper for projecting points and quads onto a constant
`z` shadow plane opposite the light direction. This is the geometry primitive
needed before rendering SVG shadow layers.

TDD evidence:
- Red: `node --disable-warning=ExperimentalWarning --test tests/surface-shadow.test.ts`
  failed because `src/rendering/surface-shadow.ts` did not exist.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/surface-shadow.test.ts`
  - `npm run typecheck`
  - `git diff --check`
