# Canonize Motion-Passage Vocabulary And The Publication-Authoring Horizon

Date: 2026-08-07
Status: accepted

## Decision

Adopt the vocabulary in
`../principles/motion-passage-vocabulary.md` as the canonical language for KP
lesson documents, motion passages, stages, narrative tracks, passages, motion
blocks, progress controls, projections, and station behavior.

Adopt the ordered work horizon in
`../reviews/2026-08-07-motion-passage-publication-authoring-next-step-review.md`.
The immediate tranche is:

1. refine the stacked-projection station and progress-rail rhythm;
2. repair the static-publication and Svelte/CSS/JavaScript route boundary;
3. port the approved progress grammar to the split projection;
4. complete the practical CodeMirror authoring loop; and
5. build robust floating table-of-contents and motion-passage navigation.

This order is the durable source for successive loops in this workstream. A
Theseus run contract may execute a reviewed subset in more detailed slices,
but it must preserve the ranking unless a later accepted decision explicitly
changes it.

## Reason

The work had accumulated several names for the same layout element and several
meanings for terms such as `card`, `row`, `column`, and `block`. That made it
difficult to distinguish authored content, interaction behavior, projection,
and runtime motion. The canonical vocabulary preserves those seams.

The prior roadmap placed the editor ahead of unresolved reader choreography
and publication closure. Refining one visual exemplar first makes the desired
interaction concrete. Repairing static publication and route ownership next
prevents the same runtime-heavy boundary from being copied into a second
projection. Only then should KP prove projection parity, finish the practical
editor, and add navigation over stable published structure.

## Consequences

- The economics stacked projection is the canonical visual exemplar for the
  first tranche and must stop at a human checkpoint before generalization.
- The lesson-card editor review remains valid but moves to rank 4; its
  structured-record and single-active-CodeMirror boundaries remain unchanged.
- Static prose, KaTeX HTML/MathML, initial SVG, semantic links, reserved
  controls, and a table-of-contents outline belong in published HTML. Svelte
  and custom elements progressively enhance that truth.
- Stacked and split projections consume the same layout-neutral semantic
  station state: active motion passage, active passage or cue, phase, semantic
  progress, checkpoint, and ownership.
- The separate animation-library promotion ordering is unchanged. Lisp and
  tabled linear-algebra work are not silently reranked or reopened.
- Existing ambiguous identifiers are migrated only in bounded touched areas;
  this decision does not authorize a mass rename.

## Deferred Horizon

After the immediate tranche, the accepted order is: a multi-step algebra
caller; extraction of the shared motion-passage and vignette authoring
contract; named single/representative/stress performance profiles; advanced
CodeMirror capabilities; Canvas/WebGL salience adapters and 3D optical parity;
then SvelteKit and the larger Internal Studio/Public Web products.

## Alternatives Rejected

- **Editor first:** it would optimize authoring around interaction and
  publication boundaries that are still changing.
- **Split and stacked work in parallel:** it would duplicate experimental
  choreography and route debt before one exemplar is approved.
- **Immediate universal lesson schema:** two visual projections do not yet
  prove the complete authoring boundary.
- **Drop light mode or framework-neutral assets:** neither is necessary to
  reach the performance target, and both would prematurely narrow product and
  accessibility options.

## Follow-Up

The exact many-slice proposal is recorded in
`../reviews/2026-08-07-motion-passage-publication-authoring-long-loop-proposal.md`.
It does not become executable until the user explicitly approves that exact
contract.

