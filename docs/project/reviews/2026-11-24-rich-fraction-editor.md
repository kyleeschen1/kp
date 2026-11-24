# Rich fraction article editor

Approved on 2026-11-24 by “go, give frequent updates”, following the six-part
scope and estimated three-to-five-hour discussion. This is a successor to the
[first split editor](2026-11-24-fraction-notebook-editor.md), whose checked
implementation remains a recoverable checkpoint at `77d72b6ad`.

## Outcome and boundary

One author can edit a typed title and author credits, attach metadata to blocks,
inline objects and a selected phrase, reveal link source on entry, write inline
LaTeX that renders on exit, and edit one occurrence-owned caption. Retain the
half-page editor and existing fraction reader. Preserve persistent identities,
undo, browser-local drafts and the last valid preview, including migration from
the first editor's saved JSON. The user requests the editor's serif character
with lighter text and the rendered reader's smaller, restrained headlines.

Canonical host: `/experiments/fraction-notebook/`; comparison:
`/reader/solve-fractional-linear/?reading=reasoning`. The manuscript remains
`content/authoring/algebra/fractional-linear-reasoning.article.md`. The versioned
notebook JSON owns edits, ProseMirror owns text editing, and native KaTeX displays
inline mathematical source. The existing fraction compiler, document reader,
semantic playhead and native equation compositor retain mathematical/animation
authority. Ordinary readers and the matrix proof remain preserved.

Three outcome packages, tracked only through the successor Theseus contract:
typed article/metadata/migration and typography; inline link/math editing;
occurrence caption and integrated recovery/preservation review. Checkpoint
coherent checked work and push at least hourly. Five hours is an execution
ceiling, with the final thirty minutes reserved for verification and closeout,
not a target. Give frequent user-facing progress updates.

Use focused model/migration tests, affected type checks, the scoped Chromium
exemplar (desktop and phone), production reader dependency erasure and canonical
fraction preservation. Full types/architecture at integration. Do not run a broad
cross-browser aesthetic matrix before human review. The impact selector currently
has no fraction-editor rule; this explicit discovery scope uses the stated
standard verification rather than claiming a production promotion.

## Acceptance and exclusions

The review packet must demonstrate title/byline updates, contextual metadata,
source reveal without identity loss, stable cursor/undo behavior, recoverable
invalid links/math, one local caption, typography, and reload. Metadata is typed
JSON data, never executable renderer authority. Inline LaTeX rendering does not
establish mathematical semantics or animation support. Shared slot editing,
cross-notebook fraction imports, collaborative merging, publication, arbitrary
execution and catalogue-wide editor promotion remain outside this round.

The reversible unit is this experiment's versioned model and editor/preview
adapters. Migration preserves the old stored draft before introducing new fields;
never overwrite unrecognized or invalid saved content. Do not silently reset it.
Review this single exemplar before another family or a general component system.
The broader authoring programme and orientation/dashboard grill stay parked.

## Typed article foundation evidence

The v2 draft represents a typed header, title and author credits; metadata on
identified blocks/inline objects; phrase annotation marks; and an identified
opening caption. The caption's text has one owner and is projected into the
existing first animation moment. It is no longer duplicated in the specification.
The old v1 IndexedDB record remains untouched as a recovery copy. Deterministic
migration preserves existing IDs, text, revision and invalid specification drafts.

`npm run test:fraction-notebook` passes nine checks including migration and
metadata round trips. The Chromium exemplar covers the original preservation
checks plus author/role edits, phrase metadata, caption/reload and byte-for-byte
preservation of the old database. Scoped types, architecture and all 75 project
vision tests pass. Source-aware inline interaction remains the next package.

Typography candidate: Source Serif 4 at its genuine 300 weight replaces Georgia
in the editable article, retaining a serif reading face while achieving lighter
strokes. Title size/line-height/weight follow the reader's 1.3rem/1.4/500 treatment;
the story heading uses its 1.125rem treatment. The existing reader is unchanged.
Desktop and phone captures were inspected; human aesthetic acceptance is pending.

## Inline editing evidence

Links and inline math are identified JSON objects whose source stays editable.
Complete `$...$` and `[label](destination)` syntax converts after cursor departure;
clicking, arrowing in or Backspacing from the right opens a bounded source field.
Enter/Escape or arrowing past a boundary returns to rendered text. Source entry
does not add an undo step. Source edits retain object UUIDs and metadata.
Undo/Redo, composed input, clipboard copies and reload are exercised in Chromium.
Copies receive new identities; originals retain theirs. Invalid imported identity
attributes are rejected at the DOM parser while readable pasted text survives.

The first browser pass exposed an inline hit-area defect and a stale blur callback
that closed source editing during Redo. An inline-block hit target and a focus
epoch at the NodeView lifecycle boundary repair those classes of failure. The
same browser regression now passes without forced clicks or fixed-time sleeps.
Invalid LaTeX or unsupported link destinations remain saved drafts with the last
valid preview; they can be repaired after reload. Links admit web/email/local
paths, never executable protocols. Static KaTeX uses the existing adapter with
opt-in throwing validation; its established callers keep their prior default.

`npm run test:fraction-notebook` passes 12 checks;
`npm run visual:fraction-notebook` passes all 10 Chromium checks, including the
original preservation cases. Scoped and full type checks and architecture pass.
The production reader remains 1,250,344 JS bytes / 308,778 gzip / 414 modules,
with no fraction-editor, ProseMirror or CodeMirror modules in its closure.

Bounded syntax: conversion handles plain, unmarked inline text. Code, formatted
text and annotated phrases remain literal rather than dropping their marks.
This is one inline source field, not a general Markdown parser or display-math
editor. Object and phrase metadata are data; they grant no renderer authority.

## Integrated review packet

Open **http://127.0.0.1:8000/experiments/fraction-notebook/**. The existing launchd
API and web services remain running; this session does not own their lifetime.
The native fractional-reading preservation check also passes:
`npm run visual:anchored-algebra -- --grep 'fractional reasoning'`.
Desktop, phone, rendered inline and open-source views were inspected.
Tooling configuration checks and all 75 project-vision tests pass. The latter
initially caught overlong startup summaries; wording was shortened and existing
budgets retained. Recoverable implementation checkpoints are `c4067bcae` (typed
article) and `ebbe86d17` (inline editing), both backed up on the feature branch.

1. Edit the title and byline directly. Use **Add author**, then **Show details**
   to change that credit's role or JSON metadata. The preview should follow.
2. In plain paragraph text, write `$x/2$` and `[original](/reader/solve-fractional-linear/)`.
   Move the cursor away to render them; click or Backspace into an object to
   reveal source. Try an edit, Undo/Redo and reload. IDs remain in **Show details**.
3. Select ordinary text and choose **Annotate**. Add a JSON note and inspect it
   again after editing nearby prose. Blocks and inline objects have their own
   metadata targets; a phrase annotation does not replace the paragraph's ID.
4. Edit **Opening caption · this occurrence**, then **Show selected passage**.
   Its existing first animation moment uses the new wording. The folded
   specification still exposes remaining wording and supported semantic targets.
5. Judge the lighter serif text, restrained headlines, source-field transitions
   and whether the editor still feels like writing the article itself.

This is a review-ready candidate, not accepted typography or a promoted general
editor. Automated checks establish preservation and recovery, not aesthetic
quality or learning outcomes. Human review is the next gate before generalizing;
the broader authoring programme and orientation discussion remain return paths.
No new package dependencies were added. The experiment adds a v2 codec/migration,
metadata inspector and source-object lifecycle; the existing renderer/compiler
owners remain responsible for animation. Source Serif 4 and KaTeX assets load in
the experiment, while ordinary reader dependency closure is unchanged.

Resume context with `theseus work start task.kp.rich-fraction-editor-20261124 --mode brief`
after the user's exemplar feedback, and use the supported transition commands to
record acceptance or a bounded repair. Do not infer another implementation scope.
