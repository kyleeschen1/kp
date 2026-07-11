# KP Roadmap

Last Updated: 2026-07-11
Status: active
Active Thread: `threads/semantic-runtime.md`

## Current Source Of Truth

The active direction is to make KP's semantic animation runtime the center of
the project, with the project dashboard as the operational catalog and authoring
surface. The ordering principle is:

```text
semantics first
-> runtime second
-> renderers third
-> authoring and generation fourth
```

## Active Focus

**KP Asset Calculus and denotational animation protocol.** The new priority is
to formalize the small shared asset calculus that lets humans, LLMs, generated
problem systems, external CAS/program-trace ports, renderers, exports, and
flashcards compose through one predictable semantic/time protocol.

The framework should be encoded before the next large product loop. It should
capture the doctrine, typed contracts, executable law checks, authoring guide,
and canonical examples for immutable semantic assets with denotational
time-varying interpretations. The goal is not a category theory framework; it
is a practical KP intermediate representation with composition laws inspired
by category theory and FRP.

**Completed dependency layer.** The export/embed, browser hardening, and
hosted/export sampling loops all closed on 2026-07-11. KP now has concrete
iframe and static-step artifacts, launch-target smoke coverage, hosted fixture
roots, parent-timeline frame-sequence artifacts, and dependency manifests for
those outputs.

The SemanticObject capability loading loop closed on 2026-07-11. It moved the
next dependency layer from
sample-specific capability advertisements into registry-backed capability
package manifests. Equation, Matrix, Graph, SourceFile, and export capabilities
now have package ids, stable capability keys, source refs, dashboard rows,
facet search, tutorial dependency planning, and export closure validation across
iframe, static-step, and frame-sequence artifacts.

Dynamic package loading is deliberately not the next step yet. The useful
contract is the metadata spine: generated tutorials, export artifacts, and the
dashboard can agree on what capabilities and packages a tutorial needs before
KP starts shipping those packages independently.

## Roadmap Phases

### Phase 0: Project Memory Bootstrap

Status: active

Create the `docs/project` layer, tie it to Theseus, and make long-term strategy
separate from executable run contracts. This phase is complete when the
strategy, roadmap, active threads, decision record, and next-step review exist.

### Phase 1: Semantic Object Foundation

Status: active

Formalize the shared object protocol:

- stable IDs and selector paths;
- immutable structural updates with provenance;
- traits and predicates instead of type explosion;
- capabilities for render, select, derive, execute, transform, compare,
  diagnose, animate, and link;
- a registry that can advertise metadata without loading every capability;
- capability package manifests that expose package ids, stable capability keys,
  source refs, target surfaces, load phases, protocols, and views.

### Phase 2: Derive And Representation Capability

Status: next

Add the first-class ability to move between exact semantic representations:

- `Expression -> LaTeX`;
- `Expression -> Graph2D`;
- `Equation -> Graph2D` when classifiable;
- `Graph2D -> LaTeX` only when symbolic provenance exists;
- `Matrix -> LinearMap`;
- `LinearMap -> Matrix` in a basis;
- `Rotation` or `Scale -> Matrix`.

The core rule is provenance honesty: sampled data can expose samples and fits,
but it must not pretend to be exact symbolic math.

### Phase 3: Semantic Transformation Composition

Status: next

Make transformations compose as first-class objects:

- sequence;
- parallel;
- nested/higher-order transforms;
- transformation provenance;
- correspondence composition;
- reversible visual motif timelines;
- editable transformation trees for pauses, focus, and emphasis.

This is where matrix multiplication can be composed from dot products, and a
tutorial can edit emphasis without changing semantic truth.

### Phase 4: KaTeX Transform Library

Status: next

Use equations as the proof lab. Grow transform fixtures and semantic coverage
for:

- fractions;
- radicals;
- exponents and subscripts;
- function wrapping;
- distribution and factoring;
- cancellation and simplification;
- matrix bracket/entry preservation;
- large operators, limits, sums, products, and integrals;
- unusual geometry such as roots, stacked fractions, and wrapped expressions.

Each fixture should clarify identity, artifacts, persistent tokens, and visual
motifs.

### Phase 5: Graph And Visual Runtime Unification

Status: next

Bring graph behavior onto the same clock and transformation model:

- graph surface morphs;
- camera and projection transitions;
- vector transforms;
- tangent line and tangent plane;
- Jacobian and Hessian comparison views;
- local linearization and curvature scenes;
- 2D/3D synchronized equation and graph panels.

Graph renderers should consume sampled frames, not own semantic timing.

### Phase 6: Dashboard As Authoring Catalog

Status: active

Promote the dashboard from project tracker to authoring/catalog surface:

- one row per work item, object, transform, visual, sample, report card, and
  protocol;
- fuzzy search across everything;
- selected-row previews;
- sample actions into live editor cards;
- API sample targets;
- visible blockers, maturity, source refs, and verification records;
- future writeback from structured docs/JSON and Theseus nodes.

### Phase 7: Tutorial Composition And Layout Objects

Status: active

Add first-class layout and tutorial composition:

- row, column, stack, grid, split, tabs, overlay, scroll sequence, pinned stage;
- synchronized panels;
- timeline markers and annotations;
- focus/unfocus as presentation transformations;
- nested tutorial cards and comparison cards.

### Phase 8: Computation, Curriculum, And Cards

Status: parked-next

Build the verified learning layer:

- problem templates and problem instances;
- solution steps and verification;
- assessment items;
- spaced-repetition cards;
- learner memory and review events;
- concept graph with prerequisites, misconceptions, canonical objects, and
  animation motifs.

### Phase 9: Export And Embed

Status: active

Package executable tutorials as semantic capsules:

- web component or iframe embeds;
- lazy capability manifests;
- cheap fallbacks before WebGL/Three.js loads;
- GIF, MP4/WebM, and static-step exports.

## Near-Term Priorities

1. Encode the KP Asset Calculus priority: doctrine, composition laws,
   denotational animation/time protocol, LLM authoring guide, dashboard/Theseus
   refs, and one canonical linear-solve example target.
2. Implement the smallest core IR and law-checking layer only after the
   doctrine is approved: immutable assets, semantic transformations, diagrams,
   behaviors, ports, interpreters, and flashcard specs.
3. Use a generated tutorial family as the first pressure test for the asset
   calculus and capability packages.
4. Start GIF or video encoder integration only after the frame-sequence JSON
   artifact, HTML preview, browser probe, rewind check, dependency manifest,
   and capability package manifests stay stable.
5. Expand graph diagnostics from current mesh/conformance checks into richer
   graph transforms and synchronized comparison cards.
6. Defer dynamic package loading until at least one generated tutorial family
   proves the metadata contract across math, graph, programming, and export
   examples.

## Deferred

- Full curriculum and spaced repetition are deferred until object,
  transformation, and computation protocols are reliable.
- GIF/video encoder integration is deferred until the frame-sequence artifact
  format and capability package manifests are accepted as the encoder input
  contract.
- Dynamic package loading is deferred until package manifests stay stable across
  generated tutorial families and broader render domains.
- Large media, graph, and curriculum loops are deferred until the KP Asset
  Calculus doctrine/laws are captured well enough for future LLM sessions to
  follow them without rediscovery.
- Broad Theseus planner infrastructure is deferred unless it directly blocks KP
  roadmap execution.
