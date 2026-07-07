# Surface Overlap Depth Classifier

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved surface overlap classifier slice:

- Extended projected surface overlaps with a depth-order classification.
- Classified overlaps as `left-front`, `right-front`, or `ambiguous`.
- Added `frontSurfaceId` when one triangle's depth range is entirely closer
  than the other's.
- Preserved ambiguous classification when triangle depth ranges overlap.

This keeps the current projected-overlap detector lightweight while giving later
debug tooling and sorting decisions better information than a raw overlap count.

## Source Refs

- `src/rendering/depth-scene.ts`: depth range classifier for projected triangle
  overlaps.
- `tests/depth-scene.test.ts`: front/back and ambiguous overlap coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/depth-scene.test.ts`: 10 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Spatial acceleration for overlap checks is the next approved slice.
- Exact surface/surface splitting remains deferred.
