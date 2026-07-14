# Semantic Runtime Thread

Status: active
Last Updated: 2026-07-14
Current Next Action: Expand KP into a symbolic manipulation animation library
that models canonical algebra, calculus, linear algebra, and graphical
equivalent transformations through the existing semantic asset, runtime frame,
visual frame, dashboard, generated problem, flashcard, and graph protocols.

## Goal

Make KP's semantic runtime the stable spine for equations, graphs, diagrams,
code, layouts, and composable animation cards.

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

The primary authored artifact should now be named an **animation**, not a
tutorial. Tutorials remain an important use case and existing module name, but
the reusable unit is broader: a typed semantic animation can back a lesson, a
comparison card, an embeddable capsule, a generated solution step, a
spaced-repetition prompt, a graph/program trace, or a media export without
changing its semantic core.

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

The generated math family expansion loop then widened that path into a
family-neutral generated algebra catalog. Fraction-expression, exponent,
radical, function-wrap, and distribution/factoring fixtures now share the same
registry, asset bundle, semantic transformation, diagram, trace, flashcard,
tutorial-card sample, export sample, dependency manifest, dashboard row,
sample-action, search-facet, law, diagnostic, and browser-smoke seams. That
means the next work is less about proving that generated math can enter KP and
more about improving the semantic transform library, visual motif defaults,
composition laws, and renderer-neutral frame adoption that those generated
families exercise.

The generated transform-library loop closed on 2026-07-13. It promoted the
generated algebra families into reusable transform definitions, made generated
fixtures consume those definitions, surfaced definition provenance in dashboard
and export manifests, and attached definition-backed visual motif defaults plus
reversible motif timeline laws. This unlocks the next layer: defining a typed
composable animation artifact that can assemble those semantic pieces without
being tied to the tutorial-card use case.

The accepted long-term semantic product plan now gives this thread an ordered
tranche sequence: promote generated families into reusable
`SemanticTransformation` modules, attach visual motif defaults and reversible
timeline laws, define composable animation assets, move
graphs/source/dashboard/export views to renderer-neutral frames, turn dashboard
rows into authoring actions, harden compile/export boundaries, and only then
broaden into media encoders, curriculum/problem generation, spaced repetition,
and dynamic package loading.

The renderer/interpreter integration loop then moved the asset contract toward
real renderer adoption. Runtime visual-frame adapters, KaTeX selector token
refs, DOM geometry frames, dashboard KaTeX previews, scrubber synchronization,
persistent-token rewind laws, representation samples, graph runtime visual
frames, program trace frame previews, generated calculus and linear algebra
imports, flashcard renderer data, cloze masks, predict-next answer state,
lossy external algebra fixtures, programming callstack diagnostics, and a
paused-frame decomposition example are now encoded.

The first animation-library expansion loop then closed on 2026-07-14. It
proved that KP can grow reusable animation families through the existing
contracts rather than inventing a separate path for each demo. The loop added
live equation card runtime/visual-frame adoption, cancellation and artifact
motifs, fraction/exponent/radical/function/matrix/large-operator coverage,
Jacobian/Hessian comparison, Fundamental Theorem of Calculus and Fourier
Transform sample assets, generated problem registry rows, calculus fixtures,
linear algebra fixtures, graph vector runtime consumers, graph rewind laws,
flashcard renderer samples, paused-frame drill-down samples, dashboard
progress rows, and an animation-library readiness closeout.

The next priority is the symbolic manipulation animation library. KP should
model major symbolic manipulations across algebra, calculus, linear algebra,
and graphical equivalents as reusable semantic animation asset families. Each
family should declare semantic objects and selectors, transformation
definitions, identity and correspondence rules, visual motifs, runtime/visual
samples, graphical equivalents where honest, generated problem hooks,
flashcard hooks, law checks, and dashboard/search rows. Generated animation
families, graph/visual runtime unification, tutorial cards, flashcards,
program-trace visualizations, and future media should all use this library
rather than running ahead of it.

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
- composable semantic animation assets with objects, transformations, layouts,
  timelines, visual motifs, checks, render targets, sample/export metadata, and
  dashboard catalog metadata;
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

- What is the smallest symbolic manipulation family schema that covers
  algebra, calculus, linear algebra, and graph-equivalent families without
  becoming a taxonomy sink?
- Which algebra families should become canonical first: both-sides operations,
  cancellation, combine like terms, distribution/factoring, fractions,
  exponent/log laws, wrapping, or inequalities?
- Which calculus examples best prove the symbolic/graph equivalent seam:
  derivative as tangent, integral as area, FTC, Taylor/local linearization,
  Jacobian as local linear map, Hessian as curvature, or optimization?
- How should matrix multiplication, row operations, determinant, inverse,
  basis change, and eigen examples compose from smaller semantic
  transformations and visual motifs?
- Which graph equivalence law should come first: equation-to-graph
  provenance, tangent preservation, area preservation, linear-map matrix
  preservation, or local-linearization preservation?
- Which generated algebra transform families should be promoted first from
  fixture-specific metadata into reusable SemanticTransformation definitions:
  fraction split/merge, exponent lowering, radical rewrite, function wrapping,
  distribution/factoring, simplification, or cancellation?
- What is the smallest `AnimationAsset` v0 that can compile into existing
  generated algebra fixtures, tutorial-card samples, frame-sequence exports,
  dashboard rows, and laws without forcing broad rewrites?
- Which existing examples should become canonical animation assets first:
  `x + 3 = 7`, fraction simplification, exponent/radical rewrite,
  function wrapping, matrix bracket switch, graph morph, or SourceFile trace?
- Which renderer-neutral frame fields should become required across WebGL
  graphs, source-code panels, dashboard previews, and exports now that the
  KaTeX generated fixture path has a preservation law?
- How much generated family coverage is enough before the media encoder path
  consumes it: the current algebra families, a mixed algebra/calculus example,
  or a graph-linked equation example?
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
- What is the smallest `/api/compile` and export hardening slice that protects
  future external ports without slowing the semantic transform library work?

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
- `docs/project/reviews/2026-07-12-generated-fixture-catalog-loop-closeout.md`
- `docs/project/reviews/2026-07-12-generated-math-family-expansion-loop-closeout.md`
- `docs/project/decisions/2026-07-13-kp-long-term-semantic-product-plan.md`
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
