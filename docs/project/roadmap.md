# KP Roadmap

Last Updated: 2026-07-14
Status: active
Active Thread: `threads/semantic-runtime.md`

## Current Source Of Truth

The active direction is to make KP's semantic animation runtime the center of
the project, with the project dashboard as the operational catalog and authoring
surface. The primary artifact is a composable semantic animation; tutorials,
cards, exports, generated solutions, and flashcards are use cases of that
artifact. The ordering principle is:

```text
semantics first
-> runtime second
-> renderers third
-> authoring and generation fourth
```

The accepted long-term plan is recorded in
`decisions/2026-07-13-kp-long-term-semantic-product-plan.md`. KP should keep
turning generated examples and visible demos into reusable semantic objects,
semantic transformations, visual motifs, renderer-neutral frames, dashboard
authoring actions, and verified export inputs before expanding into media,
curriculum, or dynamic package loading.

The current long-term library plan is recorded in
`decisions/2026-07-14-kp-symbolic-manipulation-animation-library-plan.md`.
The next durable expansion is to model major symbolic manipulations across
algebra, calculus, linear algebra, and their graphical equivalents as reusable
semantic animation asset families.

## Active Focus

**KP symbolic manipulation animation library.** KP now has the first encoded
asset-calculus layer and renderer/interpreter seams for humans, LLMs,
generated problem systems, external CAS/program-trace ports, renderers,
exports, and flashcards to compose through one predictable semantic/time
protocol. The current focus is to turn those contracts into a broad library of
major symbolic manipulations across algebra, calculus, linear algebra, and
their graphical equivalents.

The doctrine, composition laws, authoring guide, core interfaces, executable
law checks, pause-time inspection, drill-down hooks, flashcard specs, external
port fixture, programming trace skeleton, equation-frame interpreter path,
dashboard preview interpreter, runtime visual-frame adapters, generated algebra
animation fixtures, generated problem imports, flashcard projections, graph
visual-frame seams, and paused-frame decomposition examples are in place.

The active tranche is now:

1. define a shared symbolic manipulation family schema with semantic objects,
   selectors, transformation definitions, correspondence, visual motifs,
   runtime/visual samples, graph equivalents, generated problem hooks,
   flashcard hooks, and dashboard rows;
2. model canonical algebra manipulations: both-sides operations,
   cancellation, combine like terms, distribution/factoring, fractions,
   exponent/log laws, function wrapping, and inequalities;
3. model canonical calculus manipulations: limits, derivative rules,
   integrals, the Fundamental Theorem of Calculus, Taylor/local
   linearization, gradient, Jacobian, Hessian, and optimization;
4. model canonical linear algebra manipulations: vector add/scale, dot
   product, projection, matrix-vector, matrix-matrix as composed dot products,
   row operations, determinant, inverse, basis change, and eigen examples;
5. attach graphical equivalents honestly: equation graphs, symbolic transform
   mirrored as graph transform, derivative as tangent, integral as area,
   matrix as linear map, Jacobian as local linear map, and Hessian as
   curvature/quadratic form.

The goal remains practical: a KP intermediate representation with composition
laws inspired by category theory and FRP, not a broad abstract category theory
framework.

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
contract is the metadata spine: generated animations, export artifacts, and the
dashboard can agree on what capabilities and packages an animation needs before
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

This is where matrix multiplication can be composed from dot products, and an
animation can edit emphasis without changing semantic truth.

### Phase 4: KaTeX Transform Library

Status: next

Use equations as the proof lab. Generated algebra now has the first reusable
family path for several KaTeX shapes, so the next pressure is to promote the
best family-level definitions into a stronger transform library. Grow transform
fixtures and semantic coverage for:

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

### Phase 7: Animation Composition And Layout Objects

Status: active

Add first-class layout and animation composition:

- row, column, stack, grid, split, tabs, overlay, scroll sequence, pinned stage;
- synchronized panels;
- timeline markers and annotations;
- focus/unfocus as presentation transformations;
- nested animation cards, tutorial cards, and comparison cards.

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

Package executable animations as semantic capsules:

- web component or iframe embeds;
- lazy capability manifests;
- cheap fallbacks before WebGL/Three.js loads;
- GIF, MP4/WebM, and static-step exports.

## Near-Term Priorities

1. Create the symbolic manipulation family schema and dashboard rows that make
   algebra, calculus, linear algebra, and graph-equivalent families comparable.
2. Promote algebra families first because they reuse existing generated
   fixtures and stress token persistence, artifacts, wrappers, inverses, and
   both-sides semantics.
3. Add calculus families next, using derivative, integral, FTC, tangent,
   area, Taylor, Jacobian, and Hessian examples to connect symbolic rules to
   graphical views.
4. Add linear algebra families with dot products and matrix multiplication as
   the first higher-order composition test.
5. Add law checks where composition matters: correspondence composition,
   graph representation preservation, flashcard prompt/reference consistency,
   generated problem provenance, and rewind.
6. Move generated fixture family maturity from status rows into actionable
   authoring controls: create fixture, inspect closure, open sample, run smoke,
   and compare variants.
7. Harden `/api/compile`, export/embed boundaries, and future hosted capsules
   with explicit size, schema, error, auth, CSP, and dependency policies before
   inviting broad external input.
8. Start GIF or video encoder integration only after the frame-sequence JSON
   artifact, HTML preview, browser probe, rewind check, dependency manifest,
   and capability package manifests stay stable.
9. Expand graph diagnostics from current mesh/conformance checks into richer
   graph transforms and synchronized comparison cards.
10. Defer dynamic package loading until at least one generated animation family
   proves the metadata contract across math, graph, programming, and export
   examples.

## Deferred

- Full curriculum and spaced repetition are deferred until object,
  transformation, and computation protocols are reliable.
- GIF/video encoder integration is deferred until the frame-sequence artifact
  format and capability package manifests are accepted as the encoder input
  contract.
- Dynamic package loading is deferred until package manifests stay stable across
  generated animation families and broader render domains.
- Large media, graph, and curriculum loops are deferred until the KP Asset
  Calculus doctrine/laws are captured well enough for future LLM sessions to
  follow them without rediscovery.
- Broad Theseus planner infrastructure is deferred unless it directly blocks KP
  roadmap execution.
