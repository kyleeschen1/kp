# Matrix resource → independent reference card

Date: 2026-11-27
Status: checked candidate; HUMAN_CHECKPOINT before promotion.
Scope: [approved successor](2026-11-27-matrix-reference-card-next-step.md).
Execution: `run-contract.kp.matrix-reference-card-20261127`.

## Review the workflow

Open <http://127.0.0.1:8000/experiments/matrix-reference/> for the built-in card.
Play, seek, or select a milestone; reload and confirm the same position returns.
The layout keeps the existing seven-beat column choreography. At phone width,
the animation pans horizontally inside its card; the page itself does not overflow.

For authored reuse:

1. Open <http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=matrix>.
2. Change A11 to 3, select the matrix object's heading, press C-x C-x, and run
   **Export matrix resource**.
3. In the reference card, choose **Open matrix snapshot** and select that JSON.
   The result is `[5, 2]`; the Source snapshot disclosure names the file and its
   resource/matrix/vector/result IDs.
4. Choose a step and reload. Open a malformed JSON file: the last valid card and
   saved position remain. Later notebook changes do not mutate this pinned file.

Judge whether the standalone presentation is useful to return to, and whether
its controls and source disclosure feel clear. This is one card, not a finished
reference library or a new compact phone choreography.

## What changed and why

The contextual export command serializes the selected validated source, including
its stable IDs and occurrences. It excludes computed output, executable code and
rendered paint. A data-only snapshot admission helper rejects incomplete drafts.
The existing notebook download mechanics now live in one browser export helper;
the mathematical controller owns no cleanup timer or animation clock.

The independent host uses `createMatrixVectorRuntime().explanation()` and
`mountColumnExplanation`, with their actual single-vector product and existing
fonts/geometry. Host preferences sit outside the source in a versioned local
record. `openAtomicRecord` provides a read/change/write transaction; revision
checks prevent an older tab from silently overwriting a newer save.

The host mounts a measurable, invisible candidate before committing it. Invalid
source or unsupported paint leaves the visible card and persisted record intact.
File reads use latest-request admission; writes are serialized. Playback callbacks
belong to their active presentation, so disposed players cannot save into a new
source. Disposal cancels pending imports and releases runtime, player and storage.
File admission is bounded to 64 KiB. Conflicts and failed saves remain explicit;
there is no fallback animation or silent source substitution.

## Executed evidence

- `npm run test:matrix-reference`: 7 tests, including signed/zero source roundtrip,
  independent view validation, stale callbacks, malformed/unsupported imports,
  competing reads, storage failure/conflict, and disposal during a pending write.
- `npm run test:notebook-mathematics`: 27 existing mathematical/admission/cache
  tests pass. The accepted player and notebook source/history were not changed.
- `npm run visual:matrix-reference -- --project=firefox`: all 6 cases pass across
  Chromium and Firefox. Actual notebook download/import, reload, forward/reverse,
  replacement, narrow host, delayed file reads and two-tab conflict are exercised.
  After download consolidation, the `--grep 'notebook export'` rerun passes in
  both browsers. Desktop Chromium and narrow Firefox screenshots inspected.
- `npm run typecheck`, `npm run typecheck:matrix-reference`, and
  `npm run typecheck:fraction-notebook` pass. Scoped checks ran after final edits.
- `npm run test:library-boundaries`: 8 tests pass, including the full local
  reference import graph. `npm run check:architecture` passes with no added
  dependency-direction exceptions. The first run identified the export timer in
  the matrix controller; consolidation into the shared browser helper fixed that
  ownership issue without weakening the animation-clock gate.
- `npm run check:playwright-configs` and `npm run check:typescript-configs` pass.
  The new scoped browser configuration alone was added to the policy baseline:
  three inherited browsers, exact test file, existing localhost server, 60-second
  test timeout. Existing configuration hashes were unchanged.
- `npm run test:project-vision`: 75 tests pass; accepted scope and preserved
  predecessor completion remain source-linked. The final context-index addition
  exceeded its 450-word startup budget (458); shortening its summary preserved
  all source links and restored the gate without increasing the budget.
- `npm run measure:matrix-reference`: complete production HTML consumer emits
  **469,856 bytes JS/CSS raw, 133,049 bytes gzip**. All emitted files, including
  all font formats, total **1,588,385 raw / 1,044,395 gzip bytes**. These are summed
  per-file gzip estimates, not measured transfer or runtime latency. All reachable
  chunks are inspected; no ProseMirror, CodeMirror, chat, notebook controller,
  Three.js, saddle or general math-library dependency enters the reader. A
  200,000-byte JS/CSS gzip ceiling retains bounded headroom; fonts remain separately
  visible in total emitted cost.

The impact selector has no focused mapping for these hosts and suggested the full
repository suite by fallback. This bounded contract instead uses affected types,
the complete architecture chain, focused source/browser preservation, and a real
production reader build. The full repository `npm test` and unrelated publication
build were not run. KaTeX mechanism certification and broader release matrices
are unchanged; these tests establish the host workflow, not new paint mechanisms.

## Remaining boundary

Human judgment is pending. Local persistence is one pinned card per browser
origin; it is not a server backup or live subscription. Source files remain the
portable backup. Unsupported scientific-notation paint produces the existing
typed gap. No new choreography, mathematical families, universal asset schema,
publication, LLM mutation or broad shared-player promotion was added.

Rollback unit: source export plus the independent reference host. The accepted
notebook explanation and restored fraction scrolling remain intact. After review,
resume the named contract's review package; do not expand this outcome implicitly.
