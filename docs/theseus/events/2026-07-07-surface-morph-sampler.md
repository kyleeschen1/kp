# Surface Morph Sampler

Recorded: 2026-07-07

Added `sampleSaddleSurfaceMorph`, a renderer-side helper that interpolates a
parameterized saddle denominator and samples the resulting surface grid for that
animation frame.

This is deliberately separate from editor state mutation: animation can compute
intermediate grids without rewriting semantic JSON for every frame. The final
semantic object can still be updated through the denominator slider/state path.

Verification:
- Red test first: missing `sampleSaddleSurfaceMorph` export.
- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
- `npm run typecheck`
- `git diff --check`
