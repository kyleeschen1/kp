# Sampled Equation Payload Ownership

Date: 2026-08-13
Verdict: canonical payload already neutral; retain legacy SDK sampler in rendering

## Finding

The recorded ownership debt conflated two representations:

- `KpEquationSampledFramePayload` is the canonical closed, serializable domain
  payload. It is owned in `src/animation/sampled-frame-payload.ts` and attached
  to the one sampled envelope by `src/animation/equation-sampled-frame-adapter.ts`.
- `EquationMotionFrame` is the older public equation SDK's live rendering
  sample. Its token poses are defined by `EquationMotionPlan`, and its visual
  motifs come from renderer-owned motion-plan and motif-timeline modules.

Moving only `equation-motion-sampler.ts` would make neutral animation code
import renderer-owned plans. Moving its plan, timeline, player, public SDK, and
editor/tutorial callers together would be a package reorganization rather than
a payload-ownership repair.

## Disposition

The compiler inventory now classifies only the three closed sampled payloads
as the domain-payload stage. `EquationMotionFrame` remains explicitly in the
renderer-adapter compatibility pipeline. No production file moves, public API
changes, or new representations are necessary.

This is a justified retention, not hidden debt: new semantic animation work
must use `KpSampledFrameEnvelope` plus a closed domain payload. The old SDK
frame can be retired only beside its public consumers, not by renaming its
directory.

## Evidence

- `tests/sampled-frame-payload.test.ts`
- `tests/equation-sampled-frame-adapter.test.ts`
- `tests/equation-motion-sampler.test.ts`
- `tests/semantic-animation-compiler-stages.test.ts`
- `tests/semantic-animation-layer-ownership.test.ts`
