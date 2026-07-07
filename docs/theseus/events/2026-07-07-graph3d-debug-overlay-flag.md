# Graph3D Debug Overlay Flag

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved semantic debug-overlay slice:

- Added `Graph3DDebugSettings` with a `depthOverlay` flag.
- Defaulted every created `Graph3DObject` to `debug.depthOverlay = false`.
- Preserved explicit graph debug settings through `createGraph3DObject`.
- Exposed the current flag on 3D SVG roots with
  `data-kp-debug-depth-overlay`.
- Kept the renderer behavior as a no-op for now: enabling the semantic flag does
  not yet draw a visible overlay.

## Source Refs

- `src/semantic/graph.ts`: graph debug settings type and constructor default.
- `src/rendering/graph-svg.ts`: SVG debug-depth metadata.
- `tests/semantic.test.ts`: semantic default and explicit opt-in coverage.
- `tests/rendering.test.ts`: SVG metadata and no-visible-overlay coverage.
- `tests/projection.test.ts`: updated direct graph fixture.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts tests/rendering.test.ts tests/projection.test.ts`: 37 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Drawing the actual depth debug overlay is the next slice.
- Editor controls for toggling debug overlays are deferred until the renderer
  overlay exists.
