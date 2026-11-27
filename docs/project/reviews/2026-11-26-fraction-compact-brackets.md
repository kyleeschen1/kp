# Compact classic brackets in the fraction notebook

Outcome: HUMAN_CHECKPOINT. One bounded notebook candidate.

Subsequent correction: [preview scroll distances and endpoint reach](2026-11-26-fraction-preview-scroll-repair.md)
remove the retained 100px pre-animation hold and repair insufficient terminal
scroll space in the inline preview. The original candidate evidence below is
retained as history.

Open http://127.0.0.1:8000/experiments/fraction-notebook/?reading=1#beat.read.
Scroll through the opening reading cues, subtraction and cancellation; reverse.
Look for the original bracket pair and centered equation, a border around the
local group, nearby short cues, and normal spacing between reading-only steps.
Only mathematical transformations hold a cue and reserve scroll travel.
Upcoming text stays visible; no tooltip, gesture gate or scroll snapping returns.

Canonical source: `content/authoring/algebra/fractional-linear-reasoning.article.md`.
Host: notebook `/reader/fraction-notebook-preview/` iframe. Renderer: native
KaTeX/material compositor, with the same fractional-linear asset, operations,
IDs, exact checkpoints and mathematical clock. Presentation changes are scoped
to the notebook preview. Published reading snapshots are not updated.

The measured pin reserves the largest local text/equation combination, without
the old 320px minimum or annotation allowance. The visible brackets use cached
metrics for the current passage, with 16px padding and the existing 14px
text-to-equation-box gap. Their paint bounds change without changing document
positions or remeasuring on scroll. The equation retains its measured native
motion reserve. Reading-only beats have zero extra hold and a 16px gap;
operation beats retain the existing 100px reading lead and 280px animation
interval. Focus follows the current passage without requiring a separate hold.

The default manuscript uses brief cues; equivalence and reversibility reasoning
remains in ordinary prose. Existing saved notebooks retain their own text.
To inspect the new default wording independently of a saved draft, open
http://127.0.0.1:8000/reader/fraction-notebook-preview/#beat.read.
No storage migration or silent rewrite of personal content is included.

Rollback unit: this candidate commit. No renderer migration, new semantic schema,
gesture interception, global spacing policy or catalogue promotion.

Verification:

- `npm run visual:fraction-flow -- --project=firefox`: four desktop/phone cases
  passed in Chromium and Firefox. Bracket geometry, local group sizing, zero
  reading-only holds, centered fit, native wheel input, visible upcoming text,
  bookmarks, reduced motion and Read all. The final added ordinary-text motion
  and reading screenshot assertions passed in both Chromium widths via
  `npm run visual:fraction-flow`.
- `npm run visual:fraction-ridge`: two updated bracket/motion cases passed,
  preserving operation pacing, active material owners and reverse samples.
- `npm run typecheck:fraction-notebook`: passed.
- `node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts tests/fraction-notebook.test.ts tests/semantic-reader-page-shell.test.ts tests/fraction-notebook-object-comment.test.ts`: 23 passed.
- `npm run author:fractional-reading -- --reading reasoning --source content/authoring/algebra/fractional-linear-reasoning.article.md`: checked; not applied to the published reading registry.

Initial checks caught two obsolete test assumptions: migration asserted the old
literal wording despite reading the current manuscript fixture, and the sticky
test assumed the bookmark already sat exactly at the sticky threshold. Migration
now compares with the original fixture's content; the browser checks the measured
sticky position and separately proves ordinary prose moves with scrolling.
No mathematical or geometry failures were waived. Screenshots of animation and
reading-only groups were inspected. Subjective spacing/proximity remains for
human review; broader architecture/typecheck debt is recorded in the prior review.
