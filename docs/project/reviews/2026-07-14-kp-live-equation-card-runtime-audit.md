# KP Live Equation Card Runtime Audit

Date: 2026-07-14
Run contract: `run-contract.kp.animation-library-expansion-v0`
Slice: `next-action.kp.animation-library.live-card-audit-v0`

## Summary

The live equation card already has a deterministic equation-motion sampler, but
the editor controller still owns most runtime behavior directly. The next
implementation slices should not replace the whole card. They should route the
existing card controls through the `AnimationAsset -> runtime frame -> visual
frame -> DOM binding` path while preserving the controller's current measured
KaTeX layout and special-case motif rendering.

## Current Live Path

The user-facing card enters through
`src/editor/equation-motion-demo-controller.ts`.

- `hydrateEquationMotionDemos` initializes active state, duration, and collapse
  controls.
- `stepEquationMotionDemoCard`, keyboard handlers, `setEquationMotionBeat`,
  and `setEquationMotionProgress` own card controls.
- `startEquationMotionAnimation` owns `requestAnimationFrame`, elapsed time,
  pause/resume state, forward/reverse progress, and final active-step state.
- `createDemoEquationMotionTransition` reads the selected catalog entry,
  validates source/target LaTeX, creates an `EquationMotionPlan`, measures DOM
  layout, and applies measured deltas.
- `renderEquationMotionFrame` maps sampled equation-motion frames into DOM
  token styles, motif diagnostics, particles, radical artifact DOM state, and
  scrubber output.

The current semantic/motion split is:

```text
catalog transition
-> EquationMotionPlan
-> EquationMotionSampler / EquationMotionPlayer
-> editor-owned DOM render context
-> token transforms, clone layers, particles, artifact DOM overrides
```

The intended runtime path is:

```text
AnimationAsset
-> KpAnimationRuntimeFrame
-> KpAnimationVisualFrame
-> editor DOM binding for KaTeX tokens, clone layers, and motif renderers
```

## What Is Already Runtime-Ready

- `src/animation/linear-solve-adapter.ts` defines
  `animation.linear-solve.solve-x` with a 50-beat timeline, semantic
  transformations, focus/pause annotations, render targets, checks, export
  targets, and dashboard metadata.
- `src/animation/runtime-sampler.ts` can sample the linear-solve asset into a
  renderer-neutral `KpAnimationRuntimeFrame` with clock, phase, active
  transformations, selector frames, render targets, semantic refs, and
  diagnostics.
- `src/animation/visual-frame-adapter.ts` can pair runtime selector/render
  frames with renderer-specific bindings and report unbound visual selectors.
- `src/rendering/katex-dom-visual-frame-adapter.ts` can create a
  `KpAnimationVisualFrame` from either a live DOM root or a deterministic
  `KatexSnapshot`.
- `tests/kp-animation-visual-frame-scrubber.test.ts` proves that visual frames
  can stay on the same scrubber clock as runtime frames.
- `tests/linear-solve-runtime-visual-frame-sample.test.ts` proves the
  linear-solve sample can bind selector ids to KaTeX token refs without
  ambiguous or unbound diagnostics.

## Remaining DOM-Owned Behavior

The editor controller still owns behavior that should become a view binding or
adapter over sampled runtime/visual frames:

- RAF playback and pause/resume state are managed in
  `startEquationMotionAnimation` and `pauseEquationMotionAnimation`.
- Direction normalization is done in `setEquationMotionProgress` and
  `renderEquationMotionFrame` rather than by a shared runtime clock wrapper.
- DOM layout measurement is done by `measureAnnotatedEquationMotionTokens` and
  `createMeasuredLayoutDeltas`.
- KaTeX internals are hidden and replaced with clone layers in
  `createStableMotionToken` / `createEquationMotionClone`.
- Cancellation particles, final simplify collapse/reveal, and radical artifact
  folding are special-cased in `renderEquationMotionFrame`.
- Diagnostics are currently mostly `data-*` attributes on the card, not a
  unified visual-frame diagnostics panel.

## Implementation Order

1. Add a narrow live-card runtime adapter that samples
   `createLinearSolveAnimationAsset` from the card scrubber/direction state.
   It should emit the same 50-beat clock the card already exposes.
2. Add a live-card KaTeX visual-frame adapter that snapshots the currently
   active equation state and produces selector/render-target bindings for the
   visual diagnostics path.
3. Keep `EquationMotionPlan` and measured deltas for token pose rendering in
   the first implementation. Treat the runtime visual frame as the semantic
   clock/identity source, not yet as a replacement for all token geometry.
4. Move scrubber output, sampled frame ids, active transformations, active
   selectors, and binding diagnostics into card datasets/details so browser
   tests can assert the bridge.
5. After the bridge is stable, progressively route motif-specific rendering
   through visual-frame/motif data: cancellation, artifact fade, final
   simplify, and radical artifact folding.

## Tests To Use Next

- Extend `tests/kp-animation-visual-frame-scrubber.test.ts` or add a focused
  live-card adapter test for beat-to-runtime-frame sampling.
- Extend `tests/linear-solve-runtime-visual-frame-sample.test.ts` to cover
  live-card selector ids and token refs.
- Add a browser assertion to `tests/katex-transition.browser.spec.ts` that the
  card reports runtime frame id, visual frame id, active transformation ids,
  and no unbound visual selectors while scrubbing.
- Keep existing radical artifact browser tests as regressions for DOM-owned
  motion; do not replace that path until the runtime bridge is visible.

## Risk

The highest risk is trying to replace the DOM motion pipeline too early. The
existing card relies on measured KaTeX geometry, clone layers for internal
KaTeX nodes, and special-case motif rendering. The next slices should first
make the semantic clock and identity visible in the live card, then move
geometry and motif rendering behind view-binding seams one piece at a time.
