# Depth Diagnostics Contract

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved depth diagnostics slice:

- Added a typed `DepthSceneDiagnostics` contract.
- Added `depthSceneDiagnostics(scene)` as the shared depth metadata boundary.
- Moved 3D SVG root depth metadata to that shared diagnostics object.
- Added `data-kp-depth-cell-count` so renderer output exposes the buffer size
  being sampled.

## Source Refs

- `src/rendering/depth-scene.ts`: typed diagnostics contract and extractor.
- `src/rendering/graph-svg.ts`: SVG metadata now uses the diagnostics contract.
- `tests/depth-scene.test.ts`: diagnostics coverage.
- `tests/rendering.test.ts`: SVG depth-cell metadata coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/depth-scene.test.ts tests/rendering.test.ts`: 25 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Debug overlay rendering remains the next slice.
- Theseus `validate` remains unavailable because `package.json` has no
  `theseus` script.
