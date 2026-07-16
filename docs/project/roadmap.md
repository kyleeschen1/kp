# KP Roadmap

Last Updated: 2026-07-16
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

The symbolic manipulation family plan recorded in
`decisions/2026-07-14-kp-symbolic-manipulation-animation-library-plan.md`
closed its first 28-slice implementation loop. The delivery plan in
`decisions/2026-07-14-kp-editor-concrete-animation-library-plan.md` resolved
family sample refs to executable assets and made a verified first cohort
available in the KP editor; it has now closed its 30-slice implementation loop.

## Active Focus

**Phase-ordered choreography and perceptual conformance.** The governed
semantic animation grammar and constraint-planned choreography loop is
complete. The active priority is now to make every operation-specific motif
obey a shared perceptual envelope: orient attention, reflow persistent
entities, execute semantic change, settle the target, and release attention.
The existing dashboard treatments for function wrapping, fractional exponent
to radical, and linear rearrangement are the first conformance cohort.

The accepted correction is recorded in
`decisions/2026-07-16-kp-phase-ordered-choreography-envelope.md`; the
accepted design and 3D/shadow focus experiment are recorded in
`docs/superpowers/specs/2026-07-16-phase-ordered-choreography-and-gestalt-styles-design.md`.
The proposed 30-slice implementation loop is recorded in
`reviews/2026-07-16-phase-ordered-choreography-gestalt-style-loop-proposal.md`.

The execution contract
`run-contract.kp.editor.visible-animation-player-v0` closed its approved
30-slice path on 2026-07-15. Its closeout is recorded in
`reviews/2026-07-15-kp-editor-visible-animation-player-loop-closeout.md`.
The accepted focus change is recorded in
`decisions/2026-07-15-kp-semantic-incremental-transition-focus.md`; its
30-slice candidate loop and end-state expectations are recorded in
`reviews/2026-07-15-semantic-incremental-transition-next-step-review.md`.
After the semantic transition compiler is proven on a representative equation
cohort, KP should expose a constrained LLM draft schema and compiler, then a
minimal visual diagram scene using the same correspondence and shared clock.

That compiler loop completed on 2026-07-15. Its successor decision is recorded
in `decisions/2026-07-15-kp-governed-semantic-animation-grammar.md`; the
completed 30-slice grammar and motion-planning loop is recorded in
`reviews/2026-07-15-governed-semantic-animation-grammar-loop-proposal.md`, with
its outcome in
`reviews/2026-07-16-governed-semantic-animation-grammar-loop-closeout.md`.

The doctrine, composition laws, authoring guide, core interfaces, executable
law checks, pause-time inspection, drill-down hooks, flashcard specs, external
port fixture, programming trace skeleton, equation-frame interpreter path,
dashboard preview interpreter, runtime visual-frame adapters, generated algebra
animation fixtures, generated problem imports, flashcard projections, graph
visual-frame seams, and paused-frame decomposition examples are in place.

The completed concrete-library tranche delivered:

1. distinguish planned family samples from concrete catalog-resolved assets and
   enforce reference closure;
2. project concrete assets into renderer-neutral editor animation descriptors,
   grouped selection, stable links, and visible diagnostics;
3. stabilize solve-x KaTeX measurement, font readiness, overlay handoff,
   seeking, and rewind as the canonical vertical slice;
4. expose the approved algebra cohort, then derivative/tangent and
   integral/area synchronized examples;
5. expose vector, dot/projection, matrix-vector, and composed matrix-matrix
   examples through the same parent runtime clock.

The completed visible-player tranche delivered:

1. renderer-neutral player state, one shared playback session, lifecycle-safe
   controls, surface dispatch, and live diagnostics;
2. a generic KaTeX equation stage with reusable cancelation, simplification,
   wrap, artifact replacement, and relation-flip motifs;
3. visible equation coverage for solve-x, fractions, exponents, radicals,
   function wrapping, distribution/factoring, inequalities, calculus forms,
   and matrix products;
4. a shared SVG graph viewport with live vector scaling, tangent motion, area
   accumulation, dot projection, and synchronized mathematical readouts;
5. exhaustive browser coverage for all 30 pure-equation descriptors at start,
   midpoint, and end plus focused visible motion checks for all four graph
   animations.

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

1. Capture dashboard function-wrap, radical-rewrite, and linear-rearrangement
   treatments as phase-ordered conformance fixtures.
2. Compile a shared orient/reflow/act/settle/release choreography envelope above
   operation-specific motif timelines.
3. Enforce focus-before-motion, persistent-reflow-before-change, and
   settle-before-release laws in static and sampled quality gates.
4. Expose envelope phases and violations in editor diagnostics.
5. Experiment with trusted flat, elevated-shadow, and context-dim focus
   profiles without changing layout, semantic paths, rewind, or accessibility.
6. Gate generated drafts and editor catalog promotion on choreography
   conformance before beginning live prompt or upload ingestion.
10. Expand graph diagnostics from current mesh/conformance checks into richer
   graph transforms and synchronized comparison cards.
11. Defer dynamic package loading until at least one generated animation family
   proves the metadata contract across math, graph, programming, and export
   examples.

## Deferred

- Promotion of Taylor/local linearization, gradient/Jacobian,
  Hessian/optimization, row operations, determinant/inverse, and basis/eigen is
  deferred until the semantic transition compiler passes its representative
  equation and LLM-authoring quality gate.
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
