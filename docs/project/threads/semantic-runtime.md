# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-11
Current Next Action: Choose the next implementation loop: hosted/package
readiness checks, parent-timeline media export sampling, or SemanticObject
registry/capability loading.

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

The tutorial-card export/embed loop closed on 2026-07-11. It delivered concrete
iframe export artifacts, static-step sequence artifacts, an export artifact
catalog, a programming tutorial-card sample, generated KaTeX fixture promotion,
graph parent-timeline diagnostics, and a refreshed export/runtime readiness
report card.

The tutorial-card browser hardening loop closed on 2026-07-11. It proved concrete launch paths
and sampled browser surfaces across dashboard launch targets, iframe exports,
static-step exports, programming cards, execution-trace cards, synchronized
comparison cards, iframe asset manifests, fallback readiness, nonblank panel
probes, static-step authored markers, and expanded graph timeline diagnostics.
The remaining browser-hardening work is hosted/package readiness, not basic
launch-path discovery.

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

- Which hosted/package checks best prove iframe asset manifests, fallback
  behavior, and dependency paths outside the dev server?
- What is the smallest useful GIF/video sampler over parent timeline frames?
- How should static-step export choose richer checkpoints from authored parent
  timeline markers, pauses, and annotations?
- Which remaining KaTeX transform fixtures should be promoted from curated
  geometry to semantic transformation definitions?

## Links

- `docs/project/strategy.md`
- `docs/project/roadmap.md`
- `docs/project/reviews/2026-07-10-semantic-runtime-roadmap-loop-closeout.md`
- `docs/project/reviews/2026-07-10-tutorial-card-runtime-loop-closeout.md`
- `docs/project/reviews/2026-07-11-tutorial-card-export-embed-loop-closeout.md`
- `docs/project/reviews/2026-07-11-tutorial-card-browser-hardening-loop-closeout.md`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-browser-hardening-loop-v0.json`
- `docs/superpowers/specs/2026-07-10-derive-representation-capability-design.md`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-runtime-loop-v0.json`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-export-embed-loop-v0.json`
- `docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json`
- `docs/theseus/events/2026-07-09-semantic-tutorial-system-design-decisions.md`
- `docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md`
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
