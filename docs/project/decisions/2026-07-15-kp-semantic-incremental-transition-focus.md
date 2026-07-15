# 7. Prioritize Semantic Incremental Transitions And LLM Authoring

Date: 2026-07-15
Status: accepted

## Decision

Make semantically informed incremental transitions the active KP product and
runtime focus. The shared editor player remains the clock and surface shell,
but equation rendering should compile rich semantic correspondence into stable
token identity, lifecycle, geometry, and motion rather than replacing whole
KaTeX layers with cross-fades.

Treat whole-equation fading as an explicit diagnosed fallback for incomplete
semantic coverage, not as the successful rendering path. The first proof
cohort should cover solve-x, fraction simplification, function wrapping,
distribution/factoring, exponent/radical artifacts, inequality relation
changes, and matrix entries through one reusable compiler and renderer.

Add a versioned LLM draft format after the compiler contract is stable. The
format should let a model select approved semantic definitions, selectors,
correspondence relations, motifs, and timing intent. KP, rather than the model,
must validate mathematical and lifecycle laws and compile the draft into a
`KpAnimationAsset` and renderer-neutral transition plan. Models must not author
DOM, pixel coordinates, arbitrary keyframes, or unverified target equations.

Follow the equation vertical slice with a minimal semantic `DiagramScene`
surface for nodes, edges, groups, and labels, using the same correspondence and
clock contracts. Defer the six remaining symbolic-family promotions and broad
diagram/layout infrastructure until this compiler path is proven.

## Reason

The visible-player loop proved selection, shared playback, KaTeX and graph
surface dispatch, and exact seek/rewind behavior. It also exposed the next
constraint: the generic equation adapter mounts source and target as whole
layers, retains only one-to-one correspondence, and changes opacity at phase
boundaries. The result is mechanically correct but visually jerky and does not
communicate which terms persist, cancel, split, merge, appear, or change role.

KP already contains most of the lower-level ingredients: a rich
`CorrespondenceMap`, equation motion planning and sampling, selector-aware
generated fixtures, measured token motion, semantic transformations, and a
shared player. Consolidating those parts behind one compiler is higher leverage
than adding more bespoke family animations or polishing cross-fades. It also
creates the typed, deterministic target that LLM authoring needs.

## Consequences

- Rich correspondence becomes canonical runtime input; the existing pair list
  remains a compatibility shorthand.
- Persistent semantic terms receive stable render identities and do not fade
  merely because a phase changes.
- Introduction, removal, cancellation, fan-in, fan-out, role-change, focus,
  and structural artifacts become executable transition relations.
- The editor equation stage must remain mounted across phase changes and apply
  sampled token poses from the shared player.
- LLM output is a constrained semantic draft that is validated and compiled
  locally; invalid or underspecified drafts produce actionable diagnostics.
- A small visual diagram surface follows the equation compiler and reuses its
  identity, correspondence, timing, validation, and fallback doctrine.
- Planned Taylor, Jacobian, Hessian, row-operation, determinant, and eigen
  family promotion is deferred until representative incremental transitions
  pass the shared browser quality gate.

## Alternatives Considered

- Polish the existing whole-layer fades. Rejected because easing cannot express
  semantic identity or lifecycle.
- Add bespoke controllers for each animation family. Rejected because it would
  duplicate clocks, measurement, lifecycle, and authoring logic.
- Let an LLM emit HTML, SVG, or keyframes directly. Rejected because the output
  would not be reliably valid, rewindable, inspectable, or reusable.
- Build a general diagram layout engine before equation motion. Rejected because
  equation fixtures provide the smallest end-to-end proof of the shared model.

## Follow-Ups

1. Approve and execute the 30-slice loop proposed in
   `../reviews/2026-07-15-semantic-incremental-transition-next-step-review.md`.
2. Create `run-contract.kp.semantic-incremental-transition-authoring-v0` only
   after explicit approval, targeting the focused Theseus next action.
3. Stop and re-plan if semantic correctness requires a broad CAS, if stable
   token identity requires unsafe KaTeX internals, or if diagram support grows
   into a general layout engine.
