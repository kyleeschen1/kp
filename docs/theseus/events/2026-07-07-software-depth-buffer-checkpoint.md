# Software Depth Buffer Checkpoint

Date: 2026-07-07
Project: kp
Status: checkpoint

## Summary

Executed the approved depth-buffer loop through the first reusable SVG
occlusion checkpoint:

- Added a dependency-free `DepthBuffer` backed by `Float32Array`.
- Added barycentric projected-triangle depth interpolation.
- Added triangle rasterization with the current convention that larger depth is
  nearer to the camera.
- Split projected surface quads into depth triangles before SVG emission.
- Rewired 3D axis segments, axis arrows, and surface edge outlines to classify
  visibility against the same sampled surface depth buffer.
- Added explicit SVG metadata for the depth buffer and visibility source.
- Updated the architecture note with the SVG/software-buffer boundary and known
  approximation limits.

## Source Refs

- `src/rendering/depth-buffer.ts`: software z-buffer, triangle interpolation,
  rasterization, and point visibility checks.
- `src/rendering/graph-svg.ts`: depth-buffer construction from surface quads
  and shared axis/edge visibility classification.
- `tests/depth-buffer.test.ts`: focused coverage for interpolation,
  rasterization, and visibility epsilon behavior.
- `tests/rendering.test.ts`: semantic SVG assertions for depth-buffer metadata
  and visibility provenance.
- `docs/semantic-editor-first-pass.md`: current renderer architecture and
  software depth-buffer tradeoffs.

## Verification

Passed at checkpoint:

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts tests/depth-buffer.test.ts`: 17 tests passed, 0 failed.

## Deferred

- Exact curve/surface intersection splitting remains deferred; current
  visibility is midpoint sampled.
- Exact polygon clipping for axis and edge outlines remains deferred.
- Depth-buffered 3D curves remain deferred because the default scene currently
  omits the spiral while surface/axis behavior is being refined.
- WebGL remains deferred; this checkpoint keeps SVG semantics while borrowing a
  small software z-buffer for occlusion.
- Wasm acceleration remains deferred until the TypeScript geometry semantics are
  stable enough to move bulk kernels behind typed-array boundaries.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
`package.json` has no `theseus` script, so this approved long-loop checkpoint
was recorded manually under the configured `eventsRoot`.
