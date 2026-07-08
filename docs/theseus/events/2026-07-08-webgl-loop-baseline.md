# WebGL Migration Loop Baseline

Date: 2026-07-08
Project: kp
Status: baseline

## Summary

Opened the approved WebGL migration long loop from the current SVG 3D renderer
state. The Theseus CLI is still unavailable through `npm run theseus` because
`package.json` has no `theseus` script, so this loop will continue using manual
event records under `docs/theseus/events`.

The baseline keeps the current SVG renderer as the fallback/reference path
before introducing a retained WebGL renderer. Current dirty source state includes
recent 3D graph work:

- folded render controls with z rotation visible;
- surface mode switching between mesh, donut, and intersecting hyperplanes;
- higher-resolution visibility splitting for axes, mesh, borders, and curves;
- muted arrow/axis occlusion metadata;
- mesh-line rendering without the old thick grid layer;
- compound Bezier border batching.

## Baseline Render Metrics

Measured with 50 warm Node render-string runs of the default 3D graph:

- mean: 18.85 ms
- median: 17.88 ms
- p90: 20.88 ms
- p95: 23 ms
- max: 30.64 ms
- SVG size: 761,935 bytes
- paths: 309
- polygons: 1,073
- edge paths: 1
- mesh paths: 308
- axis segment polygons: 779

## Source Refs

- `src/rendering/graph-svg.ts`: SVG 3D fallback/reference renderer.
- `src/editor/editor.ts`: graph controls and preview HTML.
- `src/editor/state.ts`: graph render setting updates.
- `src/main.ts`: editor event wiring and preview replacement.
- `src/semantic/graph.ts`: graph surface mode semantics.
- `src/styles.css`: current SVG graph styling.
- `tests/rendering.test.ts`: SVG renderer contract coverage.
- `tests/editor.test.ts`: editor controls coverage.
- `tests/semantic.test.ts`: graph semantic defaults and validation coverage.

## Deferred

- WebGL renderer implementation starts after this baseline commit.
- Removing the SVG renderer is explicitly deferred; SVG remains fallback and
  regression reference.
- WASM math acceleration remains deferred until the WebGL depth/rendering model
  is established.
