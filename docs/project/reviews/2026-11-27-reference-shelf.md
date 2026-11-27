# Saved matrix reference shelf

Date: 2026-11-27
Status: accepted by the user's “good. go”; bounded outcome COMPLETE.
Scope: [approved successor](2026-11-27-reference-shelf-next-step.md).
Execution: `run-contract.kp.matrix-reference-shelf-20261127`.

## Try the exemplar

Open <http://127.0.0.1:8000/experiments/matrix-reference/>. Your previously saved
card and playback position migrate automatically. Give it a readable Card name
and choose Save name.

1. Expand **Source snapshot** below the player. Download **Negative contribution**
   and **Zero vector**, then open each with **Open matrix snapshot**. They have
   distinct source identities; neither replaces your existing card.
2. Use **Find a card**, type part of a name, and press Enter. The shared floating
   picker shows at most five rows, including filenames and saved positions.
   Arrow keys navigate; Escape closes and restores focus to Find a card.
3. Give the three cards different milestones. Switch among them, then reload:
   each position and the selected card should return. Only the selected card has
   an active player; replacement briefly prepares an invisible candidate.
4. Open the same file again. Choose **Update this card** to retain a selected
   matching card's name and position, **Save as separate card** for an independent
   view starting at zero, or Cancel. Updates never change another named copy.

Judge the naming/find/return interaction, especially whether the small picker
keeps the explanation easy to revisit. The existing card appearance, seven-beat
choreography and horizontal phone panning remain the reference.

## Ownership and preservation

The shelf is host state: card UUID, name, selected card and playback preferences.
The mathematical source remains the validated `MatrixVectorDocument`; copying a
card retains its source UUIDs and creates only a new host card UUID. Explicit
same-source update chooses one host identity. Labels never identify a write target.
Updates also retain matrix/vector/result identities; a conflicting closure requires
explicit separate-card import rather than silently replacing those referents.

The existing atomic IndexedDB owner stores the shelf under a separate `shelf-v1`
key. The original `documents` record is preserved for rollback. Concurrent first
opens admit one persisted set of card identities; later opens reuse it. Whole-record
revision checks prevent stale-tab writes. The old parser remains the migration
and rollback boundary; no schema is silently rewritten in place.

The session serializes writes, settles the current player before switching, and
rejects callbacks from retired presentations. File reads and pending import
decisions lose authority on replacement, navigation, cancellation or disposal.
New snapshots must mount successfully before replacing saved/displayed state.
Invalid source, unsupported paint, storage failure and stale revisions preserve
the last valid shelf. Renaming and playback are separate; a save cannot overwrite
an unfinished rename field.

The shelf reuses `interaction/row-picker.ts` and the existing row schema/matcher.
The reader closure now deliberately admits that host-free interaction library;
ProseMirror, CodeMirror, notebook/editor/chat hosts, Three.js and unrelated math
libraries remain forbidden. No new picker implementation or rendering mechanism.

## Evidence

- `npm run test:matrix-reference`: ten tests retain prior source/admission and
  lifecycle invariants, plus migration, three-source independent positions,
  copy/update separation, internal identity conflicts, cancellation, storage
  conflicts and pending disposal.
- `npm run visual:matrix-reference -- --project=firefox`: all twelve cases pass
  across Chromium and Firefox. Includes actual notebook export/import, rejection,
  delayed reads, stale tabs, three named cards, filtering and keyboard return,
  narrow layout, explicit same-source decisions and concurrent migration.
- After adding downloadable review examples, the same command with
  `--grep 'three named snapshots'` passes both browsers, including downloading
  actual example bytes. Desktop, picker and narrow screenshots inspected.
  The final `--grep 'same-source'` rerun passes both browsers after the identity
  guard was added; its rejection case is also covered by the unit suite.
- `npm run typecheck` and final `npm run typecheck:matrix-reference` pass.
  An initial test-only union access needed narrowing; the corrected scoped run
  passes. No source checking was weakened.
- `npm run test:library-boundaries`: eight checks pass, now requiring the real
  shared picker in the reader closure while retaining forbidden-host checks.
  `npm run check:architecture` passes with no new dependency exceptions.
- `npm run measure:matrix-reference`: complete standalone production consumer,
  including bundled example URLs: **489,637 JS/CSS bytes raw / 139,266 gzip**.
  Prior card: **469,856 raw / 133,049 gzip**; added JS/CSS gzip **6,217 bytes**.
  All emitted assets total **1,608,474 raw / 1,050,714 gzip bytes**, including all
  emitted font formats. The 200,000-byte JS/CSS ceiling is unchanged. These are
  per-file gzip estimates, not measured network transfer or runtime latency.
- `npm run test:project-vision`: 75 checks pass after the final source-linked
  status update; completed predecessors retain their acceptance and exclusions.

Impact selection still falls back to full-repository checks for this host. This
bounded contract uses affected/full types, architecture, source and browser
workflows, and the complete reader build. Unrelated publication builds and the
entire repository unit suite were not rerun. Shared player choreography and the
notebook implementation were unchanged.

## Limits and rollback

This is a browser-local shelf of at most 50 cards, not cross-device sync or a
published library. Source JSON remains the portable backup; names and positions
are local preferences. Deletion, collection export, live subscriptions, new
mathematics, flashcard scheduling and LLM mutation are outside this outcome.
The preserved legacy record enables reverting shelf code without destroying the
previous single-card state. The shelf is accepted; broader promotion remains
separate. [Linked column geometry](2026-11-27-matrix-geometry-next-step.md) is the
recommended successor and has not started.
