# 2026-07-08 WebGL client split

## Slice

- Split the Three.js/WebGL implementation into `graph-webgl-three.ts`.
- Kept `graph-webgl.ts` as the synchronous shell and semantic scene-model boundary with no direct Three.js import.
- Loaded the WebGL client dynamically from `main.ts`, keeping the SVG fallback visible until the async chunk marks the shell ready.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed because `graph-webgl-three.ts` did not exist.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.
- Browser verification: `npx playwright screenshot --full-page --viewport-size=1280,900 '--wait-for-selector=.graph-webgl[data-kp-webgl-status="ready"]' http://127.0.0.1:8050/ /private/tmp/kp-webgl-dynamic-ready.png`.

## Build Impact

- Before split: primary app JS was about 854 kB minified, 229 kB gzip.
- After split: primary app JS is about 335 kB minified, 99 kB gzip; async WebGL client chunk is about 520 kB minified, 130 kB gzip.
- Vite still reports a chunk-size warning because the async WebGL chunk is just over 500 kB.
