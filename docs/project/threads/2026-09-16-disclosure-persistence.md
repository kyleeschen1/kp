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
