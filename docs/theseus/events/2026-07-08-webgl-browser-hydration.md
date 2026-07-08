# 2026-07-08 WebGL browser hydration

## Slice

- Added an orthographic camera derived from the semantic graph camera.
- Hydrated `.graph-webgl` shells into real Three.js `WebGLRenderer` canvas renders in the browser.
- Routed initial render, full editor re-render, and graph-only updates through the hydration path.
- Added renderer disposal for graph-only and full editor DOM replacement.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed on the missing `createGraph3DWebGLCamera` export.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.
- Browser verification: `npx playwright screenshot --full-page --viewport-size=1280,900 http://127.0.0.1:8050/ /private/tmp/kp-webgl-hydration-after-cleanup.png`.

## Notes

- The screenshot shows the WebGL surface rendering visibly inside the existing graph preview shell.
- `npm run build` now emits a chunk-size warning: the bundled app JS is about 854 kB minified, 229 kB gzip, because Three.js is in the primary entry chunk.
