# JS Tween Prototype

Recorded: 2026-07-07

Added a dependency-free tween prototype:

- `createNumberTweenFrames` samples bounded numeric frames with `linear` or
  `ease-in-out` easing.
- `sampleSaddleDenominatorAnimationFrames` turns a saddle denominator animation
  intent into sampled surface grids using the morph sampler.

This is deterministic frame generation, not live playback yet. A future runtime
can drive the same frame math from `requestAnimationFrame` and then update the
SVG scene.

Verification:
- Red test first: missing `src/animation/tween.ts`.
- `node --disable-warning=ExperimentalWarning --test tests/tween.test.ts`
- `npm run typecheck`
- `git diff --check`
