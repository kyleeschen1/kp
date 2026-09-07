# Resume point: canonical adoption / G3

Status: HUMAN_CHECKPOINT. The user ended the strategic-brainstorm pause on
2026-09-07 and requested finishing the existing loop; G3 approval is still
absent. See [the resumption instruction](../decisions/2026-09-07-math-recommendations-and-loop-resumption.md).

Execution authority remains
`run-contract.kp.structural-authoring-canonical-tax-v2`, with 27/28 slices
complete. G3 is not accepted. The roadmap and
`../reviews/2026-09-07-canonical-tax-g3-checkpoint.md` describe the existing
approved scope; new strategy discussion does not replace it without approval.

## Preserved work

The four-card canonical route ships through the ordinary build. The last
adoption checkpoint was `5fe125a8f`. The subsequent verified keyboard repair
is checkpointed with this note: a shared key-to-semantic-step resolver replaces
the siblings' ineffective native 0.01 slider increments. Pointer scrubbing,
domain models, rendering, motion timing and card-owned clocks are unchanged.

Verification after the keyboard repair: 19 Focus Deck unit tests, 81 authoring
integration tests, 21 focused development browser checks and 12 built-page
checks across Chromium/Firefox/WebKit; full typecheck/build, architecture,
production closure, unchanged reader budgets and reachability pass. The
6,610-test full release predates this small repair; do not claim it was rerun.
The measured canonical static JS/CSS closure is 367,522 gzip bytes (+130).

## Exact next action

1. Clarify the user report: "All but the code example work well. Arrows only
   work on the supply-demand card." Slider keyboard failure was reproduced
   and repaired. Ask whether "arrows" instead meant visible buttons, and what
   specifically fails in the code example.
2. Do not assume code swiping is a regression: its prior implementation
   explicitly disables passage swiping. Button-driven code animation,
   interruption and direct-seek tests passed before and after the repair.
   The actual reported code failure is still unconfirmed.
3. Reproduce the clarified behavior through the existing scoped browser
   commands before further edits. Preserve working cards and all fixed gates.
4. Return to G3 human review. Do not merge, deploy, mark s28 complete or launch
   a new implementation contract without the required authority.

Review URL: <http://127.0.0.1:8000/experiments/kinetic-figure/supply-tax/>.
The shared server answered HTTP 200 during the repair; verify it when resuming.
Do not start another persistent server unnecessarily.

Tracked entry for the resumed work:
`theseus work start next-action.kp.structural-authoring-canonical-tax --mode brief`.
The larger resume packet exceeded its fixed budget; do not raise it. Derive
progress with `npm run --silent loop:status`; when the contract is blocked that
command reports no active loop, so inspect the named contract's slice state.
The prior receipt `event.context-run-issued.next-action.kp.structural-authoring-canonical-tax.20260907164747168.im8.1`
was closed; start a new receipt rather than re-closing it.

## Proposed strategy discussion

The deeper brainstorm is recorded in
[the composable explanation medium review](../reviews/2026-09-07-composable-explanation-medium-next-step-review.md).
It proposes a coherent authoring-to-publication round trip and one expandable
supporting explanation, with bounded implementation packets for later work.
The user subsequently accepted the tax-then-Bayesian flagship selection; see
[the decision and McKeon reference findings](../decisions/2026-09-07-tax-integration-then-bayesian-flagship.md).
That accepts the exemplar direction, not the full implementation packet or G3.
Keep the proposed successor work separate from the approved G3 resume task.
The user's later confirmation of tree collapsing/flipping is not code-card
feedback or an instruction to resume implementation.

The subsequent [lower-undergraduate math authoring goal](../decisions/2026-09-07-lower-undergraduate-math-authoring-horizon.md)
and [source-based readiness review](../reviews/2026-09-07-lower-undergraduate-math-authoring-readiness.md)
broaden the durable mathematical horizon beyond the Bayes flagship. They do
not change this resume point, accept G3, or approve a successor loop.
The later request to finish the previous loop lifts the brainstorm pause only;
the recommendations are recorded for successor planning and G3 remains a human
gate, not an automatic closeout.
