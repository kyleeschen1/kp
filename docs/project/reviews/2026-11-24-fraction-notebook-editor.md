# Fraction notebook: direct editing exemplar

Status: approved by “let's try it” on 2026-11-24; candidate ready for human review.

The user prefers direct Jupyter-like editing in one half of the page, with a
rendered view in the other. They accepted ProseMirror prose with embedded
CodeMirror specification cells, selective metadata disclosure, and the fraction
reading as the visual reference. This is the successor interaction experiment to
the [matrix composition proof](2026-11-24-notebook-proof.md), whose identity/reuse
evidence remains valid without claiming acceptance of its inspector UI.

## Bounded outcome

Write and format prose directly, edit supported fraction-story wording/targets,
and inspect the existing reading alongside it. Start at a resizable 50/50 split.
Keep IDs and operation bookkeeping out of ordinary writing, but expose identity
and the fixed shared animation boundary on request. Recover local drafts after
reload. Invalid specifications retain the last valid preview with visible repair
feedback. Preserve the current reading moment across valid revisions.

Canonical reference: `/reader/solve-fractional-linear/?reading=reasoning`.
Manuscript: `content/authoring/algebra/fractional-linear-reasoning.article.md`.
The fractional asset and lesson compiler own mathematics and allowed targets;
the document theater, native KaTeX and existing semantic playhead own rendering.
New host: `/experiments/fraction-notebook/`. A bounded structured draft owns
editable prose and story fields; the manuscript is an import/projection adapter,
not a second independently editable source. Existing public readers and saved
versions stay unchanged.

Two packages: (1) structured editing/preview boundary and preserved runtime;
(2) split ProseMirror/CodeMirror surface, recovery, focused browser checks and
human review packet. Standard verification: scoped model/projection tests,
affected types, one Chromium desktop/phone exemplar, existing fractional tests,
and Theseus validation. A three-hour ceiling with thirty-minute closeout reserve
is a bound, not a target. Checkpoint coherent verified work and back it up.

The independently reversible unit is this experiment and its bounded preview
adapter. Do not redesign equation choreography or introduce arbitrary execution,
a universal editor schema, broad lesson migration, publication, external editor
changes or cross-notebook fraction semantics. Rich prose is scoped to supported
headings/paragraphs and inline emphasis/code; annotation text remains plain.

## Human checkpoint

Edit a paragraph and see it in the same fraction layout; edit a checked annotation
without restarting the mathematical scene; fold the specification and reveal its
metadata; resize the split and reload. Judge directness, pane balance and whether
the relationship between the edited cell and the reading remains clear.
Stop after this exemplar before extending to another scene family. The broader
authoring-to-practice programme and orientation/dashboard grill remain parked
return paths. Theseus alone tracks package progress.

## Working candidate and review cues

Open <http://localhost:8000/experiments/fraction-notebook/>. The shared launchd
development server serves this checkout; the candidate is development-only.

1. Click a paragraph on the left and write directly. Try a new paragraph, inline
   emphasis, and Undo. The right pane should update in the existing fraction layout.
2. Open **Edit animation specification**. Change one `content` string. Use the
   reader's **Options** navigation to inspect the corresponding mathematical
   moment. Valid revisions preserve that moment without remounting the equation.
3. Try an invalid `focusRefs` target. Repair feedback should appear while the last
   valid preview remains. Reload preserves both the invalid draft and that preview.
4. Fold the specification, use **Show details**, drag the divider, and try
   **Show selected passage** or **Follow selection**. Judge whether the connection
   between the edited cell and the explanation is sufficiently clear.

Drafts and their accepted preview revision live in IndexedDB. A competing tab
cannot overwrite a newer saved revision; its separate draft remains available
in that tab and across reload through session storage, with a download cue.
**Download JSON** preserves the draft's cell UUIDs; this bounded editor has no
file-import interface or cross-notebook fraction imports. The earlier matrix
proof retains that separate composition evidence. Browser storage is not a
repository save or a cross-device backup.

## Evidence and limits

- `npm run test:fraction-notebook`: seven model/projection and existing fraction
  preservation tests pass. Structured schema fixes title/story topology; runtime
  validation rejects duplicate UUIDs, extra authority and unsupported targets.
- `npm run visual:fraction-notebook`: six Chromium checks cover direct writing,
  formatting/undo, UUID allocation, native stage preservation, annotation edits,
  invalid-draft recovery, competing tabs, navigation, phone overflow, origin
  admission and production dependency erasure. Desktop and phone captures were
  inspected; this is review readiness, not visual acceptance or a browser matrix.
- `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: the existing
  canonical reasoning/version-1 preservation check passes.
- `npm run test:notebook` and `npm run visual:notebook`: twelve unit and ten browser
  checks pass after extracting the common atomic IndexedDB record boundary. The
  existing matrix notebook's imports, storage and reader closure remain intact.
- Full `npm run typecheck`, scoped `npm run typecheck:fraction-notebook`, and
  `npm run check:architecture` pass. Tooling declarations add only this scoped
  Playwright configuration and the serve-only Vite plugin; existing input paths,
  policy and limits remain unchanged. No engineering budget was raised.
- `npm run test:project-vision`: all 75 source-linked orientation tests pass.
  `theseus workspace validate` passes with both context receipts closed and the
  contract deferred at `HUMAN_CHECKPOINT` after its two implementation packages.

Browser discovery caught Enter choosing the required story text block as a
generic split target; the editor now explicitly creates a paragraph, and the
browser regression checks unique identities. The initial preview URL had to move
under `/reader/` to honor the existing runtime route contract. The navigation
assertion was corrected to the canonical `initial` state ID. Tooling snapshots
were updated only after reviewing the added configuration/plugin declarations;
the orientation thread was shortened to preserve its existing startup budget.
A later browser run began during Vite's configuration restart and lost its first
page load (connection reset/refused). After restart settled, the complete six-test
suite passed again; the supervised service remained running and the URL returned 200.

Maintenance cost: a bounded fraction schema, ProseMirror/CodeMirror adapter,
development compile endpoint and preview bridge, plus the shared atomic storage
helper now used by both notebook hosts. The ordinary reader does not request
editor modules. A production build of its complete entry closure contains no
fraction editor, ProseMirror or CodeMirror modules (1,250,344 JS bytes / 308,778
gzip across 414 modules, including lazy modules; not a startup payload measure).
The annotation owner gains a validated replacement operation; semantic ownership,
native rendering and animation timing remain in their existing owners.

The remaining judgment is directness, pane balance and orientation. Arbitrary
equation editing, universal nested rich-text semantics, import UI, collaborative
merging and publication remain outside this exemplar. Resume with
`theseus work context task.kp.fraction-notebook-20261124 --mode brief` after review;
do not silently resume the parked authoring programme or generalize the treatment.
