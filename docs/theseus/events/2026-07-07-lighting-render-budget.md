# Lighting Render Budget

Recorded: 2026-07-07

3D render budgets now include an estimated per-quad lighting operation count.
The estimator multiplies rendered surface quads by active light-term weights:
ambient, diffuse, depth haze, rim, and a heavier specular term. SVG output now
exports the lighting cost and maximum budget alongside depth and overlap budget
metadata.

TDD evidence:
- Red:
  - `node --disable-warning=ExperimentalWarning --test tests/performance-budget.test.ts`
    failed because the lighting operation estimator did not exist.
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
    failed because SVG render-budget metadata did not include lighting costs.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/performance-budget.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `npm run typecheck`
  - `git diff --check`
