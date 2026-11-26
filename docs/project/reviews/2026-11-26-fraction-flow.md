# Flowing fraction prose and an indented equation

Outcome: HUMAN_CHECKPOINT. One notebook preview; no catalogue rollout.

Open http://127.0.0.1:8000/experiments/fraction-notebook/?reading=1#beat.cancel-additive.
Scroll down and reverse. Upcoming explanatory paragraphs should already be
readable as they enter the viewport, without waiting for a focus state. Text
travels with the document rather than holding beside a symbol. There are no
tooltips, new scroll interception, gesture gates or snap-to-state behavior.
The existing pinned equation and scroll-scrubbed mathematical operations remain.
Judge whether the equation's left placement and visible next item make the
sequence easier to follow.

Canonical source: `content/authoring/algebra/fractional-linear-reasoning.article.md`
and its fractional-linear semantic asset. Host: the notebook's
`/reader/fraction-notebook-preview/` iframe. Renderer: existing native KaTeX and
material compositor. Saved notebook text, IDs, native endpoints, original ridge,
operation scroll distances, outline/bookmarks and Read all are preserved.

User direction supersedes the tooltip treatment. The intervening attention-stop
trial was reported slow and reverted completely before this change. No performance
improvement has been benchmarked here; this candidate removes the extra interaction
rather than attempting to tune it.

The host opts into flowing prose through the existing document theater; prose
presence no longer depends on which annotation is active. Preview CSS removes
sticky paragraph placement and first-line indents. No alternate scroll handler
or mathematical clock is added. Original pacing gaps remain deliberately intact.

The canonical fit planner accepts start alignment for the complete sequence
envelope, with centering still the default for every other caller. The preview
reserves a `--fn-stage-indent` of 1.5rem from the rail, including the planner's
safe gutter. Actual glyphs may sit farther in because the shared envelope also
reserves animation travel. Aligning individual endpoints would make shared
symbols jump at phase changes. This option changes translation only; scale,
containment, endpoint ownership and the vertical fit remain under existing laws.

Rollback unit: this candidate commit (host option, preview CSS, optional fit
alignment, focused tests and evidence). No semantic or authoring migration.
Human review precedes reuse; there is no new generic attention motif.

Focused verification passed:

- `npm run visual:fraction-object-comment -- --project=firefox` (also exposed as
  `npm run visual:fraction-flow -- --project=firefox`): four Chromium/Firefox
  desktop/phone cases. Visible upcoming prose, real document movement, uncancelled
  wheel input, start-aligned fit bounds, native bookmark, reduced motion, Read all,
  and no page/annotation errors. Screenshots inspected.
- `npm run visual:fraction-ridge`: two preservation cases, including native
  material motion, original operation pacing and deterministic reverse.
- `npm run typecheck:fraction-notebook`.
- `npm run test:equation-surface-preservation`: 11 preservation tests.
- `node --disable-warning=ExperimentalWarning --test tests/semantic-reader-equation-responsive-fit.test.ts tests/fraction-notebook-object-comment.test.ts tests/document-reading-attention.test.ts tests/fractional-rising-scroll.test.ts`: 21 tests.

This is an exemplar-discovery check, not production promotion or certification
of all readers. Broader application TypeScript blockers are recorded in the
previous tooltip review; this round does not claim a global typecheck pass.

`npm run check:architecture` fails at its dependency-direction gate on existing
unowned editor-chat/editor-commands/editor-rows modules and notebook-to-experiment
dependencies. Those modules, imports and ownership policy were not changed in
this slice. Later architecture subchecks did not run. No architecture pass is
claimed; this unrelated repository debt remains outside the visual candidate.
