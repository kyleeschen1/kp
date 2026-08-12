# Scheme factorial full-evaluation checkpoint

Status: `HUMAN_CHECKPOINT`

## Review surface

- Route: `/tutorials/programming/scheme-factorial/`
- Alternate detailed trace: `/tutorials/programming/scheme-factorial/?view=full`
- Canonical reference: the approved first procedure activation, extended without changing its source/runtime identity rules.

## What is now observable

- One persistent expression begins as `(factorial 3)` and settles as `6`.
- Each active call opens into one fresh lambda body; prior multiplication shells wait visibly.
- The argument binds to a fresh activation and projects into that activation's three `n` occurrences.
- False branches close before the decrement becomes the next recursive argument.
- The zero activation selects and returns the base value `1`.
- Products resolve deepest-first as `(* 1 1)`, `(* 2 1)`, and `(* 3 2)`.
- Desktop and compact layouts keep readable fixed-size type; compact layout stacks waiting shells instead of scaling the code.

## Preserved boundaries

- Parser, evaluator, frozen trace, and legacy detailed trace are unchanged.
- The learner receives a compact direct-seek score, not evaluator snapshots or machine continuations.
- One framework-neutral sampler and one deterministic playback clock own the focus route.
- Native code material remains the sole paint owner; no particle or diagram surrogate was added.
- Reduced motion seeks to settled semantic states.

## Human review questions

1. Does opening each lambda clarify recursive activation, or is the repeated body still too visually dense?
2. Do the waiting multiplication shells make the eventual return path obvious?
3. Is the 30-second default duration patient enough, especially around binding and the base case?
4. Does vertical nesting on a phone preserve the expression's structure?

Do not promote this compiler or choreography to other Scheme programs until this checkpoint is approved and one structurally different caller validates the seam.
