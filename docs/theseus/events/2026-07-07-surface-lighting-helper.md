# Surface Lighting Helper

Recorded: 2026-07-07

Extracted the surface-cell fill calculation into
`src/rendering/surface-lighting.ts`. The helper preserves the existing
ambient/diffuse/depth-haze output while making lighting math testable outside
the large SVG renderer.

TDD evidence:
- Red: `tests/surface-lighting.test.ts` failed because
  `src/rendering/surface-lighting.ts` did not exist.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/surface-lighting.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `npm run typecheck`
  - `git diff --check`
