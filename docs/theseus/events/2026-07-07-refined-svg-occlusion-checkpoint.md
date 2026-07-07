# Refined SVG Occlusion Checkpoint

Date: 2026-07-07
Project: kp
Status: checkpoint

## Summary

Executed the approved exact-SVG-occlusion loop through the next renderer
checkpoint:

- Confirmed the Theseus CLI is still unavailable through `npm run theseus`.
- Added projected point interpolation and projected line splitting helpers.
- Added signed depth-delta queries for projected points.
- Added binary-search refinement for visibility boundaries when a line crosses a
  surface depth.
- Updated projected-line segmentation to prefer refined depth boundaries, while
  retaining recursive subdivision for pass-through cases.
- Added deterministic segment-budget fallback behavior.
- Added projected triangle overlap detection.
- Added depth-surface overlap detection across grouped projected surface
  triangles.
- Exposed depth surface count, depth triangle count, and overlap count as 3D SVG
  metadata.
- Updated the architecture note with refined boundary and overlap metadata
  behavior.

## Source Refs

- `src/rendering/geometry.ts`: projected interpolation, line splitting, and
  triangle overlap helpers.
- `src/rendering/depth-scene.ts`: signed depth-delta queries, refined visibility
  boundaries, segment budgets, and grouped surface overlap detection.
- `src/rendering/graph-svg.ts`: grouped surface depth-scene construction and
  root SVG depth metadata.
- `tests/geometry.test.ts`: interpolation, line split, and triangle overlap
  coverage.
- `tests/depth-scene.test.ts`: signed depth, refined boundary, budget, and
  overlap coverage.
- `tests/rendering.test.ts`: multi-surface depth-scene metadata coverage.
- `docs/semantic-editor-first-pass.md`: updated renderer architecture.

## Focused Verification

Passed at checkpoint:

- `node --disable-warning=ExperimentalWarning --test tests/geometry.test.ts tests/depth-scene.test.ts tests/depth-buffer.test.ts tests/projection.test.ts tests/rendering.test.ts`: 35 tests passed, 0 failed.

## Deferred

- Exact graph-space line/surface intersection solving remains deferred.
- Exact surface/surface splitting remains deferred; current work records
  projected overlap metadata only.
- A visual debug overlay remains deferred; current debug surface is SVG
  metadata.
- WebGL and Wasm acceleration remain deferred until SVG geometry semantics are
  stable.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
`package.json` has no `theseus` script, so this approved long-loop checkpoint
was recorded manually under the configured `eventsRoot`.
