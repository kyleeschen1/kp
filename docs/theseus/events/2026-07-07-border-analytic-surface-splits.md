# Border Analytic Surface Splits

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved border analytic occlusion slice:

- Passed all rendered surfaces into surface edge segmentation.
- Added analytic surface-edge split points against other explicit surfaces.
- Explicitly skipped a surface's own expression when splitting its perimeter,
  because every perimeter point lies on the owning surface.
- Kept projected depth-buffer visibility as the final classifier.
- Added edge outline metadata:
  - `data-kp-edge-split-source="analytic-surface+depth-buffer"`
  - `data-kp-edge-analytic-split-count`

For the default single-surface scene the analytic edge split count is zero, as
expected.

## Source Refs

- `src/rendering/graph-svg.ts`: edge split result plumbing, other-surface
  analytic split points, and edge metadata.
- `tests/rendering.test.ts`: edge split metadata coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`: 17 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Rich fixtures for actual multi-surface edge crossings remain deferred until
  the overlap classifier is expanded.
- Arrow visibility inheritance remains the next approved slice.
