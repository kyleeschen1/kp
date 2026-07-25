# Narrow KP to verified semantic-to-interactive compilation

Date: 2026-07-24
Status: accepted; implementation requires the proposed long-loop contract

## Decision

KP's durable technical thesis is **verified semantic-to-interactive
compilation**. Semantic operations and lineage remain authoritative; a
Manim-style glyph reconciliation is the default visual baseline; KP adds the
interactive, responsive, accessible, branchable, and inspectable behavior that
a video-oriented glyph transform does not provide.

The executable path has three layers:

1. **Semantic trace:** a canonical operation executor produces the verified
   target tree, identity, multiplicity, correspondence, and provenance.
2. **Presentation planner:** a bounded, geometry-aware planner reconciles
   glyphs only within semantic lineage and emits an ephemeral backend plan.
3. **Renderer:** a declared-capability backend samples the plan and binds
   interaction affordances to stable semantic entities.

Authoring, LLM drafting, lessons, flashcards, and exports consume or produce
inputs to this path; they do not add more executable animation layers.

The governing visual rule is:

> Always reconcile glyphs within semantic lineage; never derive lineage from
> glyph matching.

When more than one lineage is semantically plausible, the planner must not
invent token continuity. It uses a group-level settle, replacement, or
certified operation boundary instead.

## Durable and ephemeral authority

Keep one durable, renderer-independent animation artifact. It owns:

- semantic objects and canonical operations;
- verified target trees and lineage, including one-to-one, one-to-many, and
  many-to-one multiplicity;
- checkpoints, branches, cards, Cloze selectors, annotations, accessibility
  meaning, and export intent;
- presentation constraints and backend capability requirements.

Glyph matches, measured boxes, clearance schedules, paths, interpolation
tables, and backend lowering decisions are ephemeral plans. They may be
deterministically recomputed and cached, but they must not become a second
durable semantic IR.

## Presentation policy

- Match identical visual glyphs by default only inside established semantic
  lineage.
- Preserve semantic object constancy while allowing glyph fragments to merge,
  split, appear, disappear, or settle at certified operation boundaries.
- Bind hover, focus, annotations, accessibility, and Cloze behavior to stable
  semantic entities and measured hit regions. Moving glyph fragments are
  accessibility-hidden and non-authoritative.
- Replace the universal `orient-reflow-act-settle-release` scheduling rule
  with a geometry-certified clearance schedule. Anticipatory movement remains
  valuable, but reflow may precede, overlap, or follow focal motion according
  to measured dependencies.
- Compile clearance from settled native notation for the active font,
  viewport, direction, and motion preference. Planning must be deterministic,
  inspectable, cached, and backed by a conservative fallback.
- Default compound work to a sped-up sequence of canonical operations. Allow
  optional drill-down into the same trace; never substitute an unexplained
  endpoint jump.
- Keep specialized choreography lesson-owned until two genuinely different
  consumers prove the same structural preconditions, negative fixtures, and a
  measurable advantage over the conservative fallback.

## LLM boundary

LLMs propose a canonical operation and parameters against a closed registry.
The canonical executor, not the LLM's token annotations, produces the target
tree and semantic lineage. A deterministic validator checks any independently
supplied target. Unknown operations, invalid parameters, ambiguous lineage,
and unsupported presentation requirements become explicit
`unknown`/`needs-review` results or conservative fallback, never inferred
animation semantics.

## Backend boundary

Published artifacts must run from static JavaScript and serialized data with
no network, LLM, Python, CAS, or Manim runtime dependency. JavaScript is KP's
primary full-capability renderer because branching, direct seek and rewind,
Cloze, hover, annotations, accessibility, and responsive layout must remain
live in the browser.

KP remains headless. Manim, static SVG, video, image sequences, and future
renderers are optional compilation targets. Every backend declares
capabilities and must preserve, explicitly lower, or reject interactive
features rather than silently flatten them.

## Complexity and promotion budget

This experiment is replacement work, not another parallel subsystem.

- Add no operation-specific scheduler.
- Add no durable glyph IR or backend-specific copy of the animation artifact.
- A new behavior must be a canonical operation, a parameterized planner
  strategy, or lesson-local editorial data.
- The generic planner must replace or shrink existing scheduling policy sites.
  At least one old choreography path must be deleted or reduced before the
  experiment can pass.
- Human review is amortized per new presentation strategy, not per generated
  animation. Unknown instances fall back; only new structural behavior needs
  exemplar review.

## Falsifiable experiment

Test one semantic-constrained matcher, one bounded geometry scheduler, one
JavaScript renderer, and one headless test renderer against:

1. a simple one-to-one solve-x identity/rearrangement;
2. a many-to-one numerator or fraction merge, including a Cloze projection
   from a settled checkpoint;
3. a one-to-many quadratic plus-minus branch;
4. one crowded nested quadratic-formula or completing-square interval at wide
   and phone widths.

The experiment passes only if:

- identity, multiplicity, and ambiguity behavior are exact;
- glyph matching makes no semantic claims;
- branches, direct seek/rewind, hover, annotations, accessibility, and Cloze
  work from the same durable artifact;
- the crowded case either remains clear or visibly chooses the conservative
  fallback;
- published execution is static-JS capable and meets explicit performance and
  payload budgets;
- scheduling-policy sites decrease and at least one old choreography path is
  deleted or reduced; and
- human review finds the result at least as clear as the preserved baseline.

If any case requires an operation-specific scheduling algorithm, stop
investment in a general custom motion planner. One bounded correction is
allowed for an identifiable implementation defect; it may not introduce
bespoke case logic.

On that stop, retain the semantic artifact, canonical execution and lineage,
branching, flashcards and Cloze, accessibility, hover and annotations,
conservative JavaScript checkpoint rendering, and headless export contracts.
High-fidelity motion becomes an authored backend or lesson asset.

## Quadratic checkpoint disposition

The current quadratic presentation is a successful diagnostic exemplar, not a
publication candidate and not evidence for universal choreography laws. Keep
its semantic authorities, branching, graph correspondence, drill-down,
accessibility, review provenance, deterministic visual baseline, and current
implementation available for comparison. Do not continue polishing it under
the existing scheduler, publish it in the Workbench, extract quadratic-specific
rules, or promote its reflow order globally.

The difficult radical handoff remains a separate known residual under
`2026-07-24-kp-radical-cross-renderer-handoff-residual.md`.

## Reason

Small operation rules have not composed reliably into dense algebra. The
resulting crowding, occlusion, missing fraction merges, inconsistent timing,
and growing exception pressure indicate an organizational problem rather than
a need for more quadratic tuning. A semantic-constrained glyph baseline
reduces visual policy while preserving the parts of KP that are
non-redundant: verified meaning, interaction, accessibility, branching,
responsive execution, cards, and headless compilation.

## Consequences

- Existing operation certificates remain evidence but cannot enforce one
  universal reflow schedule.
- Existing specialized choreography is frozen pending proof that the generic
  experiment can replace it.
- The next implementation work is the bounded four-case experiment, not
  quadratic publication or another animation family.
- Failure is informative and terminates custom-planner expansion without
  discarding KP's semantic and interactive product.

## Alternatives considered

- Continue adding operation-specific motifs and scheduler exceptions: rejected
  because it expands code and review burden without a composition law.
- Use unconstrained Manim-style glyph matching: rejected because visual
  equality cannot establish semantic identity or multiplicity.
- Adopt Manim as KP's runtime: rejected because it does not supply KP's primary
  browser interaction, branching, accessibility, and Cloze requirements.
- Keep the current quadratic as the gold exemplar: rejected for publication;
  retained as diagnostic comparison evidence.

## Follow-ups

- Review and approve
  `../reviews/2026-07-24-semantic-glyph-reconciliation-experiment-long-loop-proposal.md`.
- Run the experiment under a typed Theseus contract only after approval.
- At its terminal checkpoint, record `PASS`, `STOP_CUSTOM_PLANNER`, or a
  narrowly evidenced implementation-defect correction.
