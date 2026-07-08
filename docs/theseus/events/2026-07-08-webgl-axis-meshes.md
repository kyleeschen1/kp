# 2026-07-08 WebGL axis meshes

## Slice

- Replaced WebGL axis `LineSegments` with retained 3D axis groups.
- Each axis now has a graph-background halo shaft, halo arrowheads, foreground shaft, and foreground arrowheads.
- Halo meshes depth-test but do not depth-write, so the surface can occlude them without the halo hiding the foreground axis.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed because `axisObjects` did not exist.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.
- Browser verification: `npx playwright screenshot --full-page --viewport-size=1280,900 '--wait-for-selector=.graph-webgl[data-kp-webgl-status="ready"]' http://127.0.0.1:8050/ /private/tmp/kp-webgl-axis-meshes-depthwrite.png`.

## Notes

- The async WebGL chunk is about 523 kB minified, 131 kB gzip after adding axis meshes.
