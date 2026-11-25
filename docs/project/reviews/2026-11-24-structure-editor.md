# Reader-like structure editor

Subsequent review: the user says “it looks good” and accepts this candidate.
The [unified surface refinement](2026-11-24-unified-notebook-surface.md) is the
approved successor; the evidence and original review packet below remain intact.

Approved by “go” after the ordered agenda; the user selected the existing split
view. This successor covers agenda items 1–3 in one fraction exemplar. The
MathML/custom-typesetter exploration is not selected; KaTeX remains authoritative.
The previous rich editor is a recoverable candidate at `2e87d740f` rather than a
claim of accepted typography. The broader authoring programme remains parked.

## Outcome and boundaries

An author opens Edit beside the Kinetic Press masthead, starts in Vim Normal
mode, and writes in reader-like geometry and background. Ordinary blocks have
stable UUIDs, metadata, an optional title, main text and children. The author can
create, split, merge, move, nest, outdent and fold blocks and change children
between flow, bullets, numbering and outline without losing source identity.

Canonical host: `/experiments/fraction-notebook/`. Versioned JSON owns content;
ProseMirror owns structured editing. The existing fraction compiler, reader,
semantic playhead and KaTeX player retain animation authority. Preserve the
canonical manuscript and public reader. The one animation stays top-level in
this bounded exemplar; ordinary block nesting does not create animation scope.
Typed article fields remain available but are not mandatory for content trees.

Three packages: versioned nested blocks with deterministic migration; structural
transactions and bounded Vim navigation/editing; reader-like split integration
and review. Theseus owns their live status. The rollback unit is the experiment's
model/editor/preview adapters, with earlier draft databases preserved untouched.
No new renderer, full theme inspector, transclusion UI, publication, book index,
or arbitrary animation support. Existing source-aware links/math remain intact.

## Verification and stop

Use model/migration and transaction tests, scoped types, the stable
`npm run visual:fraction-notebook` Chromium entrypoint, native fractional-reader
preservation, full types/architecture, tooling and project-vision checks at
integration. Validate Theseus after durable mutations. Inspect impact selection
before running checks. Test move/undo identity, nested paste, split/merge content,
fold restoration, invalid drafts and legacy recovery. Reserve visual judgment
for the single exemplar; no broad browser certification before review.

Checkpoint coherent verified packages and back up the existing feature branch.
Stop at one human visual/interaction checkpoint, with a working shared-server URL
and inspection instructions. This approved round does not promote a universal
editor or resume the remaining authoring-to-practice programme.

## Candidate evidence and limits

V3 ordinary blocks own UUID, metadata, kind, optional identified title, main
text, children, layout and folded state. Article fields are optional in the data
model. This fraction preview still requires its one top-level animation; removing
it retains the editable draft and last valid preview rather than fabricating a
replacement renderer. V1/V2 databases remain untouched when copied into V3.

Structural operations preserve moved subtree IDs and use one undoable transaction.
Copies reidentify nested objects; cut/paste can retain identity. Merging refuses
a second title, metadata owner or differing layout/kind/fold state. The runtime
transaction boundary enforces the persisted region limits: 200 top-level cells,
200 ordinary blocks total and eight nesting levels. These are bounds, not a
measured whole-book capacity claim.

The Edit toggle retains the chosen split. Shared CSS tokens preserve the reader's
existing geometry while the editor keeps its serif family, light body weight and
matching background. Basic prose Vim starts in Normal mode: i/a/I/A/o, h/j/k/l,
w/b, 0/$, gg/G, visual selection, x, undo/redo. It does not provide full Vim
operators, counts, registers, search or macros. JSON uses the installed CodeMirror
Vim engine. Escape belongs to that engine; Mod-Enter closes its panel. Clicking
inline source enters text-entry mode, including after recovery.

Verification:

- `npm run test:fraction-notebook`: 17 tests pass, covering migration, recursive
  identity, clipboard, limits, structural undo and compiler preservation.
- `npm run visual:fraction-notebook`: all 13 Chromium checks pass, including both
  legacy database recovery paths, Normal-mode input/paste protection, computed
  prose geometry, structural operations, fold restoration, mode transitions,
  inline recovery, conflicting tabs and native player preservation.
- `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: canonical
  reading preservation passes. No broad browser certification was run.
- Full `npm run typecheck`, scoped editor types and final test types pass.
  `npm run check:architecture`, tooling configuration checks, and 75 project
  vision/orientation/dashboard tests pass. The orientation check initially
  rejected overlong startup summaries; they were shortened without raising limits.
- The initial browser run exposed Escape stealing focus from CodeMirror and
  inline recovery leaving prose in Normal mode. Both event-boundary repairs have
  passing end-to-end regressions in the full rerun.
- Production reader closure remains 1,250,344 JS bytes, 308,778 gzip bytes,
  414 modules, with no notebook/ProseMirror/CodeMirror dependencies. The six new
  runtime/style files total 19,403 source bytes; no package was added. Preview
  prose is still replaced per validated update; this round adds no incremental
  dependency engine or whole-book loading claim.

## Human checkpoint

Open **http://127.0.0.1:8000/experiments/fraction-notebook/**. The existing launchd
API/web service is running; the URL returned HTTP 200. Click **Edit**, then **i**
to write. Split a paragraph with Enter, use Tab/Shift-Tab to nest/outdent, and
open **Structure** to add a title, change child presentation or move a block.
Fold children with the gutter triangle, undo, then reload to check persistence.
Click Edit again for the full-width reading.

Judge whether the serif writing surface, geometry and controls make composition
feel direct while keeping the part/whole relationship clear. This is one
reviewable exemplar, not accepted typography or a general editor rollout.
After review, use `theseus work context task.kp.structure-editor-20261124 --mode brief`
to resume the bounded context. Themes/style variables, slash completion,
transclusion/scoping UI, search/indexing, LLM exemplar discovery, cached publishing
and semantic KaTeX folding remain later agenda items. MathML is not selected.
