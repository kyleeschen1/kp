# Mathematical studio foundations

Date: 2026-11-27
Status: implementation checkpoint; integrated revision review remains in progress.
Scope and rationale: [approved tranche](2026-11-27-twelve-loop-horizon.md).
Execution authority: `run-contract.kp.studio-foundations-20261127`.

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

## Evidence at the integration checkpoint

- Matrix reference tests: 16 passed. Full reference browser suite: 14 passed
  across Chromium/Firefox; focused linked-geometry/theme rerun: 2 passed.
- Studio boundary tests: 37 passed; existing chat tests: 25 passed; shared row
  session tests: 7 passed; library boundaries: 8 passed.
- Discovery browser flow: 2 passed. Revision browser flow: 6 passed, covering
  staging without send, actual service with a deterministic RPC peer, preview,
  acceptance/rejection, draft protection, undo/redo and thread-switch preparation.
- Scoped notebook and reference types passed; full types passed before the last
  revision integration. Architecture and project vision checks passed.
- Complete reference JS/CSS: 146,289 gzip-estimated bytes (103 modules), up from
  139,266 before this tranche. The existing 200 KB ceiling remains unchanged;
  no editor/chat/3D code enters the reader. Complete emitted assets including all
  font formats: 1,057,775 gzip-estimated bytes. These are per-file compression
  estimates, not measured network transfer or runtime performance.
- Complete current notebook JS/CSS: 610,775 gzip-estimated bytes; initial JS:
  479,480. The committed measurement's older baseline includes earlier matrix
  work, so its entire delta cannot be attributed to this tranche. Native reader
  complete JS/CSS: 340,792; mathematical reading: 219,281.

Failed checks were used to repair query selection/operation aliases and an
embedded theme-specificity leak. Early revision browser failures were test
assumptions about rendered newlines and duplicate Undo command labels; corrected
tests now exercise the actual scoped command. A temporary missing import during
worker integration caused a notebook smoke failure; rerun passed after integration.

## Open at this checkpoint

Independent review reproduced a history-boundary defect: typing immediately
after acceptance can join the same undo group. A worker fix and regression are
ready for integration; do not call this checkpoint fully verified. The review
panel also needs an inspection toggle so it cannot conceal the proposed animation.
Final combined checks, a human visual review and a real model usefulness trial
remain outstanding. Deterministic peers do not establish model usefulness.

Preparation now checks the original branch/thread across asynchronous source
validation. Invalidating a request clears stale pasted JSON, and choosing a
completed response clears manual input. These guards supplement the proposal
owner's source/draft hash, target, cancellation and duplicate checks.

Pending proposal authority is deliberately memory-only. Reload preserves chat
and notebook drafts but requires a fresh proposal request. Moment selection is
explicit in the panel. Undo restores the notebook draft; changes to animation
source retain the existing Run-to-refresh behavior. Automatic publication and
paid model calls remain excluded.
