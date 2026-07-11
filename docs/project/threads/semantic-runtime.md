# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-11
Current Next Action: Encode the KP Asset Calculus and denotational animation
protocol as the new priority before the next large product loop.

## Goal

Make KP's semantic runtime the stable spine for equations, graphs, diagrams,
code, layouts, and tutorial cards.

## Current Decision

Use `SemanticTransformation` as the category-consistent name for
structure-preserving operations. Keep semantic truth separate from visual
motion. Visual motifs communicate persistence, focus, cancellation,
simplification, wrapping, morphing, and emphasis, but they are not the
semantic operation itself.

Adopt KP Asset Calculus as the next formalization target. KP assets should be
immutable semantic diagrams with denotational time-varying interpretations.
Category theory supplies the composition-law vocabulary; FRP supplies the
`Time -> Frame` denotation for animation. The practical framework should stay
small: assets, semantic transformations, diagrams, timelines/behaviors, ports,
interpreters, law checks, and flashcard specs.

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

The tutorial-card browser hardening loop closed on 2026-07-11. It proved
concrete launch paths and sampled browser surfaces across dashboard launch
targets, iframe exports, static-step exports, programming cards,
execution-trace cards, synchronized comparison cards, iframe asset manifests,
fallback readiness, nonblank panel probes, static-step authored markers, and
expanded graph timeline diagnostics.

The hosted/package readiness and parent-timeline export sampling loop closed on
2026-07-11. It added static-host fixture roots, hosted fallback readiness,
packaged iframe/static-step browser smokes, dashboard/report rows for hosted
readiness, parent-timeline media frame export contracts, equation/graph/code
frame sampling, frame-sequence artifacts and HTML previews, browser probes,
rewind checks, dependency manifests, metadata-only export capability
advertisements, and a closeout review.

The SemanticObject capability loading loop closed on 2026-07-11. It converted
the sample-specific capability advertisement path into registry-backed
capability package manifests for Equation, Matrix, Graph, SourceFile, and
export capabilities. Those packages expose stable ids, capability keys, source
refs, target surfaces, load phases, protocols, dashboard rows, facet search,
tutorial dependency planning, and export closure validation across iframe,
static-step, and frame-sequence artifacts.

The next priority is to encode the asset-calculus doctrine and laws so future
LLM sessions can compose, decompose, inspect, and extend KP assets without
inventing new animation paths. Generated tutorial families, media encoders,
and graph/visual runtime unification should use that framework rather than
running ahead of it.

## Accepted Scope

- semantic objects with stable selectors and immutable structural history;
- semantic transformations with correspondence and provenance;
- asset-calculus composition forms for sequence, parallel, tree/operad-style
  substitution, focus, and representation reinterpretation;
- denotational animation behavior where playback, rewind, scroll, and export
  sample the same `Time -> Frame` meaning;
- external deterministic ports that map CAS/proof/program/LSP traces into KP
  asset bundles with provenance and diagnostics;
- capability-style protocols for render, derive, execute, transform, animate,
  compare, diagnose, and link;
- capability package manifests as the metadata dependency layer before any
  dynamic package loader;
- sampled timelines that can seek and rewind deterministically;
- renderer adapters that consume explicit frames;
- dashboard visibility for the catalog and current samples.

## Out Of Scope

- complete CAS behavior;
- every math adjective as a runtime type;
- a broad abstract category theory framework detached from KP assets;
- visual-only effects without semantic provenance;
- graph animations with a separate timing model;
- curriculum generation before object and transformation protocols stabilize.

## Open Questions

- What is the smallest KP Asset Calculus spec that future LLM sessions can
  reliably follow?
- Which laws should be enforced by TypeScript shape checks, runtime validators,
  sampled equivalence tests, browser/pixel tests, or human review?
- What canonical example should prove the full path first: linear solve,
  generated algebra trace, or program execution trace?
- Which media encoder target should consume the frame-sequence artifact first:
  GIF, MP4/WebM, or a deterministic image sequence?
- What is the minimum dynamic package loader boundary once manifests are stable
  across generated math, graph, programming, and export examples?
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
- `docs/project/reviews/2026-07-11-hosted-package-readiness-export-sampling-loop-closeout.md`
- `docs/project/reviews/2026-07-11-capability-loading-readiness-report.md`
- `docs/project/reviews/2026-07-11-semantic-capability-loading-loop-closeout.md`
- `docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md`
- `docs/theseus/nodes/run-contracts/run-contract.kp.semantic-capability-loading-v0.json`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-browser-hardening-loop-v0.json`
- `docs/superpowers/specs/2026-07-10-derive-representation-capability-design.md`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-runtime-loop-v0.json`
- `docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-export-embed-loop-v0.json`
- `docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json`
- `docs/theseus/events/2026-07-09-semantic-tutorial-system-design-decisions.md`
- `docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md`
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
