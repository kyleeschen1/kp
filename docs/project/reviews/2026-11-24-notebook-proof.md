# Two-notebook composition: exemplar review

Date: 2026-11-24
Outcome: HUMAN_CHECKPOINT. The bounded implementation and automatic checks are
complete; authoring/interaction acceptance and wider promotion remain pending.
The [approved proposal](2026-11-24-next-step-review.md) owns scope;
`run-contract.kp.notebook-proof-20261124.v1` owns execution and receipts.

## Review the workflow

Open the [notebook editor](http://127.0.0.1:8000/experiments/notebook/) and
[independent reader](http://127.0.0.1:8000/experiments/notebook/reader.html).
Both respond HTTP 200 on the persistent product-checkout server. Its launchd
API/web services remain running. The [walkthrough](../authoring/notebook-proof.md)
explains the exact controls, JSON contract and storage limits.

1. Scrub the two imported animations to different positions. Edit **First input**
   to `[[3,0],[1,1]]`: only its dependent scene changes; both positions remain.
2. Open **Shared matrix workshop** in another tab and edit **Shared transformation A**
   to `[[2,2],[3,4]]`: both live uses update, retaining their distinct bindings.
3. Fold, unfold and move the enclosing section, then reload. Check that the
   structure and independent positions survive. Try the occurrence's binding
   selector and **Open shared source** to compare local and shared edits.

Judge whether those consequences are understandable and whether the visible
nesting, outline and source controls help you retain your place. The current
explicit hierarchy produces several headings/fold controls around a scene;
that may be cumbersome. Automatic tests cannot decide this interaction question.
No further scene-family rollout precedes this checkpoint.

## What the proof establishes

Canonical versioned JSON represents nested sections, prose, matrix resources,
components, scenes and live imports. Notebook, block and component-input UUIDs
persist across saves/reopens; duplicates receive new identities and remapped
internal references. Components declare matrix inputs; sections do not create
implicit scopes. Import resolution retains source scope and explicit bindings.

The two imported occurrences reuse one canonical mathematical object within a
resolution, with independent player instances and view state. Dependency
signatures retain unaffected players. Prose changes do not restart animations.
Folding pauses playback; fold/unfold, moves, numeric changes and reload preserve
the held fraction of this existing seven-stop story.

An IndexedDB compare-and-swap transaction owns durable browser-local saves.
Concurrent tabs cannot overwrite a newer revision. Invalid input retains saved
content and recoverable per-tab drafts. The separate reader excludes the editor,
transaction UI dependencies and external workbench. Export/import retains UUIDs;
import refuses to overwrite an existing notebook. This adds no repository-file
autosave, multi-device synchronization, publication or LLM integration.

The existing matrix column-combination card, native KaTeX renderer, timeline and
mathematical product remain the owners. The JSON notebook and adapter are new;
the mathematical scene and choreography are reused. The fixed fractional reader
was not generalized into a parameterized scene or changed by this work.

## Invariants and discovered repairs

- The first numeric integration could bypass file authoring's presentation
  admission and accept scientific notation. The boundary is now shared by file
  compilation and notebook resolution. Factors, intermediate products and sums
  must remain finite and use supported numerals. Unit and browser regressions
  verify rejection, saved-source preservation and exact draft recovery.
- Validated transactions cannot leave partial edits, cycles or invalid insertion
  destinations. Self-anchors only represent a no-op within the existing parent.
  UUID remapping and revision checks protect reference/ownership boundaries.
- I/O rejects unknown types, duplicate identities, sparse arrays, accessors and
  hidden fields without executing accessors. Missing references, invalid bindings
  and import cycles produce explicit bounded diagnostics, not fallback scenes.
- Cross-tab notifications trigger a durable reread. They never silently rebase
  an inspector draft. A stale recovered draft remains available for manual
  reconciliation; structural controls cannot discard an unsaved inspector edit.

## Executed evidence and costs

- `npm run test:notebook`: 12 tests, identity/atomicity, scope, reuse, dependency
  signatures, malformed inputs and stale writes.
- `npm run test:matrix-source`: 15 existing tests, including numeric admission,
  immutable editions and source-session preservation after extracting the guard.
- `npm run typecheck:notebook`: complete notebook consumer and shared guard pass
  strict TypeScript checking.
- `npm run visual:notebook`: 10 Chromium tests pass. Actual IndexedDB connections,
  concurrent saves, draft recovery, keyboard operations, export/import, local and
  shared scene changes, fold/move/reload and phone overflow are exercised. The
  production test builds both entries, serves only emitted assets, saves in the
  editor and reopens the reader, samples forward/reverse paint and rejects
  unexpected page errors or failed/external requests.
- `npm run build:notebook`: both HTML entries and their complete assets build.
  Isolated production JS closures measured by the browser test are 368,121 bytes
  (108,776 gzip), 61 modules for the reader; 378,709 bytes (112,423 gzip), 63 modules
  for the editor. These are JS totals, excluding CSS/fonts, not total transfer or
  speed measurements. The combined build emits about 71.5 kB CSS plus existing
  KaTeX font variants. No dependency or semantic animation framework was added.
- `node --disable-warning=ExperimentalWarning --test scripts/verification-impact.test.ts`:
  28 checks pass. The new scoped lane covers the complete notebook consumer;
  both consumers of the shared numeric guard run. Unknown owners retain broad
  gates. Final integration ran through `verify:impact --mode contract`.
- `npm run check:tooling-configs`: four structural tests; 69 Playwright configs /
  164 projects, 14 Vite configs and 14 TypeScript projects checked.
  The new configs required explicit baseline entries. Inspection also found the
  existing `playwright.reader-preparation.config.ts` omitted from its baseline
  since its introduction in `74c56acba`; its unchanged anchored configuration is
  now represented. Existing baseline entries/policies were preserved. This is a
  bounded inventory correction, not a budget increase or disabled consumer.

- `npm run test:project-vision`: 75 checks pass after trimming the active thread
  from 460 words back below its unchanged 450-word startup ceiling. The initial
  overage failed as intended; the full command passed after the prose repair.
  Theseus workspace validation also passes; evidence and receipts are on the task.

Screenshots are disposable products of the stable browser command;
they are not accepted goldens. Full repository tests and a broad supported-browser
visual matrix were not run for this unpromoted exemplar. The preserved fractional
reader responds HTTP 200; its manuscript, compiler and runtime are unchanged.

## Remaining scope and return point

Matrix inputs are the first scoped value type; arbitrary computations are not
implemented. Rich-text cross-block editing, pinned revisions, forks with
provenance, override rebasing, clips and plugin extensibility remain deferred.
Undo is one saved step in this editor session. The JavaScript reader shares
browser-local storage and is not a static public edition. Narrow screens retain
the existing matrix stage's horizontal scrolling.

Review readiness does not establish usefulness, general authoring speed or
learning outcomes. After this bounded checkpoint, retain the approved
authoring-to-practice programme and fractional editorial review as the product
return path. The parked dashboard grill resumes at one primary human focus
versus several equally prominent threads. No older run was silently resumed.

For another session, start with
`theseus work context task.kp.notebook-proof-20261124 --mode brief` and this packet.
The general resume report still has the previously recorded output-budget issue;
the explicit target avoids a broader context load.
