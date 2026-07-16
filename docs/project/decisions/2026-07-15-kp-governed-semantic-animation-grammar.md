# 8. Adopt A Governed Semantic Animation Grammar

Date: 2026-07-15
Status: accepted

## Decision

Make a governed semantic animation grammar the next KP animation focus. LLMs
and authors describe derivations, provenance, epistemic status, and salience;
KP validates that intent and compiles it through canonical operations, trusted
motion primitives, stable layout, and reversible semantic phases. Generated
content must not select arbitrary coordinates, keyframes, or unregistered
motion behavior.

Canonical operations use a layered vocabulary:

- a small universal core for persistence, introduction, elimination,
  substitution, copying, fan-out, merging, reordering, wrapping, grouping, and
  focus;
- versioned shared domain packs for algebra and later domains;
- namespaced project packs for curriculum-specific and experimental work.

Operations are declarative-first. Their specifications include typed source and
target patterns, stable roles, invariants, correspondence and lineage,
salience intent, motif composition, positive examples, counterexamples,
accessibility behavior, and rewind expectations. A custom-code escape hatch is
allowed only through a stronger review path.

Vocabulary expansion is governed rather than closed. Proposed operations may
enter an experimental preview only when they compose existing trusted
primitives. A genuinely new primitive remains proposal-only until it passes
promotion review. Projects pin operation-pack, motif, planner, and schema
versions; upgrades are explicit and previewable.

## Runtime Contracts

1. Every animation compiles from an explicit derivation graph. An LLM may
   propose missing steps, but each edge names a canonical operation, binds its
   roles, and passes its declared invariants.
2. Operation execution, not screen geometry or text similarity, is the
   authority for identity, persistence, copying, splitting, merging, and
   provenance. Structural matching may suggest import bindings but cannot
   silently settle ambiguity.
3. Equations, diagrams, and code explanations share a renderer-neutral semantic
   scene protocol while retaining specialized node types and layout adapters.
4. LLMs author salience and pedagogical intent. KP's central visual grammar
   selects executable motifs and compiles paths, timing, easing, and layout.
5. Start and end layouts, reserved transit space, semantic waypoints, and paths
   are solved before playback. Active motion must not chase browser reflow.
6. Playback is a reversible semantic event timeline with stable checkpoints,
   not a loose sequence of delays.
7. Hard continuity laws prevent teleportation, fade-and-reappearance of
   persistent entities, source-free copying, discontinuous merges, and wrapper
   replacement of persistent contents. Perceptual quality gates measure
   acceleration, scale discontinuity, collisions, crowding, and salience.
8. Incorrect mathematics or program states remain first-class when explicitly
   typed as hypotheses, misconceptions, invalid steps, or counterexamples. A
   separate disclosure policy determines when the learner sees that status.
9. Unsupported transitions become typed gaps. Generated output never disguises
   missing semantics with a generic cross-fade.
10. Curated dashboard motifs become semantic and perceptual conformance
    fixtures. Generated `wrap` and distribution output must invoke the same
    executable grammar rather than approximate those examples independently.

## Authoring And Trust Contracts

- Source-derived entities and operations retain span-level provenance;
  inferred and pedagogically introduced material is marked separately.
- The KP editor separates semantic edits from presentation constraints. Raw
  timeline overrides are an advanced, visibly non-regenerable escape hatch.
- LLM generation is an iterative compiler loop. KP returns path-specific
  diagnostics and accepts provenance-preserving patches instead of regenerating
  the entire explanation.
- Student exploration, author preview, publication, and canonical promotion
  use progressively stronger trust gates.
- Full-motion, reduced-motion, static, narrated, keyboard, rewind, and scrub
  behavior are part of the motif contract rather than post-processing.
- Existing projects remain pinned to their approved compiler versions. The new
  semantic grammar enters beside the legacy path and becomes default only for
  operations that pass conformance.

## First Proof

Prove the architecture end to end with wrapping and unwrapping, copying and
fan-out through distribution, persistence and repositioning, substitution, and
one intentionally invalid step with delayed correctness disclosure. Use the
existing hand-authored `f( )` treatment as the wrapping conformance fixture.

The proof is complete only when persistent entities never fade or teleport,
copy lineage is inspectable, distribution visibly originates from its source,
layout remains stable through seek and rewind, motion passes continuity and
collision budgets, accessibility variants preserve the explanation, the KP
editor exposes semantic and presentation controls, compilation is
deterministic, and human review finds the symbolic change understandable
without explanatory prose.

## Consequences

- The existing semantic transition compiler remains the foundation but its
  exact-transform motif selection, centroid motion, generic easing, and
  generated-draft contracts must be generalized.
- Definition promotion now requires executable motif coverage, examples and
  counterexamples, continuity tests, and accessibility behavior.
- Mathematical validity and animation validity become independent axes.
- The minimal diagram surface evolves through the shared scene protocol rather
  than through a separate authoring language.
- Broad symbolic-family expansion pauses until this vertical slice proves the
  grammar and planning contracts.

