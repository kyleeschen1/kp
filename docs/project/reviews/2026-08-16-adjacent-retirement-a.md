# Adjacent retirement A: saddle tween prototype

Exact import reachability showed that `src/animation/tween.ts` had no source or
script caller. Its only caller was `tests/tween.test.ts`, the test created with
the original JavaScript tween prototype.

The retired module precomputed numeric frames and then delegated to
`sampleSaddleSurfaceMorph`. The live renderer already calls that canonical
morph sampler directly. The deletion therefore removes a test-only execution
prototype rather than a renderer, clock, semantic operation, or public API.

The preservation boundary is explicit:

- `SaddleDenominatorAnimationIntent` remains in `src/semantic/animation.ts`;
- semantic document support and validation remain intact;
- saddle geometry and `sampleSaddleSurfaceMorph` remain intact;
- the editor saddle control and SVG/3D rendering paths remain intact;
- the compatibility ledger now cites the semantic document consumer and the
  semantic fixture test instead of the deleted prototype.

The independently reversible rollback unit is the deleted tween module and its
single test plus the compatibility-ledger reference update. No visual timing,
geometry, or product behavior changed.
