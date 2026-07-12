# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-12
Current Next Action: Expand generated tutorial families and promote more
renderers to consume semantic frames, now that generated linear-solve fixtures
flow through cards, exports, laws, diagnostics, dashboard rows, and browser
smoke coverage.

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

The KP Asset Calculus loop has now encoded the doctrine and laws into source.
It added core semantic asset interfaces, transformation contracts, diagram
composition, behavior sampling, timeline specs, interpreter and port contracts,
flashcard specs, law helpers, pause-time inspection, transformation drill-down
hooks, a linear-solve asset bundle, generated linear-solve flashcards, a
deterministic algebra-trace port fixture, port law checks, a programming trace
asset skeleton, dashboard rows for those artifacts, and an Asset Calculus
readiness report.

The renderer/interpreter adoption loop closed on 2026-07-12. It documented the
asset-to-interpreter-to-frame-to-view boundary, added equation-frame contracts
and preservation diagnostics, made the linear-solve tutorial card consume
semantic equation frames, attached active transformation, selector, inspection,
drill-down, and flashcard refs to those frames, protected export stability,
added selector/diagram/interpreter/flashcard law helpers, added a dashboard
asset-preview interpreter, surfaced the linear-solve asset and generated
linear-solve fixtures through interpreter-backed dashboard rows, and verified
dashboard browser rendering after those changes.

The generated fixture catalog adoption loop established the first generated
tutorial family as a reusable semantic/export/dashboard path. Generated
linear-solve fixtures now cover additive, subtractive, coefficient, two-step,
and fractional cases; produce standard flashcard families and cancellation
drill-down hooks; satisfy fixture reference-closure and renderer-frame
preservation laws; expose algebra-trace port diagnostics for transformation and
rule mismatches; emit generated export dependency manifests; surface dashboard
maturity rows; and have a Chromium smoke fixture for generated iframe rendering.

The next priority is to make those paths less narrow. Generated tutorial
families, media encoders, graph/visual runtime unification, and program-trace
visualizations should all use the asset-calculus framework rather than running
ahead of it.

The renderer adoption path is:

```text
semantic asset -> interpreter -> renderer-neutral frame -> view binding
```

Semantic assets own identity and laws. Interpreters sample those assets for a
target surface and report whether preservation is strict, sampled, lax, or
lossy. Frames carry active object, transformation, selector, drill-down,
flashcard, layout, timing, focus, and diagnostic data without owning DOM or
WebGL resources. View bindings render the frame and keep any concrete DOM,
KaTeX, WebGL, canvas, or export handles as mutable implementation details.
The linear-solve KaTeX card and dashboard preview path are the first converted
examples. The next conversion should turn the generated algebra fixture registry
and dashboard row construction into reusable catalog surfaces, then feed those
same fixtures into tutorial-card and export/sample paths.

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

- How should generated algebra fixture families move from narrow examples into
  a reusable semantic catalog without making the dashboard renderer own the
  registry?
- Which renderer-neutral frame fields should become required across WebGL
  graphs, source-code panels, dashboard previews, and exports now that the
  KaTeX generated fixture path has a preservation law?
- How far should the first generated tutorial family expand before the media
  encoder path consumes it: more linear solves, fractions/radicals/exponents,
  or mixed algebra/calculus examples?
- Which law checks should come next: renderer frame preservation, generated
  fixture closure, port diagnostics, or flashcard prompt/reference consistency?
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
- `docs/project/reviews/2026-07-11-kp-asset-calculus-readiness-report.md`
- `docs/project/reviews/2026-07-12-kp-renderer-interpreter-adoption-loop-closeout.md`
- `docs/project/reviews/2026-07-11-semantic-capability-loading-loop-closeout.md`
- `docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md`
- `docs/theseus/nodes/run-contracts/run-contract.kp.asset-calculus-denotational-protocol-v0.json`
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
