# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-10
Current Next Action: Package the iframe export profile into a minimal
embeddable tutorial-card artifact.

## Goal

Make KP's semantic runtime the stable spine for equations, graphs, diagrams,
code, layouts, and tutorial cards.

## Current Decision

Use `SemanticTransformation` as the category-consistent name for
structure-preserving operations. Keep semantic truth separate from visual
motion. Visual motifs communicate persistence, focus, cancellation,
simplification, wrapping, morphing, and emphasis, but they are not the
semantic operation itself.

## Current State

The first semantic runtime roadmap loop closed on 2026-07-10. It delivered
derive capability metadata, registry capability previews, exact/sampled
representation provenance, transformation composition, correspondence
composition, editable transform tree metadata, visual motif composition,
KaTeX fixture coverage, graph/vector motion diagnostics, synchronized layout
samples, runtime readiness reporting, tutorial-card manifests, and dashboard
roadmap refs.

The tutorial-card runtime loop also closed on 2026-07-10. It delivered runtime
context resolution, parent timeline sampling, synchronized layout binding,
equation and graph frame adapters, a live linear-solve card shell with shared
controls, rewind verification, SourceFile selectors, generated KaTeX fixture
metadata, dependency planning, iframe/static-step export profile metadata, and
a refreshed runtime readiness report card.

## Accepted Scope

- semantic objects with stable selectors and immutable structural history;
- semantic transformations with correspondence and provenance;
- capability-style protocols for render, derive, execute, transform, animate,
  compare, diagnose, and link;
- sampled timelines that can seek and rewind deterministically;
- renderer adapters that consume explicit frames;
- dashboard visibility for the catalog and current samples.

## Out Of Scope

- complete CAS behavior;
- every math adjective as a runtime type;
- visual-only effects without semantic provenance;
- graph animations with a separate timing model;
- curriculum generation before object and transformation protocols stabilize.

## Open Questions

- What is the smallest iframe artifact that preserves manifest identity,
  fallback behavior, controls, and dependency metadata?
- How should static-step export choose checkpoints from parent timeline
  markers, pauses, and annotations?
- What should the first programming tutorial-card panel do with `SourceFile`
  selectors?
- Which remaining KaTeX transform fixtures should be promoted from curated
  geometry to semantic transformation definitions?

## Links

- `docs/project/strategy.md`
- `docs/project/roadmap.md`
- `docs/project/reviews/2026-07-10-semantic-runtime-roadmap-loop-closeout.md`
- `docs/project/reviews/2026-07-10-tutorial-card-runtime-loop-closeout.md`
- `docs/superpowers/specs/2026-07-10-derive-representation-capability-design.md`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-runtime-loop-v0.json`
- `docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json`
- `docs/theseus/events/2026-07-09-semantic-tutorial-system-design-decisions.md`
- `docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md`
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
