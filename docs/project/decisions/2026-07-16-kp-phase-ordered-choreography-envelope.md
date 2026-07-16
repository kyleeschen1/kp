# 9. Adopt A Phase-Ordered Choreography Envelope

Date: 2026-07-16
Status: accepted

Normative design:
`docs/superpowers/specs/2026-07-16-phase-ordered-choreography-and-gestalt-styles-design.md`

Implementation proposal:
`docs/project/reviews/2026-07-16-phase-ordered-choreography-gestalt-style-loop-proposal.md`

## Decision

Every generated semantic animation should compile its operation-specific motif
inside a shared perceptual choreography envelope:

```text
orient attention
-> reflow persistent entities
-> execute semantic change
-> settle the target
-> release attention
```

The phases are dependency constraints, not fixed percentages. A phase may be
empty when the scene has no corresponding work, but the compiler must record
that omission explicitly. Operation-specific choreography may overlap phases
only when its specification declares the overlap safe and the sampled result
passes conformance.

## Phase Contracts

### 1. Orient Attention

Preview the causal source, destination, or moving group before meaningful
displacement or disappearance begins. Focus is optional when the relevant
entity is already visually dominant, but an omitted preview must not create an
attention gap.

### 2. Reflow Persistent Entities

Move entities that preserve semantic identity toward their final positions
while they remain continuously visible. Reserve destination and transit space
before this phase. Introduced and eliminated entities must not obscure the
persistent reflow.

### 3. Execute Semantic Change

Perform the operation-specific act: transmit, branch, merge, wrap, unwrap,
replace, eliminate, introduce, cancel, or morph structural artifacts. Every
change must be justified by registered operation, correspondence, lineage, and
epistemic data.

### 4. Settle The Target

Finish paths, opacity, scale, enclosure ownership, structural artifacts, and
target alignment. The target scene must be exact and stable before attention
release begins.

### 5. Release Attention

Remove temporary focus, depth, shadow, annotations, and staging artifacts
without changing semantic state or target layout.

## Required Laws

1. Focus reaches its declared threshold before the first focused entity exceeds
   the movement or disappearance threshold.
2. Persistent entities do not fade, remount, or change identity during reflow.
3. Target layout reservations exist before persistent motion begins.
4. Semantic change cannot begin before its prerequisite reflow and attention
   constraints are satisfied.
5. Introduced entities have an explicit source, operation, or pedagogical
   provenance.
6. Eliminated entities remain available until their semantic cause is legible.
7. Settle completes at exact target geometry with zero residual temporary
   transform.
8. Focus release begins only after the target is stable.
9. Rewind mirrors dependencies and preserves the same attention story.
10. Reduced-motion, static, and narrated variants preserve phase ordering and
    salience transfer.

## Dashboard Exemplars

The existing dashboard treatments for function wrapping, fractional exponent
to radical, and linear rearrangement become conformance fixtures. They are
behavioral references for attention lead-in, persistent reflow, semantic act,
and cleanup—not merely visual inspiration.

Generated and editor-catalog animations must use the same compiled envelope and
motif laws. A visually continuous animation that violates perceptual order is
nonconforming even when its raw position and acceleration budgets pass.

## Depth And Shadow

Depth and shadow are presentation-only focus channels. They may express
attention but never semantic hierarchy or truth.

The first experiment should use group-level 2.5D elevation:

- a small positive `translateZ` and optional scale for the focused semantic
  group;
- a soft, reversible shadow that strengthens during orientation and disappears
  during release;
- no rotation initially, because rotation harms mathematical glyph legibility;
- no layout participation: depth must be transform-only and must not affect
  measured x/y geometry;
- reduced-motion mode keeps color/shadow emphasis but removes z travel;
- static mode presents the focused checkpoint without animated elevation.

The experiment must prove that enabling focus depth leaves the underlying x/y
motion path, semantic timeline, and final geometry unchanged.

## Authoring Boundary

LLMs may request salience, focus targets, and a high-level focus treatment such
as `flat`, `elevated`, or `context-dim`. They may not author z coordinates,
shadow kernels, perspective, raw easing, or keyframes. KP selects those values
from trusted presentation profiles and validates the resulting choreography.

## Consequences

- The current operation motif timeline needs a higher-level choreography plan
  and dependency graph.
- Motion quality reports need perceptual-order diagnostics in addition to
  numeric continuity budgets.
- Editor diagnostics should expose envelope phase, focus targets, persistent
  reflow completion, semantic act, settle state, and cleanup state.
- New generated examples must pass dashboard-exemplar conformance before being
  promoted into the editor catalog.
- 3D focus work should follow the envelope contract rather than becoming a
  separate animation system.
- New animations default to the pinned `kp.organic-subtle` gestalt style, while
  renderer-neutral semantic choreography remains substitutable through
  compatible versioned styles.
