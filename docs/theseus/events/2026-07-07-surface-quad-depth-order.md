# Surface Quad Depth Order

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved opaque surface ordering slice:

- Sorted rendered surface quads back-to-front by projected average depth.
- Added `data-kp-depth-order="back-to-front"` to the surface quad layer.
- Preserved the existing depth-scene construction and wireframe paths while
  making opaque quad paint order deterministic.

The depth convention remains: larger projected depth is closer to the camera,
so back-to-front SVG paint order emits smaller average depth first.

## Source Refs

- `src/rendering/graph-svg.ts`: surface quad sorting and depth-order metadata.
- `tests/rendering.test.ts`: emitted quad depth order coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`: 17 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Sorting across multiple intersecting surfaces remains approximate; exact
  surface/surface splitting is still deferred.
- Mesh and wireframe policy cleanup remains the next approved slice.
