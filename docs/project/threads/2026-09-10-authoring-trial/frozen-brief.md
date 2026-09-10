# Frozen unfamiliar-author task

Approved 2026-09-10 under `run-contract.kp.unfamiliar-supported-authoring-v1`.
This is the author input and measurement boundary, not a live slice table.

Teach **collecting repeated groups without changing their contents** to an
algebra learner who recognizes parentheses and multiplication but may fail to
see a compound expression as one reusable unit. Produce complete supported
three-state sources, with concise setup, per-state reasoning and summary.
Do not claim that collecting coefficients evaluates the variable expression.

## Five cases, in order

1. Two different positive coefficients multiplying the same compound sum on
   the right. Choose new values, not the retained starter's coefficients.
2. A compound sum with coefficients explicitly on the right. Make the order
   visible without assuming commutativity in the deduction.
3. A compound product instead of a sum, with coefficients on the left.
4. A compound product with coefficients on the right; use different values
   from case 3.
5. A supported compound sum with one coefficient equal to one; explain why
   the group itself remains unchanged.

Use small positive integers and short expressions within the packet's grammar.
The completed equations are for the author to supply. No replacement cases if
one fails. Each case permits one initial draft and at most three repairs.
The baseline packet stays unchanged until all cases and repair probes finish.

Then author three separate probes: wrong factorization, wrong coefficient
evaluation, and a mathematically valid but unsupported deduction. Record the
actual returned diagnostic, not the label you hoped the compiler would emit.
For the invalid probes also attempt a valid source repair. No engine changes.

## Author context and disclosure

One local agent starts with no inherited chat and no model override. It reads
mandatory instructions, canonical routing and the supported composed-algebra
packet, source schema/example as needed, and this brief. Required repository
context is allowed but counted; this is not an artificially tiny prompt claim.
No renderer/compiler implementation inspection, external APIs, subagents or
handwritten motion. If additional implementation inspection becomes necessary,
request it and record specialist intervention rather than silently doing it.

Preserve every draft as `case-NN.attempt-N.json` (or `probe-NAME.attempt-N.json`)
and the checker report. Do not overwrite failed attempts. Record ISO start/end
times, commands, exit outcomes, documents read and assistance. Elapsed wall time
is not active human time or token cost. Unknown measurements stay null/unknown.
Learning across the five cases is expected; they are not independent authors.

The primary agent verifies results and owns Theseus/commits. The author writes
only its assigned case/probe and notes files, never production code, tests,
shared ledgers, roadmap or Theseus. Source-only completion and required-engine-
intervention are distinct results even when the overall investigation finishes.

## Outcome measures

- First-pass and within-one-repair validity; final validity within attempt cap.
- All attempts and diagnostic locations; source-only versus specialist help.
- Exact source/revision coherence across card, readings, prompts and editions.
- Readability and whether motion makes the repeated group easier to perceive.
- Zero silent fallback and zero production renderer/clock/semantic-engine edits.

No claim of learner comprehension, general model success rate or enforced
filesystem isolation. The frozen brief and baseline packet revision precede the
author's first attempt; later packet corrections are separately labeled reruns.
