# Repeated-group authoring trial — human checkpoint

Date: 2026-09-10. Outcome: HUMAN_CHECKPOINT.
Contract: `run-contract.kp.unfamiliar-supported-authoring-v1`.
Target: `next-action.kp.unfamiliar-supported-authoring`.
The s17 review packet is ready; visual/pedagogical acceptance is not assumed.
After acceptance, continue s18–s20 (browser promotion, release, conclusions),
not another authoring or compositor loop. Theseus owns the exact live count.

## What to inspect

Open the [shared Focus Card](http://localhost:8000/experiments/reusable-reasoning/?example=composed-algebra).
The URL still loads the canonical starter: it does **not** automatically select
a trial source. Open **Edit source JSON**, replace its contents with one of the
complete source files below, then press **Apply source**. The title must change
to the listed title. Keep that same page/server for all five cases.

| Case / complete source | Expected title | Original → collected → evaluated |
| --- | --- | --- |
| [1: sum](http://localhost:8000/docs/project/threads/2026-09-10-authoring-trial/case-01.attempt-2.json) | Count copies of the same group | `4(x+2)+5(x+2)` → `(4+5)(x+2)` → `9(x+2)` |
| [2: sum, opposite order](http://localhost:8000/docs/project/threads/2026-09-10-authoring-trial/case-02.attempt-1.json) | Keep the multipliers on the right | `(x+4)*2+(x+4)*5` → `(x+4)(2+5)` → `(x+4)*7` |
| [3: product](http://localhost:8000/docs/project/threads/2026-09-10-authoring-trial/case-03.attempt-1.json) | Count a product as one group | `2(x*y)+5(x*y)` → `(2+5)(x*y)` → `7(x*y)` |
| [4: product, opposite order](http://localhost:8000/docs/project/threads/2026-09-10-authoring-trial/case-04.attempt-1.json) | Collect a product with multipliers after it | `(x*y)*3+(x*y)*4` → `(x*y)(3+4)` → `(x*y)*7` |
| [5: one copy](http://localhost:8000/docs/project/threads/2026-09-10-authoring-trial/case-05.attempt-1.json) | One copy is still a whole group | `1(x+5)+3(x+5)` → `(1+3)(x+5)` → `4(x+5)` |

Source links return raw JSON. Copy the complete JSON document, not this table's
equations or a checker report. The selected source files are also retained in
`../threads/2026-09-10-authoring-trial/` for filesystem access.

Use arrows for complete steps, then scrub forward/backward through each change.
Expect three stops and two transitions. At the first change the repeated sum or
product stays recognizable as a whole group while its counts collect. At the
second, only the coefficient sum evaluates through the existing ink-glyph motif.
Interior screenshots may contain deliberately in-flight ink and partial passage
travel; judge motion in playback and text legibility at settled stops.

Try Full/Compact and Predict/Reconstruct on a representative case, then Return
from an intermediate position. Both readings retain the three verified equations;
prompts and return position should still refer to the applied source.

## The decision requested

Do the authored explanations and preserved motion make the unchanged repeated
group easy to identify and follow? Is the distinction between counting copies
and evaluating the group's contents clear, including the unit-coefficient case?
Report any awkward prose, unreadable settled passage or confusing movement in
one batch. This is not a request to reapprove architecture or unchanged budgets.

Approval accepts this same-family explanation set for promotion, not a new
universal layout, motif, mathematical family or comprehension claim. Source/prose
refinement is within the approved exemplar boundary; new motion/layout design is
not. Rollback unit is one trial source and its fixtures; original canonical
primary/product sources and their editions remain untouched.

## Evidence and limits

- Five of five initial sources compiled; one had a self-detected brief correction.
  Selected source JSON totals 6,167 bytes. Zero production engine/renderer/clock
  edits and zero author implementation inspection were needed.
- Wrong factorization and wrong addition each produced a located rejection and
  one source repair. A valid negative-coefficient identity remains unsupported
  syntax; it was not mislabeled as a presentation rejection or changed to pass.
- Eleven preserved attempts replay exactly. The packet now clarifies observed
  messages; that informed follow-up is not counted as a fresh-author success.
- Five real Chromium Apply/control cases, five projection cases and one
  no-JavaScript test covering all five immutable editions have passed. The
  focused suite has 61 passing tests; full app/node/test/Svelte/domain types pass.
- Cross-browser promotion and the full release suite are intentionally still
  pending after this checkpoint. No merge or deployment occurred.

Details: [frozen outcomes and qualifications](../threads/2026-09-10-authoring-trial/initial-results.md),
[executed integration checks](../threads/2026-09-10-authoring-trial/integration-evidence.md),
and [local edition URLs/digests](../threads/2026-09-10-authoring-trial/editions.json).
Editions are static reading/self-check artifacts, not animations. The current
[case-one static edition](http://localhost:8000/tmp/codex/composed-algebra-editions/30b63e2956c79076667d8c840bd2d377d04301a2c61f715193930b291d58e2c8/index.html)
can be inspected without copying JSON; it is not a substitute for motion review.

One sequential local author is not a general LLM benchmark. Required-context
overhead and imperfect timing prevent a total-author-time or speedup claim.
The author disclosed extra roadmap summaries; no perfect isolation is claimed.
Learner comprehension is unmeasured. The concrete result is reuse through the
finished pipeline, not evidence of arbitrary LaTeX-chain support.

## Resume

Fresh-session command from the repository root, using `$theseus-project`:

```sh
theseus work context next-action.kp.unfamiliar-supported-authoring --mode brief
```

Then read this named checkpoint. Generic `theseus work resume` currently exceeds
its fixed 1,200-token capsule budget (1,632 measured); reducing the event limit
does not repair it. `--scope kp` succeeds but points to older scoped state and
must not replace the current unscoped contract. The targeted command above
passes and preserves the actual human boundary. No package, data or budget gate
was changed. See the integration record's handoff note for attempted alternatives.
Record the user's visual verdict against this contract,
reactivate it only after acceptance, then continue s18. No further routine
approval is required for the already approved s18–s20. Do not restart earlier
closed runs or launch a successor beyond these three slices.
