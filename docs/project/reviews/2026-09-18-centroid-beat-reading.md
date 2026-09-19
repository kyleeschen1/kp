# Centroid beat reading trial

Status: HUMAN_CHECKPOINT. The user accepted paragraph/phrase salience, then
paused larger-source transfer and approved this reversible comparison.

## Current trial: text-led rail

The user subsequently approved replacing beat buttons and the separate code
slider with the established rail interface beside text. The same URL below now
shows that trial. The shared equation rail CSS, interval projection, disclosure
viewport anchor and edge-scroll owner are reused; the local adapter measures text
and maps its eight positions into the existing code clock. No new compositor,
animation timeline or source inference is introduced.

Drag the grip, click a rail point, or use Up/Down and Home/End. The first four
thoughts keep the original code stationary; extraction occurs between thoughts
four and five, and renaming between six and seven. Other intervals hold native
code while changing attention. Phrase selection refines evidence without seeking.
Paragraph mode retains its prior controls. The text rail remains the location
owner when a phrase overrides salience. Print hides the rail and grip.

Readable endpoint bounds support automatic scrolling at both viewport edges.
ResizeObserver remeasures rows without changing text position; disclosure uses the
existing viewport anchor. Drag cancellation, capture loss, blur, hidden documents,
format switching and disposal stop edge scrolling. Rail hit areas stay inside a
reserved gutter so they cannot intercept the beginning of a line.

Current evidence: nine unit tests and seven Chromium browser tests pass, alongside
app/node/test types and architecture. Added tests cover piecewise stationary/code
interval mapping, direct rail seeking, bidirectional edge scrolling, cancellation
and font-resized handle alignment. The browser test initially clicked an inline
phrase while intending to select the whole line; moving it to the line start
then exposed the real gutter overlap, which was repaired in layout. The full
browser suite was rerun successfully. The screenshot was inspected.

This remains an eight-beat local discovery trial. Expanded prose occupies more
rail space; a separate nested reason rail and general long-passage timing policy
are not implemented or promoted. The shared edge loop runs only during a drag;
the adapter adds one resize observer and a small pure position mapping. Runtime
cost has not been separately benchmarked. Rollback unit is the text-rail adapter
and its host integration; the accepted paragraph path and source remain intact.

## Earlier beat-button comparison (superseded controls)

Canonical artifact: existing centroid before/after TypeScript and checked
extraction evidence. Host: `/experiments/centroid-reasoning/`. Renderer:
existing native code and token theater. No new motion or source authority.

Review <http://localhost:8000/experiments/centroid-reasoning/?reading=beats#extract>.
Eight authored contributions remain visible. Selecting a line or its gutter
button seeks its declared existing checkpoint and focuses checked code roles.
Three inline phrases refine attention without seeking an already open inspection.
One expandable **Because…** explains why accumulation and division belong together.
The **Paragraphs / Beats** switch preserves the code playhead and salience.
Ordinary scrolling never changes semantic progress. The accepted paragraph
reading remains the default and no-JavaScript fallback.

The units have stable IDs independent of wrapping. For example,
`#centroid-beat.divide` restores its checkpoint and attention directly.
Keyboard Enter selects, Escape clears. Reading return preserves the inspection
entry; switching formats replaces a hidden entry with the visible format control.

Judge whether the exposed reasoning rhythm helps, whether the small gutter
selection is discoverable, and whether the expansion preserves the parent thought.
No green palette, mandatory sequential reveal, automatic scrolling, shared
Article schema, or universal textual primitive is being promoted.

Rollback unit: the beat source, comparison publication/runtime/CSS and tests in
this trial commit. Accepted source, motion and paragraph salience are preserved.
After judgment, reconcile this trial with the still-unfinished second-caller
pressure package. Explanation support and release remain approved downstream.

## Verification

Focused discovery commands:

- `node --experimental-strip-types --test tests/centroid-reasoning.test.ts tests/centroid-extraction.test.ts`
- `npm run visual:code-reasoning -- tests/centroid-reasoning.browser.spec.ts`
- `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit`
- Equivalent compiler command for `tsconfig.node.json`; `npm run typecheck:tests`.
- `npm run check:architecture`

Eight unit cases cover exact source and motion preservation plus unique beat
addresses and known claim/checkpoint references. Browser coverage includes the
accepted five cases and one trial case: persistent prose, expanded reason,
format switch at interior progress, phrase refinement, keyboard selection,
390px viewport with 24px root font, reading return, and direct beat restoration.
The screenshot is disposable; no visual promotion is implied by automated checks.

The first trial test incorrectly expected return to the latest selected beat
after a format switch; it now separately asserts return to the visible format
control and return to a fresh beat entry. A later run was interrupted by Vite
reloading after a source edit; final verification must run with sources stable.
The architecture scanner interpreted class-only selectors passed to a local
`require` helper as imports; qualified element selectors remove that ambiguity.
The impact selector has no focused rule for this exemplar, so the approved
visual-discovery cadence uses focused preservation checks before human review.
