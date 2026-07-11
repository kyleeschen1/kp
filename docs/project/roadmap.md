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

**Tutorial-card browser/embed hardening.** The export/embed loop closed on
2026-07-11 with concrete iframe and static-step artifacts. The browser
hardening loop has now added launch-target smoke coverage, iframe dependency
closure, fallback readiness, iframe embed policy and asset manifests,
deterministic seek/nonblank browser probes, programming execution-trace card
samples, authored static-step markers, expanded graph timeline diagnostics,
synchronized comparison shells, and dashboard/API catalog rows for the new
hardening surfaces.

The browser hardening loop is closed. The next implementation choice is between
hosted/package readiness checks, parent-timeline media export sampling, and the
SemanticObject registry/capability loading layer.

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

1. Add hosted/package readiness checks for iframe artifact dependencies,
   fallback behavior, and asset manifests outside the dev server.
2. Start GIF or video export sampling from parent timeline frames after the
   iframe/static-step/browser paths stay stable.
3. Expand graph diagnostics from current mesh/conformance checks into richer
   graph transforms and synchronized comparison cards.
4. Return to the SemanticObject registry and capability loading layer so export
   artifacts can advertise exactly what each card needs.

## Deferred

- Full curriculum and spaced repetition are deferred until object,
  transformation, and computation protocols are reliable.
- GIF/video export is deferred until iframe and static-step artifacts are
  concrete and verifiable.
- Broad Theseus planner infrastructure is deferred unless it directly blocks KP
  roadmap execution.
