# Typography handoff model comparison

Date: 2026-07-25
Status: selected for fraction exemplar implementation
Run contract: `run-contract.kp.canonical-equation-renderer-convergence-v1`
Slice: 06

## Decision

Select **target-style reverse FLIP** for the bounded fraction exemplar.

This is a renderer-session model, not a new animation representation. It uses
the already measured target paint as the clone's visual source and applies
inverse geometry so the clone can retain its current pose before converging to
the exact native target. It does not mutate native DOM, interpolate font
metrics, add a lifecycle, or inspect notation identity.

If the pure handoff law reports unsupported paint, the selected fallback
remains exact native-checkpoint settlement.

## Recorded endpoint evidence

The stable visual command captured seven dense frames from 96 through 100
percent for each profile. Only one correlated paint atom has a typography
fingerprint mismatch. Its differing properties are `font-size` and
`line-height`; paint, family, weight, style, color, clip, revision, and
baseline kind agree.

| Profile | Dense frames | Max x residual | Max baseline residual | Max width residual | Max height residual |
|---|---:|---:|---:|---:|---:|
| Wide | 7 | 0.086 px | 1.628 px | 0.079 px | 0.094 px |
| Phone | 7 | 0.040 px | 1.151 px | 0.047 px | 0.079 px |

All fourteen frames pass the generic law with a 2 px translation bound, 1.1
maximum symmetric scale ratio, and 0.1 px exact-style tolerance.

## Candidate comparison

| Candidate | Eligible on all 14 frames | Endpoint guarantee | Live style interpolation | Native mutation | Disposition |
|---|---|---|---|---:|---|
| Target-style reverse FLIP | Yes | Exact target paint and zero modeled endpoint residual | No | 0 | Selected |
| Bounded dual-endpoint interpolation | Yes | Residual bounded by tolerance, but browser font paint is not certified exact | Yes | 0 | Retained only as comparison evidence |
| Native-checkpoint settlement | Always | Exact at the checkpoint; measured residual remains visible immediately before it | No | 0 | Required fallback |

The first model wins because it is the only continuous candidate that combines
exact target paint with geometry-only transit. The next slice may compile this
decision into immutable renderer-session data; it may not add DOM, CSS,
geometry, or style state to durable animation artifacts.

## Verification

- `npm run test:real-katex-glyph-compositor`
- `npm run test:canonical-equation-renderer`
- `npm run typecheck`
- `npm run visual:glyph-reconciliation-experiment`

The focused suite includes deterministic permutation checks, unsupported
fallback selection, immutable candidate records, and a 5,000-evaluation
microcheck with a two-second ceiling.
