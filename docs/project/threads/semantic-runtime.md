# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-10
Current Next Action: Promote the synchronized equation/graph sample into a live
rendered tutorial card driven by `KpTutorialCardManifest`.

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

- What parent timeline shape best composes child timelines, pauses, focus, and
  annotations while preserving exact rewind semantics?
- How should `KpTutorialCardManifest` resolve into live equation, graph, and
  layout render surfaces without one-off page code?
- What is the smallest useful programming `SourceFile` object that can expose
  stable source-range selectors?
- Which KaTeX transform fixture should be the first generated from semantic
  definitions rather than curated fixture data?

## Links

- `docs/project/strategy.md`
- `docs/project/roadmap.md`
- `docs/project/reviews/2026-07-10-semantic-runtime-roadmap-loop-closeout.md`
- `docs/superpowers/specs/2026-07-10-derive-representation-capability-design.md`
- `docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json`
- `docs/theseus/events/2026-07-09-semantic-tutorial-system-design-decisions.md`
- `docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md`
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
