# 3D Axis and Surface Simplification

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Implemented the approved 3D renderer simplification:

- Removed the projected base grid from the default 3D SVG render.
- Removed the time spiral from the default editor scene while keeping the semantic curve type and renderer available.
- Extended each 3D axis 15% beyond its semantic domain.
- Rendered axis segments at 1.5x the mesh-line stroke width with explicit `data-kp-stroke-ratio="1.5"` metadata.
- Kept x/y axes below the surface layer and z-axis above it, preserving the current SVG-only occlusion cue.
- Changed back-facing saddle cells from yellow to a darker blue-family fill and raised surface opacity so projected overlap does not introduce yellow into the top surface.

## Source Refs

- `src/semantic/graph.ts`: default 3D scene now includes graph, axes, and saddle surface only.
- `src/rendering/graph-svg.ts`: removed base-grid rendering, extended axis domains, fixed axis stroke ratio metadata, and blue-only surface fill hues.
- `src/styles.css`: removed base-grid styling and raised surface quad opacity.
- `tests/rendering.test.ts`: default 3D SVG contract for no grid, no default spiral, extended axes, axis stroke ratio, and blue-only surface hues.
- `tests/compiler.test.ts`: compiled asset markers for absent grid/spiral and present axis/surface markers.
- `tests/editor.test.ts`: initial document object list without the 3D spiral.
- `tests/semantic.test.ts`: default 3D scene object list without the 3D spiral.
- `docs/semantic-editor-first-pass.md`: updated renderer contract and current limits.

## Verification

Passed:

- Focused test run: 34 tests passed, 0 failed.
- `npm test`: 37 tests passed, 0 failed.
- `npm run build`: TypeScript and Vite production build passed.
- Runtime page smoke on `http://127.0.0.1:8000/`: returned 200.
- API health smoke on `http://127.0.0.1:8000/api/health`: returned ok.
- API compile smoke: returned 200, confirmed axis segment/stroke/domain markers and surface quads, and confirmed grid and time spiral markers are absent.

## Theseus CLI Status

`theseus.config.json` is present, but `package.json` still has no `theseus` script. This event was recorded manually under the configured `eventsRoot` from `theseus.config.json`.
