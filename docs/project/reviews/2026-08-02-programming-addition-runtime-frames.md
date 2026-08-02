# Programming addition runtime frames

Date: 2026-08-02  
Status: deterministic semantic projection complete; native paint remains s28

## Result

`kp.programming-addition-runtime-frame.v1` now projects the existing
`KpAnimationRuntimeFrame` and verified addition fixture into one complete
programming frame. It carries the exact SourceFile revision and lines, active
source-range provenance, trace step, stack, locals, output, transformation
identity, shared-clock control state, reduced/static mode, and a deterministic
accessible description.

No code is evaluated. The trace fixture remains state authority, while the
generic animation runtime contributes only normalized progress and direction.
This matters because programming-step thresholds are supplied by the verified
trace; an equal-width generic transformation phase must not invent a different
current stack or local state.

## Deterministic states

| Progress | Step | Source focus | Stack | Locals | Output |
| ---: | --- | --- | --- | --- | --- |
| `0` | call | function signature | `add` | `a=2`, `b=2` | — |
| `1/3` | evaluate | `return a + b;` | `add` | `a=2`, `b=2` | — |
| `2/3` | return | `return a + b;` | `add` | `a=2`, `b=2`, `return=4` | — |
| `1` | output | none | empty | empty | `4` |

Direct sampling is deterministic across 129 points. Rewind mirrors the
timeline progress before sampling so it reproduces identical absolute source,
stack, local, output, transformation, and accessible state. Reduced motion
retains the same step progress but snaps the presentation-only emphasis
channel; it does not change semantic state. Static output is the exact settled
frame with output `4` and complete control state.

## Verification and next boundary

The focused runtime tests cover the four checkpoints, 65 explicit mirrored
seek pairs, dense law sampling, repeated determinism, provenance closure,
reduced motion, static output, and accessible descriptions. Existing trace,
asset, and contract tests remain unchanged.

Slice `s28` may consume this frame through the exact lazy programming adapter
defined by the exemplar contract. It may format and emphasize these values;
it may not execute source, add inferred state, introduce a second clock, or
generalize to BFS.
