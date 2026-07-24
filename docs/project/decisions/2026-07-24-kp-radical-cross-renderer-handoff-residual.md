# Retain the radical WebGL morph with a scoped handoff residual

Date: 2026-07-24
Status: accepted with known visual residual; not promoted as a family law

## Decision

Keep the current WebGL-assisted `1/2 -> √` animation rather than replacing it
with the less expressive KaTeX-only version. Human review finds the remaining
initial fraction jerk small enough to retain, but still clearly visible when
attention is directed to it.

The result is accepted as the current exemplar version, not as proof that
DOM-to-WebGL notation handoffs are perceptually continuous. The residual must
remain named in future audits and must not widen continuity tolerances, weaken
single-owner laws, or become an implicit template for other radical animations.

Exact current scope:

- editor animation:
  `editor-animation.sample.animation.radical-rewrite.square-root-as-power`;
- animation asset:
  `animation.generated.radical.square-root-as-power`;
- presentation seam: live DOM/KaTeX fractional exponent to the WebGL
  solid-mask morph near semantic progress `0.06`;
- visible symptom: `1/2` appears to change weight and/or jump vertically at the
  beginning of the morph.

## Why this does not automatically affect other roots

The semantic `rewritePowerAsRoot` choreography is reusable and already models
optional root indices, so cube-root and other indexed-root assets can reuse its
identity and correspondence semantics.

The WebGL material path is not currently generic. `applyEquationMaterialLayer`
selects `applyRadicalMaterialLayer` only for
`animation.generated.radical.square-root-as-power`. A new root animation will
not inherit this DOM/WebGL handoff unless implementation explicitly opts it in.

The transferable risk is therefore conceptual rather than active: any future
root animation that switches stacked KaTeX fraction ink to a separately
rasterized canvas/WebGL owner may reproduce the seam. DOM-owned roots and
animations that remain within one rasterization pipeline do not inherit it.

## Deeper diagnosis retained

The investigation separated four effects:

1. The original zero-residual diagnostic compared atlas-derived observations
   and did not measure the final composited browser pixels.
2. Flat focus styling added a growing one-pixel outline to the live KaTeX
   numerator, fraction rule, and denominator. The WebGL atlas contained
   unadorned glyphs, so the outline disappeared at ownership transfer and
   looked like a brief weight change.
3. Removing focus geometry from this material boundary removed that known
   contributor, but did not remove the human-visible jerk.
4. DOM/SVG/KaTeX capture and WebGL/canvas compositing still rasterize the same
   fraction differently. Bounds, darkness, and centroid metrics can be made
   numerically smooth while normal-speed human playback still exposes the
   transition. Automated pixel bounds are useful diagnostics but are not a
   sufficient perceptual acceptance gate.

The stable pixel tracer is `npm run visual:radical-handoff`; its DPR2 companion
is `npm run visual:radical-handoff:dpr2`. Disposable traces are written below
`tmp/codex/`.

## Existing work and resumable commit trail

- `0f30613f`: measure actual WebGL source ink;
- `c47c5be5`: gate handoffs on rendered ink;
- `6dcdae3c`: preserve source ink through atlas rendering;
- `8b02d102`: reconcile measured owners and discrete settlement;
- `7313c5ba`: harden seek, fallback, resize, and font lifecycle behavior;
- `ac93851c`: repair rewind atlas capture;
- `fd839edf`: preserve the native fraction raster;
- `fcea355f`: test and adjust fraction ink weight;
- `e0546c55`: add the final-compositor pixel trace;
- `96b20271`: remove focus geometry at the seam and smooth source ownership.

The corresponding tests and Theseus verification records remain durable. Do
not discard this instrumentation when the visual residual is revisited.

## Guardrails for future root animations

1. Do not generalize the animation-ID branch, radical endpoint corrections, or
   source crossfade from this exemplar without a second root exemplar.
2. Treat the current radical as a known-residual fixture in promotion audits,
   not a passing example of cross-renderer equivalence.
3. Test a future indexed root separately. Its root index, hook, overbar,
   radicand, and source fractional exponent add geometry that the square-root
   exemplar does not cover.
4. Require normal-speed forward and rewind human review at DPR1 and DPR2.
   Bounds-only and atlas-only comparisons cannot approve the seam.
5. Preserve semantic identity, correspondence, seek, rewind, and native
   endpoints while investigating presentation. Do not push renderer correction
   into the semantic model.

## Revisit triggers and next hypotheses

Reopen this investigation when a second root animation needs the WebGL morph,
when the radical becomes learner-facing gold, or when font/browser changes make
the residual more visible.

Start from final composited video frames rather than another box-only metric.
The leading architectural hypotheses are:

- keep the source and target notation in one rasterization pipeline throughout
  the morph;
- delay the renderer boundary until the source fraction is no longer
  perceptually inspected;
- render both endpoint owners from the same captured atlas and composite them
  on the same pixel grid;
- replace centroid/bounds acceptance with a short temporal perceptual metric
  calibrated against human review.

The older DOM-owned radical decision remains valid evidence that a single
renderer avoids the ownership seam, but it is not the selected product version
for this exemplar.
