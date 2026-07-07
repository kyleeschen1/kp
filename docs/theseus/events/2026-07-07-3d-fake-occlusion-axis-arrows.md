# 3D Fake Occlusion Axis Arrows

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Implemented the recommended fake-occlusion axis treatment:

- Kept mesh-depth classification for hidden and visible axis segments.
- Rendered surface cells first, then muted hidden axis annotations, then strong visible axis segments.
- Changed 3D axis stroke ratio from 1.5x to 2x mesh width.
- Added explicit `data-kp-occlusion-treatment="muted"` and `"strong"` markers.
- Added positive-end SVG arrow markers for axes.
- Scaled arrow marker size from depth weight so farther endpoints shrink.
- Preserved fully opaque surface quads and blue-only surface fills.

## Source Refs

- `src/rendering/graph-svg.ts`: fake occlusion layer order, muted/strong axis treatment, 2x stroke ratio, depth-scaled arrow markers.
- `tests/rendering.test.ts`: coverage for 2x stroke ratio, muted/strong markers, surface-first axis ordering, and depth-scaled arrow markers.
- `docs/semantic-editor-first-pass.md`: updated 3D renderer contract.

## Verification

Passed:

- Focused rendering tests: 12 tests passed, 0 failed.
- `npm test`: 38 tests passed, 0 failed.
- `npm run build`: TypeScript and Vite production build passed.
- Runtime page smoke on `http://127.0.0.1:8000/`: returned 200.
- API health smoke on `http://127.0.0.1:8000/api/health`: returned ok.
- API compile smoke: returned 200, confirmed hidden/visible axis layers, muted/strong occlusion treatments, `data-kp-stroke-ratio="2"`, positive-end arrow markers, and absence of old 1.5 stroke ratio, grid, and time spiral markers.

## Theseus CLI Status

`theseus.config.json` is present. `npm run theseus -- project-state --limit 5` failed because `package.json` has no `theseus` script. This event was recorded manually under the configured `eventsRoot` from `theseus.config.json`.
