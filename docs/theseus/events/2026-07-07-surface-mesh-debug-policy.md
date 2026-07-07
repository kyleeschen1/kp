# Surface Mesh Debug Policy

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved mesh/grid policy cleanup:

- Added `debug.surfaceMesh` to `Graph3DDebugSettings`.
- Defaulted surface mesh rendering to off for every created 3D graph.
- Emitted `data-kp-debug-surface-mesh` on 3D SVG roots.
- Rendered the surface wireframe only when `debug.surfaceMesh` is true.
- Tagged explicit wireframe output with `data-kp-surface-mesh="debug"`.

This keeps the default saddle graph visually quieter while preserving a semantic
debug path for mesh inspection.

## Source Refs

- `src/semantic/graph.ts`: new debug mesh flag and default.
- `src/rendering/graph-svg.ts`: gated wireframe rendering and root metadata.
- `tests/semantic.test.ts`: default and explicit debug flag coverage.
- `tests/rendering.test.ts`: default no-wireframe and explicit mesh coverage.
- `tests/projection.test.ts`: updated direct graph fixture.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts tests/rendering.test.ts tests/projection.test.ts`: 38 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Editor controls for debug mesh remain deferred.
- Exact graph-space line/surface intersections are the next geometry slice.
