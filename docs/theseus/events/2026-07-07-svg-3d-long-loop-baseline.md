# SVG 3D Long Loop Baseline

Date: 2026-07-07
Project: kp
Status: checkpoint

## Summary

Started the approved SVG 3D renderer long loop from the existing dirty
editor/math/rendering checkpoint. This baseline preserves the current semantic
editor state before the next debug and geometry slices:

- Semantic matrix, 2D graph, 3D graph, equation-entry, and compile flows exist.
- LaTeX equation input lowers a narrow explicit equation subset into semantic
  graph scenes.
- Mathematical expressions support LaTeX rendering, numeric evaluation,
  symbolic differentiation, and compiled gradients.
- The 3D SVG renderer projects opaque saddle surface quads, depth-tests
  line-like objects through a software depth scene, and exposes depth metadata.
- The editor exposes z-rotation and occluded-axis lightness controls.

## Verification

Passed at baseline:

- `npm test`: 82 tests passed, 0 failed.
- `npm run build`: TypeScript checks and Vite production build passed.
- `git diff --check`: clean.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
`package.json` still has no `theseus` script, so this approved long-loop run is
being recorded manually under the configured `eventsRoot`.

## Next Slice

Add a typed depth diagnostics contract shared by the depth scene and SVG
metadata.
