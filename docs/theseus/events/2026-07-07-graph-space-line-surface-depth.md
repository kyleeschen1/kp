# Graph-Space Line Surface Depth

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved graph-space line/surface helper slice:

- Added a pure graph-space interpolation helper for 3D points.
- Added `signedLineSurfaceDepthAt(line, surfaceExpression, t)`.
- Added `compileLineSurfaceDepthFunction(line, surfaceExpression)` so later
  root-finding can reuse the same compiled surface evaluator.
- Defined the sign convention for explicit surfaces: `signedDepth = point.z -
  surfaceZ`, so positive means the line point is above the surface and negative
  means below it.

This is the substrate for the next analytic axis/surface intersection solver.

## Source Refs

- `src/rendering/graph-space-intersections.ts`: graph-space interpolation and
  signed line/surface depth sampling.
- `tests/graph-space-intersections.test.ts`: focused signed-depth coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/graph-space-intersections.test.ts`: 2 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Bisection/root solving is the next approved slice.
- Renderer integration remains deferred until the solver exists.
