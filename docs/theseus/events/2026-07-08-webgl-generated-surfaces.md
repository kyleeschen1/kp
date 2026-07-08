# 2026-07-08 WebGL generated surfaces

## Slice

- Added WebGL scene-model support for generated donut and hyperplane surface modes.
- Reused the SVG renderer's sampled torus and hyperplane grids so both renderers share topology for those modes.
- Covered the generated modes with retained-geometry assertions for surface counts, grid sizes, quad counts, and Three drawables.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed because donut mode produced zero WebGL surfaces.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.

## Notes

- `npm run build` still emits the existing Three.js chunk-size warning from the browser hydration slice.
