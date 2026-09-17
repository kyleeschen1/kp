# Preserve place when opening detail

User approved anchoring before adding animation, after accepting inset
fenceposts. Canonical artifact: `examples/physics/momentum-energy.article.md`;
host: `http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum`.
Checked derivation plans and the existing native KaTeX reader retain semantic
and rendering authority. No new choreography or clock.

## Findings and bounded repair

An ordinary turnstile already preserved its heading and held numeric position in
the basic Chromium case. Make the boundary explicit: capture the clicked summary
before its native toggle, pause there, remeasure and restore its viewport offset.
Keyboard activation follows the same click. Programmatic restoration should not
acquire an unrelated user anchor.

Opening smaller steps reproduced a 132px jump between the expand control and
the replacement collapse control. Existing code anchored the parent equation
instead of the control the reader used. Preserve that control's viewport offset
on entry, saved-state return and failed-detail recovery. The existing parent
heading continues to identify the detail as part of the same move.

The compact energy cancellation is an atomic fluent animation, while its detail
is a three-step explanation. Its arbitrary intermediate pose does not have an
issued exact correspondence to a child pose. Do not invent one. Preserve the
existing saved compact state and exact return. Entry still starts the requested
detail at its source; changing this semantic relationship requires a separate
checked mapping. This repair addresses loss of visual place without adding a
false mathematical continuation.

One package, `disclosure.anchor`: responsible shared reader boundary, with the
energy exemplar for review and existing scalar/power behavior preserved. Rollback
unit is event/entry anchoring and its tests. Preserve rail, inset fenceposts,
font-resize handling, edge scrolling, bookmarks and no-JavaScript disclosures.
Focused browser checks cover entry, open/close, keyboard, exact held return and
failure recovery; affected types/build complete verification. Two-hour ceiling,
final-quarter closeout reserve. No graph/code rollout or promotion.

Review whether opening/closing detail feels attached to the same reading place.
Theseus owns execution in `run-contract.kp.disclosure-persistence-v1`.

Verification: five focused Chromium checks pass, including refinement return and
failed-view recovery. Final Chromium/Firefox anchor checks include larger text,
keyboard toggle and exact saved-state return. The first Firefox setup released
a drag outside the viewport before clicking; entering the local move first keeps
the drag/release in view and the rerun passes. Full types and production build
pass with existing global chunk warnings. The impact selector lacked a focused
mapping; this bounded repair uses the targeted regression tests above.

The initial repair added no animation, observer or clock. Native turnstiles retain their DOM and
accessibility behavior. The new boundary pauses before the user toggle and
restores its captured anchor after remeasurement; programmatic disclosures do
not create user anchors. Expanded-view replacement uses the corresponding
entry/return control for both success and repair paths.

## Delayed-layout follow-up

The user subsequently reported a delayed jump back. Observing ordinary entry
and return for 1.2 seconds was stable in Chromium and Firefox, so the exact
natural trigger remains unidentified. A deterministic late 90px toolbar reflow
reproduced the missing invariant: the clicked anchor must survive layout settling,
not just the first correction.

`src/reader/runtime/disclosure-viewport-anchor.ts` now owns a temporary viewport
anchor. A document permits only one owner; it suppresses competing browser scroll
anchoring and observes the control's ancestor sizes. Correction is event-driven,
with at most one pending animation frame, not continuous sampling. Replacement
transfers the anchor to the corresponding control. Reader input, external scroll,
navigation, window departure, page disposal or the native reader's abort releases
observers/listeners and restores the previous browser-anchoring setting. Input
during asynchronous replacement also cancels subsequent focus transfer.

Regression pressure covers delayed reflow, wheel/keyboard cancellation, owner
replacement, disposal, larger text, held-state return and 1.2-second entry/return
stability. Testing caught capture-phase blur incorrectly cancelling ordinary
control focus transfer; window blur now listens without capture. A Firefox
failure-recovery check initially failed because its synthetic drag released below
the viewport (773px in a 720px window), leaving pointer capture active and swallowing
the next click. Centering the local drag fixes the fixture. The corrected fixture
then entered recovery (confirmed by its console error) and exposed a second race:
later compositor preparation erased the repair message. Optional-view recovery
now owns a separate status node; a font-reflow regression protects that notice.
These changes retain the accepted rail, inset paint and semantic models.

Final evidence: four anchor/cancellation/return cases pass in both Chromium and
Firefox; the corrected failed-detail recovery case also passes in both, including
font resizing. Full types, production build and architecture gates pass; final
test types pass. Existing global bundle-size warnings remain. This certifies the
reproduced delayed-layout class, not an identified natural trigger for the user's
particular timing. No new subjective visual treatment or promotion is introduced.

## First-frame replacement follow-up

The user clarified that smaller-step entry still jumps. The prior tests began
sampling after the replacement control received focus, missing asynchronous
preparation. A regression now samples from activation through the first 1.5
seconds, on both entry and collapse. Before repair the new control was hidden
during preparation, yielding a zero rectangle versus the roughly 220px entry
offset. The replacement was therefore visible without a corresponding anchor.

The replacement and recovery paths now reveal and retarget the control
synchronously after mounting, before awaiting renderer readiness. The existing
busy guard prevents activation during preparation; final focus still respects
input cancellation. ResizeObserver now corrects directly before paint rather
than scheduling a displaced frame. This supersedes the earlier pending-frame
description; there is still no continuous sampling loop in production. The
rollback unit is this synchronous transfer and before-paint correction.

Eight focused Chromium/Firefox cases pass, including first-frame entry, delayed
reflow, exact saved return and failed-detail recovery. The final first-frame
regression additionally covers collapse. Build and architecture checks pass;
the initial test type failure required an HTML button runtime guard before
calling click, rather than an unchecked cast.

## Inline unfolding exemplar

User assessment: anchoring is insufficient because the original disappears.
Approved trial: unfold the checked smaller steps inside the existing energy move,
retaining its source/result, parent explanation and inspection grip. Canonical
artifact remains `examples/physics/momentum-energy.article.md`, native KaTeX host
`http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum`.
Checked compact/fine plans remain the semantic source of truth.

`energy-refinement-unfolding.ts` is the independently reversible exemplar adapter.
It reuses the original root, common native equation nodes, parent explanation,
toggle and grip during synchronous scaffold surgery. The fine plan inserts its
intermediate records beneath the retained parent explanation; one reader clock
and compositor set are active at a time. Retained control listeners are aborted
before rebinding, so repeated cycles cannot accumulate toggle handlers. Shared
endpoint authority still comes from checked publication; the adapter rejects
non-energy/nonterminal use. Other families and the explicit
`?derivation-detail=expandable` replacement comparison retain the prior path.

Acceptance: source equation and parent explanation remain recognizable in place;
children read as an unfolding of that same move; the same grip inspects children;
collapse restores exact saved compact state. No new animation is added. The
arbitrary compact interior pose still has no issued fine-child correspondence:
detail begins at the shared parent source, while collapse restores the held pose.
Native record continuity does not claim continuity of that intermediate material
pose. Preserve accepted rail/inset paint, font behavior, models and authoring.

The bounded browser regression retains references to root, original endpoint
nodes, explanation, toggle and grip and proves they stay connected through two
open/child-inspect/close cycles. Stable before/open screenshots use
`npm run visual:mechanics-relations -- --grep 'inline refinement retains'`.
Anchor/return and failed-view recovery checks remain in the focused smoke cohort.
Review the default energy host before adding motion or promoting this pattern.

Checkpoint evidence: four focused Chromium smoke cases pass; the final two inline
cases also pass with larger text, repeated cycles and injected failed-detail
recovery. Full types, final test types, production build and architecture checks
pass (existing global chunk warnings remain). Before/open screenshots were
inspected locally. Status: HUMAN_CHECKPOINT; no cross-family or animation rollout.
