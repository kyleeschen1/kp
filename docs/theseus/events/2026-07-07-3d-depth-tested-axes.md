# 3D Depth-Tested Axes

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Implemented the recommended 3D renderer slice:

- Made saddle surface quads fully opaque in CSS.
- Kept both surface sides in the blue hue family.
- Made back-facing underside cells lighter than the darkest front-facing cells.
- Added projected surface-depth metadata to surface quads.
- Changed surface quad sorting to render far cells before near cells.
- Split axes into hidden and visible SVG layers using sampled mesh-depth tests.
- Rendered hidden axis pieces below the opaque surface and visible axis pieces above it so axes can poke through where they are in front of the mesh.

## Source Refs

- `src/rendering/graph-svg.ts`: prepared projected surface quads, surface depth metadata, far-to-near surface sort, blue-only fill policy, and mesh-depth axis visibility classification.
- `src/styles.css`: fully opaque surface quads.
- `tests/rendering.test.ts`: coverage for opaque surface CSS, lighter blue underside, surface depth order, and hidden/visible axis layers.
- `docs/semantic-editor-first-pass.md`: updated the SVG renderer contract.

## Verification

Passed:

- Focused rendering tests: 12 tests passed, 0 failed.
- `npm test`: 38 tests passed, 0 failed.
- `npm run build`: TypeScript and Vite production build passed.
- Runtime page smoke on `http://127.0.0.1:8000/`: returned 200.
- API health smoke on `http://127.0.0.1:8000/api/health`: returned ok.
- API compile smoke: returned 200, confirmed hidden/visible axis layer markers, hidden/visible axis segment markers, surface-depth markers, and absence of grid/spiral markers.

## Theseus CLI Status

`theseus.config.json` is present. `npm run theseus -- project-state --limit 5` failed because `package.json` has no `theseus` script. This event was recorded manually under the configured `eventsRoot` from `theseus.config.json`.
