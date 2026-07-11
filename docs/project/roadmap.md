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

**Tutorial-card hosted/package readiness and export sampling.** The
export/embed loop and browser hardening loop both closed on 2026-07-11. KP now
has concrete iframe and static-step artifacts, launch-target smoke coverage,
iframe dependency closure, fallback readiness, iframe embed policy and asset
manifests, deterministic seek/nonblank browser probes, programming
execution-trace card samples, authored static-step markers, expanded graph
timeline diagnostics, synchronized comparison shells, and dashboard/API catalog
rows for those surfaces.

The hosted/export sampling loop is now in closeout. It added static-host
fixture roots, packaged iframe/static-step browser smokes, hosted readiness
dashboard/report rows, parent-timeline frame export contracts, synchronized
equation/graph/programming frame sampling, frame-sequence artifacts and
previews, browser probes, rewind checks, frame-sequence dependency manifests,
and metadata-only export capability advertisements. The next implementation
choice should happen after the loop closeout review and should choose between
media encoder integration, broader SemanticObject capability loading, and graph
runtime unification.

## Roadmap Phases

### Phase 0: Project Memory Bootstrap

Status: active

Create the `docs/project` layer, tie it to Theseus, and make long-term strategy
separate from executable run contracts. This phase is complete when the
strategy, roadmap, active threads, decision record, and next-step review exist.

### Phase 1: Semantic Object Foundation

Status: next

Formalize the shared object protocol:

- stable IDs and selector paths;
- immutable structural updates with provenance;
- traits and predicates instead of type explosion;
- capabilities for render, select, derive, execute, transform, compare,
  diagnose, animate, and link;
- a registry that can advertise metadata without loading every capability.

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

1. Close the hosted/package readiness and parent-timeline export sampling loop
   with a short review that records what is proven and what remains runtime
   risk.
2. Decide the next loop: media encoder integration, broader SemanticObject
   capability loading, or graph/visual runtime unification.
3. Start GIF or video encoder integration only after the frame-sequence JSON
   artifact, HTML preview, browser probe, rewind check, dependency manifest,
   and capability advertisements stay stable.
4. Expand graph diagnostics from current mesh/conformance checks into richer
   graph transforms and synchronized comparison cards.
5. Return to the SemanticObject registry and capability loading layer so export
   artifacts can advertise exactly what each card needs.

## Deferred

- Full curriculum and spaced repetition are deferred until object,
  transformation, and computation protocols are reliable.
- GIF/video encoder integration is deferred until the frame-sequence artifact
  format and dependency advertisements are accepted as the encoder input
  contract.
- Broad Theseus planner infrastructure is deferred unless it directly blocks KP
  roadmap execution.
