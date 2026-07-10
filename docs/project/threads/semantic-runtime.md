# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-10
Current Next Action: Define the derive/representation capability and connect it
to object metadata, dashboard rows, and sample targets.

## Goal

Make KP's semantic runtime the stable spine for equations, graphs, diagrams,
code, layouts, and tutorial cards.

## Current Decision

Use `SemanticTransformation` as the category-consistent name for
structure-preserving operations. Keep semantic truth separate from visual
motion. Visual motifs communicate persistence, focus, cancellation,
simplification, wrapping, morphing, and emphasis, but they are not the
semantic operation itself.

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

- What is the smallest useful registry shape for metadata-first object loading?
- How much of derive/representation should be generic versus domain-owned?
- How should editable transformation trees store presentation-only pauses,
  focus, and emphasis without mutating semantic structure?
- Which KaTeX transform fixture should be the first generated from semantic
  definitions rather than curated fixture data?

## Links

- `docs/project/strategy.md`
- `docs/project/roadmap.md`
- `docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json`
- `docs/theseus/events/2026-07-09-semantic-tutorial-system-design-decisions.md`
- `docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md`
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
