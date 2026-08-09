# KP Article V1 RC1 Economics Checkpoint

Date: 2026-08-09
Status: **HUMAN_CHECKPOINT**
Run contract: `run-contract.kp.article-v1-rc1-economics-exemplar-v2`
Slice: `s23-exemplar-gate`

## Decision Requested

Review the economics exemplar and choose one of these outcomes:

1. Accept the RC1 authoring contract and economics cutover, authorizing slice
   24 to freeze `kp.article.v1` and retire the migrated writable duplicates.
2. Keep RC1 provisional and request a bounded repair to the exemplar.
3. Reject the contract and roll back the migration while the legacy readers
   and sources still exist.

Slice 24 has not run. No second lesson or shared lesson API has been promoted.

## Canonical Exemplar

- Sole writable source:
  `content/lessons/economics-demand-shift.kp.md`
- Pinned vignette lock:
  `content/lessons/economics-demand-shift.kp.lock.json`
- Source noise: **24.4%**, inside the approved maximum of 25%.
- Legacy Markdown, layout JSON, and synthesized editor forms remain read-only
  rollback evidence; they are not co-authorities.

The RC1 source compiles into searchable semantic HTML, build-time KaTeX HTML
and MathML, a static reader, the accepted interactive split projection, and a
deck. Layout remains a projection rather than article syntax.

## Review Surfaces

With the development server running, inspect:

- Static/searchable reader:
  `/tutorials/economics/demand-shift/?view=reader`
- Accepted interactive split projection:
  `/tutorials/economics/demand-shift/?enhancement=presenter`
- Deck projection:
  `/tutorials/economics/demand-shift/?view=deck`
- Direct semantic destination:
  `/tutorials/economics/demand-shift/#kp-block-supply-movement`
- Whole-file CodeMirror/Vim editor:
  `/tutorials/economics/demand-shift/?layout=two-column-scroll`, then choose
  **Edit article** in the development toolbar.

The editor supports diagnostics, semantic completion and navigation, source
rename edits, last-valid preview, and transactional `:w`, `:wq`, `:q`, and
`:q!` behavior. Production output contains none of the editor, source-save,
Vim, review-capture, or private authoring-path machinery.

## Preservation and Gate Repairs

This slice did not redesign layout, graph style, salience, or choreography. It
made four bounded gate repairs:

- restored the accepted split stage's opening position while retaining the
  shared shell's inset for other projections;
- made direct/history navigation retain the requested semantic checkpoint
  instead of allowing a later player frame to overwrite it;
- stopped retained captions and player labels from replacing identical DOM
  text on every frame;
- replaced the private `content/lessons/` build path in learner output with a
  stable publication-source identity and restored the kernel public-import
  boundary for shared hashing.

The smallest rollback unit remains the slice commit. The legacy sources and
readers are intentionally retained until an explicit slice-24 approval.

## Verification Evidence

| Gate | Result |
| --- | --- |
| RC1 parser/compiler/language/import/cutover suite | 82 passed |
| Economics preservation suite | 110 passed |
| Atomic source-save suite | 8 passed |
| Compiled publication artifact | 6 passed |
| Tutorial browser suite | 18 passed |
| Accessibility browser suite | 4 passed |
| Whole-article editor browser suite | 5 passed |
| Deck visual/browser suite | 3 passed |
| Universal development toolbar | 9 unit + 4 browser checks passed |
| TypeScript, Svelte, domains, publication freshness, Vite build | passed |
| Reader and dev-review production closure | passed |
| Production authoring-marker scan | no matches |

Performance gate for the production economics route:

- initial transfer: **143,941 / 150,000 bytes**;
- initial script: **104,573 / 110,000 bytes**;
- resources: **31 / 32**;
- CLS: **0 / 0.02**;
- initial longest task: **88 / 120 ms**;
- active p95 update: **1 / 8 ms**;
- active longest task: **0 / 50 ms**;
- active DOM churn: **112 / 120 mutations**;
- graph DOM churn: **6 mutations**.

## Known Repository Baseline Outside This Exemplar

The broad `npm test` command advances through the concept-room architecture
gate, then stops on the pre-existing reader dependency-direction violation:

`src/reader/app/fraction-composition-salience-adapter.ts` imports
`../compiler/fraction-composition-salience-inventory.ts`.

`npm run check:promotion-memory` also stops on pre-existing roadmap drift:
Current Queue item 1 does not name “Apply a 2 × 2 matrix to a vector.” The
matrix item is currently second. Neither failure is in the economics RC1
change set, and neither was concealed or rewritten for this checkpoint.

## Paused Layout Discovery Debt

The inline-sticky, two-column-scroll, and animation-station visual suites still
contain assertions for superseded palette values, compact legacy JSON prose,
local controls replaced by the universal toolbar, and older timing samples.
Those experimental projections remain available but are not promoted by this
checkpoint. Updating or choosing among them would reopen the explicitly
deferred layout-design question and requires a separate exemplar review.

## Promotion Boundary

Fresh approval for slice 24 would authorize only the reviewed promotion:

- rename/freeze the provisional contract as `kp.article.v1`;
- retire migrated writable economics JSON/synthesized forms and the temporary
  compatibility reader;
- run the broad release gate and publish the closeout.

It would not authorize a second lesson migration, layout redesign, executable
article code, prose transclusion, public-site work, or catalogue-wide API
generalization.
