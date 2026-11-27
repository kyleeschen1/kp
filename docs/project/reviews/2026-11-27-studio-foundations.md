# Mathematical studio foundations

Date: 2026-11-27
Status: complete; visuals and the subsequent actual-response annotation trial are accepted.
Scope and rationale: [approved tranche](2026-11-27-twelve-loop-horizon.md).
Execution authority: `run-contract.kp.studio-foundations-20261127`.

The user's “yes” accepts the [actual response](2026-11-27-contextual-revision-trial.md)
and closes the fifth package. Earlier pending-trial notes below describe the
original visual handoff. The [twelve-loop assessment](2026-11-27-twelve-loop-review.md)
retains the broader reuse and integrated-studio gaps.

## Author-visible changes

- Opt-in linked matrix reference: native column calculation and a compact SVG
  graph share the same playhead and source product. Signed contributions, zero
  vectors and cancellation use the existing mathematical owner.
- Shared palette/document defaults feed this candidate and the existing picker.
  Legacy notebook variables and saved overrides retain their existing behavior.
  A bounded color snapshot adapter resolves opaque CSS colors for graphics;
  it does no per-frame style reads and has not been rolled out to WebGL.
- Matrix and quadratic notebook objects expose their existing capabilities
  through `Discover selected mathematical object`. Search never creates a new
  evaluator or changes the captured source. Unsupported operations stay explicit.
- The opt-in fraction revision panel stages a bounded request in existing chat,
  then previews a selected complete response or pasted proposal. Acceptance is
  explicit. Native chat owns history; ProseMirror owns the notebook edit; the
  existing server compiler admits the annotation and its targets.

Canonical hosts: `/experiments/matrix-reference/?geometry=1`, mathematical
notebooks, and `/experiments/fraction-notebook/?revision=1` on the product server.
The plain reference, accepted fraction pacing, source identities, stored styles
and existing chat transport are preservation boundaries. This is not a new
universal object protocol, renderer, solver or publishing workflow.

## What to try

1. Open `http://127.0.0.1:8000/experiments/matrix-reference/?geometry=1`.
   Use Milestone/Previous/Next to compare column directions, scaling, head-to-tail
   addition and the sum. Reverse, reload and switch theme. Judge whether the
   compact graph clarifies the equation without competing with it. The plain URL
   retains the accepted reference. Negative/zero snapshots remain in Source snapshot.
2. Open `http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=matrix`.
   Select a mathematical object, press C-x C-x and run **Discover selected
   mathematical object**. Type Graph or Explain; C-h shows operation tags. In
   the quadratic notebook, type derivative. These invoke the existing commands.
3. Open `http://127.0.0.1:8000/experiments/fraction-notebook/?revision=1`.
   Open existing chat and connect a session. Keep the composer empty, focus the
   notebook, then use C-x C-x → **Revise fraction annotation in chat**. Choose
   a moment and request one wording change. **Prepare request in chat** stages
   text without sending. Send explicitly, select the completed response, and
   **Preview proposal**. **Inspect animation** uncovers the existing reader;
   **Return to proposal** preserves the pending decision. Accept or Reject.
   Undo/Redo change the draft; use **Run** after source undo to refresh the animation.

The real trial must assess mathematical/pedagogical usefulness and correction
effort, not merely valid JSON. No model call was made for this delivery. The
deterministic browser peer exercises service/protocol behavior only.

## Verification

- Matrix reference tests: 16 passed. Full reference browser suite: 14 passed
  across Chromium/Firefox; focused linked-geometry/theme rerun: 2 passed.
- `npm run test:studio-foundations`: 38 passed; existing chat tests: 25 passed; shared row
  session tests: 7 passed; library boundaries: 8 passed.
- Discovery browser flow: 2 passed. Revision and branch-preservation browser flow: 8 passed, covering
  staging without send, actual service with a deterministic RPC peer, preview,
  acceptance/rejection, draft protection, inspection without cancellation,
  undo/redo/Run, thread-switch preparation and another tab changing branches.
- Saved-theme/style/Run browser preservation cohort: 8 passed across both
  browsers. Fraction notebook unit tests: 28; mathematical notebook tests: 27.
- `npm run typecheck` passed, including app, node, tests, Svelte and domains.
  Final lazy-loading change also passed scoped notebook types and complete build.
  `npm run check:architecture` and project vision checks (75 tests) passed.
- Complete reference JS/CSS: 146,289 gzip-estimated bytes (103 modules), up from
  139,266 before this tranche. The existing 200 KB ceiling remains unchanged;
  no editor/chat/3D code enters the reader. Complete emitted assets including all
  font formats: 1,057,775 gzip-estimated bytes. These are per-file compression
  estimates, not measured network transfer or runtime performance.
- Exact pre-tranche comparison uses `npm run measure:notebook-mathematics --
  --baseline cf0c81c723736005b36265a0c98c8be4b9d39668`. Complete notebook JS/CSS:
  596,960 → 612,649 gzip-estimated bytes; initial JS: 473,370 → 475,202.
  Moving discovery behind its mathematical-host import reduced this candidate's
  initial JS from 479,505 to 475,202 bytes, at the cost of more lazy chunks.
  The measurement now rejects eager discovery/revision modules as well as eager
  mathematical runtimes. No budget was raised. Native reader complete JS/CSS:
  340,792 → 340,792; mathematical reading: 219,281. Complete notebook type cohort:
  673 → 681 files; instantiations 198,460 → 200,607, with all consumers retained.

Failed checks were used to repair query selection/operation aliases and an
embedded theme-specificity leak. Early revision browser failures were test
assumptions about rendered newlines and duplicate Undo command labels; corrected
tests now exercise the actual scoped command. A temporary missing import during
worker integration caused a notebook smoke failure; rerun passed after integration.
The first theme preservation cohort failed one Firefox assertion: event tracing
showed Tab left the final filtered input focused, so no change/blur occurred.
The test now explicitly clicks another control to exercise a real commit; the
full eight-case cohort passes. Production style behavior was not changed.
Project orientation briefly exceeded its 450-word startup limit; prose was
shortened and all 75 checks pass without changing the limit.

## What is fixed, and what remains open

Independent review reproduced a history-boundary defect: typing immediately
after acceptance joined the same undo group. Acceptance now closes native
history on both sides; a regression verifies immediate typing, two independent
undos and both redos. The inspection toggle preserves the proposal while
uncovering the existing animation. Human visual review and a real model
usefulness trial remain outstanding; neither is established by automated checks.

Preparation now checks the original branch/thread across asynchronous source
validation. Invalidating a request clears stale pasted JSON, and choosing a
completed response clears manual input. These guards supplement the proposal
owner's source/draft hash, target, cancellation and duplicate checks.

Pending proposal authority is deliberately memory-only. Reload preserves chat
and notebook drafts but requires a fresh proposal request. Moment selection is
explicit in the panel. Undo restores the notebook draft; changes to animation
source retain the existing Run-to-refresh behavior. Automatic publication and
paid model calls remain excluded.

Shared upkeep is limited to existing boundaries: optional frame observation,
theme tokens and a color snapshot helper, metadata over registered commands,
and one bounded proposal/transport/controller path. There is no new global
clock, evaluation engine, source store or generic JSON patch protocol. More
mathematical families, theme/graph promotion and general revision remain gated.
Resume through `theseus work start task.kp.studio-foundations-20261127 --mode brief`
after review; the approved horizon and finite contract remain intact.
The generic Theseus handoff still selects the historical authoring-to-practice
run and reports its hygiene findings. Use the roadmap's named studio contract;
this delivery does not resume or repair that older run.
