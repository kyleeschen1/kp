# R1 live planner and repair trial

Date: 2026-09-07
Authority: `2026-09-07-authoring-round-trip-long-loop-proposal.md`, s23–s24.
Execution authority: `run-contract.kp.authoring-round-trip-v1`.

## Initial actual model run

Command: `npm run benchmark:equation-series:live -- --model gpt-5.6-sol --repetitions 1 --check`.
The existing CLI reported ChatGPT authentication; no credentials, account,
provider, or spending configuration was changed. This is a captured live run,
not a fixture or replay. Model and prompt are bounded by the existing harness.

- Six case-runs; four passed the stored expectations, two failed; command exit 1.
- Prompt fingerprint: `fnv1a64:3a376e1b3af1c26a`.
- Raw-response fingerprint: `fnv1a64:76b2e6b0facca0b3`.
- All six adjacency identities preserved; three cases returned typed repair guidance.
- Zero authority attempts, compiled-selection mismatches, silent fallbacks,
  or provider errors.
- The 19 offline schema/planner/benchmark checks passed, demonstrating that
  fixture agreement alone did not catch stale benchmark expectations.

The log-solving expectation still named `kp.algebra.lower-exponent`, whose
current discovery meaning is lowering an exponent by one factor. The actual
model selected `kp.algebra.extract-log-power-exponent`, matching both
`src/semantic/equation-law-operation-pack.ts` and the existing log-exponent
migration. Fraction equivalence was still labeled unsupported, despite the
registered `kp.algebra.scale-fraction-equivalently` operation and its existing
governed authoring adapter. The model proposed it; compilation correctly
required source evidence. Do not change semantic checks to satisfy stale labels.

The next approved slice repairs these evaluation expectations, preserves the
initial failure as provenance, adds a genuinely unsupported deduction, and
performs a fresh live run. Changing the prompt/corpus invalidates comparison
to the old fingerprint; replay cannot count as new live evidence.

## Fresh run after bounded evaluation repair

The same command/model/access ran a fresh seven-case corpus, not a replay.
The existing registered fraction operation remains covered as a governance
repair; `ln(x*y) → ln(x)*ln(y)` is the new genuinely invalid held-out deduction.
The response schema now derives result count from the actual corpus.

- Seven of seven case-runs passed; exit 0.
- Prompt fingerprint: `fnv1a64:7a93c124158f0234`.
- Raw-response fingerprint: `fnv1a64:2eb2ab2404d6eb2e`.
- All six positive cases selected exact operations and preserved adjacency IDs.
- Three compiled directly; three correctly required governed-source evidence.
- The false identity was explicitly declined, with repair/abstention guidance
  present for all four noncompiled cases.
- Zero authority attempts, compiled-selection mismatches, silent fallbacks,
  or provider errors. This is one repetition, not a stability estimate.
- Twenty offline benchmark/schema/planner checks and full types pass.

Separately, the 50-test authoring round-trip suite passes. Held-out numeric
drafts `(base, argument) = (8,64), (0.5,16), (3,27)` compile without author-written
proof pins, retain exact narration, and preserve their active candidate when
the target quotient is inverted. This is compiler evidence, not a new visual
mechanism certification or an LLM repair-response measurement.

## Limits

This measures constrained operation proposals followed by compiler diagnostics.
It does not measure free-form lesson generation, a model responding to a second
round of repair feedback, or pedagogical quality. The browser/numeric draft and
publication tests provide separate deterministic integration evidence. No new
family, renderer, or motion authority is introduced by this trial.
