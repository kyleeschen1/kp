# 2026-07-08 WebGL Three geometry

## Slice

- Added a retained Three.js scene builder for the 3D graph WebGL renderer.
- Converted sampled surface quads into indexed triangle geometry.
- Added retained mesh-line `LineSegments` and axis `LineSegments` with WebGL depth testing enabled.
- Kept the builder pure so it can be tested without a browser or WebGL context.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed on the missing `createGraph3DWebGLThreeScene` export.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.

## Notes

- Graph coordinates are mapped into Three as `(x, z, y)` so the graph z-axis is vertical and graph y contributes scene depth.
- The canvas shell still uses the SVG fallback until a browser hydration layer mounts this scene into the canvas.
