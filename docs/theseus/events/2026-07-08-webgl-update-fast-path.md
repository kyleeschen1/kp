# 2026-07-08 WebGL update fast path

## Slice

- Added a shell reuse policy for ready WebGL canvases.
- Updated graph preview refreshes to rehydrate an existing ready WebGL shell instead of replacing the whole shell and regenerating the SVG fallback.
- Preserved full shell replacement for pending/fallback states so non-WebGL fallback behavior remains coherent.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed because `canReuseGraph3DWebGLShell` did not exist.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.
- Browser smoke: `npx playwright screenshot --full-page --viewport-size=1280,900 '--wait-for-selector=.graph-webgl[data-kp-webgl-status="ready"]' http://127.0.0.1:8050/ /private/tmp/kp-webgl-fastpath-smoke.png`.

## Notes

- This avoids the old live-update path that rebuilt the SVG fallback string on every ready-canvas graph update.
