# Axis Arrow Visibility Inheritance

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved axis arrow visibility slice:

- Made arrowhead visibility provenance explicit in SVG metadata.
- Added `data-kp-axis-arrow-visibility-source="endpoint-segment"`.
- Added `data-kp-axis-arrow-end-segment-visibility`.
- Kept the existing `data-kp-visibility-source="depth-buffer"` because the
  endpoint segment's visibility still ultimately comes from the shared depth
  scene.

This documents the intended behavior: arrowheads inherit the visibility of the
axis segment at their endpoint instead of running an independent occlusion path.

## Source Refs

- `src/rendering/graph-svg.ts`: axis arrow metadata.
- `tests/rendering.test.ts`: arrow visibility provenance coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`: 17 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Geometry changes to arrow size or shape remain deferred.
- Surface overlap classification remains the next approved slice.
