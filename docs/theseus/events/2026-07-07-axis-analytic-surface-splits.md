# Axis Analytic Surface Splits

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved axis analytic occlusion slice:

- Passed rendered explicit surfaces into 3D axis segmentation.
- Used graph-space line/surface intersections as additional axis breakpoints
  before projection.
- Kept the projected software depth scene as the final visibility classifier.
- Added axis group metadata:
  - `data-kp-axis-split-source="analytic-surface+depth-buffer"`
  - `data-kp-axis-analytic-split-count`

This does not replace projected depth-buffer visibility. It gives axes exact
graph-space surface crossing breakpoints where the current explicit surface
solver can find them, then keeps the existing adaptive projected segmentation.

## Source Refs

- `src/rendering/graph-svg.ts`: axis split values from graph-space
  line/surface intersections and SVG axis metadata.
- `tests/rendering.test.ts`: axis split metadata coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`: 17 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Border analytic occlusion is the next approved slice.
- Tangent-only intersections remain limited by the sampled solver behavior.
