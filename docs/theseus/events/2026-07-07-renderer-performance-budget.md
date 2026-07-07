# Renderer Performance Budget

Recorded: 2026-07-07

Added a 3D renderer budget evaluator and SVG metadata for the current
software-depth path.

Current default budget:
- Depth cells: `300000`
- Depth triangles: `800`
- Surfaces: `3`
- Projected surface overlaps: `2000`

The default saddle scene currently renders within budget at `235200` depth cells
and `288` depth triangles. The SVG root now exposes budget status and counts via
`data-kp-render-budget-*` attributes.

Verification:
- Red tests first: missing `performance-budget` module and missing SVG budget
  metadata.
- `node --disable-warning=ExperimentalWarning --test tests/performance-budget.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
- `npm run typecheck`
- `git diff --check`
