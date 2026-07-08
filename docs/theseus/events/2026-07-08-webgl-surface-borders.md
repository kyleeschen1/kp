# 2026-07-08 WebGL surface borders

## Slice

- Added a `drawBorder` flag to WebGL surface models.
- Built retained cylinder border geometry along the perimeter of bordered surface grids.
- Kept donut unbordered and added borders for mesh and hyperplane surfaces.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts` failed because `surfaceBorderObjects` did not exist.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.
- Browser verification: `npx playwright screenshot --full-page --viewport-size=1280,900 '--wait-for-selector=.graph-webgl[data-kp-webgl-status="ready"]' http://127.0.0.1:8050/ /private/tmp/kp-webgl-surface-border.png`.

## Notes

- The primary app chunk remains about 335 kB minified, 99 kB gzip; the async WebGL chunk is about 524 kB minified, 132 kB gzip.
