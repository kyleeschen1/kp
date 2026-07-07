# Generic Depth Occlusion Loop Checkpoint

Date: 2026-07-07
Project: kp
Status: checkpoint

## Summary

Executed the approved generic depth/occlusion loop through a reusable renderer
checkpoint:

- Added projected geometry primitives for points, line segments, triangles, and
  quads.
- Extracted 3D projection and camera-direction math from the SVG renderer.
- Added a generic depth-scene adapter that builds a software depth buffer from
  projected surface triangles.
- Added adaptive projected-line visibility: line segments split when
  endpoint/midpoint visibility disagrees.
- Rewired axes, axis arrows, surface edge outlines, and 3D curve segments to use
  the same depth-scene visibility path.
- Preserved SVG semantic metadata while reducing saddle-specific occlusion code.
- Updated the architecture note with the new geometry/depth/query contract.

## Source Refs

- `src/rendering/geometry.ts`: shared projected geometry primitives and
  quad-to-triangle splitting.
- `src/rendering/projection.ts`: graph-space 3D projection, projected line
  construction, and camera direction.
- `src/rendering/depth-scene.ts`: depth-scene construction and adaptive
  projected-line visibility.
- `src/rendering/depth-buffer.ts`: software z-buffer reused by the depth scene.
- `src/rendering/graph-svg.ts`: SVG renderer now consumes generic projection and
  depth-scene helpers for axes, borders, and 3D curves.
- `tests/geometry.test.ts`: projected geometry helper coverage.
- `tests/projection.test.ts`: projection and camera-direction coverage.
- `tests/depth-scene.test.ts`: depth-scene and adaptive visibility coverage.
- `tests/rendering.test.ts`: SVG metadata and 3D curve depth-classification
  coverage.
- `docs/semantic-editor-first-pass.md`: updated renderer architecture.

## Focused Verification

Passed at checkpoint:

- `node --disable-warning=ExperimentalWarning --test tests/depth-scene.test.ts tests/projection.test.ts tests/geometry.test.ts tests/depth-buffer.test.ts tests/rendering.test.ts`: 26 tests passed, 0 failed.

## Deferred

- Exact line/surface intersection solving remains deferred; current visibility
  uses adaptive subdivision and midpoint classification.
- Exact surface/surface intersection splitting remains deferred.
- WebGL remains deferred; SVG remains the semantic/event layer.
- Wasm acceleration remains deferred until the TypeScript geometry contract has
  stabilized.
- Full implicit equation support remains deferred; this loop works with current
  sampled explicit surfaces and parametric demo curves.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
`package.json` has no `theseus` script, so this approved long-loop checkpoint
was recorded manually under the configured `eventsRoot`.
