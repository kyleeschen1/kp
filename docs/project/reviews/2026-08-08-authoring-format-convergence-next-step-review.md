# Authoring-Format Convergence: Next-Step Review

Date: 2026-08-08
Status: recommendation; implementation requires approval

## Recommendation

Design and approve one readable article-level source contract before adding
another lesson, extending CodeMirror, consolidating lesson APIs, or returning
to layout. Use a single representative economics source excerpt to compare
syntax, compilation, editing, and static-publication behavior. Do not migrate
content during the design slice.

## Candidate Ranking

Scores use `5` for stronger benefit or a smaller implementation slice; higher
risk is worse.

| Candidate | Authoring | Stale reduction | Reliability | Reuse | Slice | Risk | Continuity | Recommendation |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Approve one canonical article-source contract | 5 | 5 | 4 | 5 | 5 | 2 | 5 | Do next |
| Immediately migrate economics to a guessed syntax | 4 | 5 | 3 | 4 | 2 | 5 | 3 | Wait for syntax approval |
| Build a multi-step algebra lesson now | 3 | 2 | 4 | 5 | 2 | 3 | 4 | Do after source convergence |
| Consolidate lesson/editor APIs now | 3 | 4 | 4 | 4 | 3 | 4 | 4 | Let economics plus algebra prove the seam |
| Add advanced CodeMirror exploration features | 5 | 1 | 3 | 4 | 2 | 4 | 3 | Defer until it edits the real article |
| Resume motion-passage layout work | 1 | 1 | 2 | 2 | 2 | 5 | 2 | Paused |

## Proposed Sequence

### 1. Approve The Source Contract

Prepare one short but structurally complete sample containing:

- document metadata, headings, ordinary paragraphs, a list, and inline KaTeX;
- a semantic link to a stage object;
- one ordinary passage and one motion-owning passage;
- one stage reference and one motion block;
- stable IDs, with safe derivation where explicit IDs are unnecessary.

Compare three bounded syntax families:

1. the current HTML-comment directives;
2. Markdown block/inline directives, including the previously discussed
   `::kp-link` family;
3. document frontmatter plus ordinary Markdown links such as
   `[price](kp-ref:price-axis)` and sparse block directives.

Judge them by plain-text readability, autocomplete quality, error locality,
round-trip stability, portability to non-KP Markdown tools, and how much
metadata interrupts the prose. The likely best shape is frontmatter for
document-level identity, compact Markdown directives for structural blocks,
and an inline link form for semantic references—but the exemplar should make
that a human decision rather than an inferred standard.

Acceptance criteria:

- one file is understandable as an article without KP tooling;
- prose, math, headings, lists, and semantic-link labels remain searchable and
  statically publishable;
- parsing never evaluates author code and fails with source-located typed
  diagnostics;
- stable IDs, motion ownership, and semantic references survive reorder and
  save;
- the format is framework-neutral and does not mention a stacked or split
  projection;
- CodeMirror can complete directives and repository IDs from the source at the
  cursor.

### 2. Converge Economics Onto One Source

After syntax approval, make the full economics article the sole authoring
source. Compile its lesson document, editable passages, semantic references,
TOC, static HTML/MathML/SVG, and presenter inputs from one typed parse result.
Point CodeMirror at that real file and retain last-valid preview, diagnostics,
undo history, save/recovery, and semantic completion.

Use compatibility readers only for migration. Once parity is verified, retire
the manually maintained layout-specific JSON source and the synthesized
JSON-in-comment buffer rather than keeping three writable truths.

### 3. Pressure It With Multi-Step Algebra

Author one compact multi-step algebra problem through the same source contract.
Use existing KaTeX semantic animation infrastructure and a deliberately plain
presentation; the purpose is to test passage ordering, repeated references,
multiple motion blocks, semantic autocomplete, direct navigation, and static
publication—not to restart layout discovery.

### 4. Consolidate Only Caller-Proven APIs

Compare economics and algebra, then promote only the shared compiler,
document, semantic-reference, editor-session, and publication seams they both
actually require. Retire economics-specific compatibility code adjacent to
each proven replacement. Do not infer a universal vignette or layout schema.

### 5. Reopen Presentation Later

Once authors can produce and revise a coherent lesson without source drift,
return to layout as a projection question. The existing stacked, split,
two-column, and inline-sticky variants remain useful evidence and rollback
fixtures; none is the authoring model.

## Why This Order

The current bottleneck is not rendering capability. KP already has searchable
static publication, semantic IDs, retained animation sessions, direct state
restoration, a useful TOC, CodeMirror/Vim, and strong performance. The defect
is that author intent is divided among several writable representations.
Fixing that boundary makes every later tutorial, editor feature, API cleanup,
and public-site decision cheaper and more trustworthy.

## Explicit Deferrals

- no layout selection or shared station grammar;
- no immediate source migration before syntax review;
- no advanced editor or semantic-history tooling;
- no SvelteKit/Internal Studio/Public Web expansion;
- no change to the animation-library promotion rank;
- no Lisp or matrix checkpoint resolution.

## References

- `../decisions/2026-08-08-kp-pause-layout-and-reconcile-authoring-format.md`
- `../threads/explanation-attention.md`
- `../strategy.md`

