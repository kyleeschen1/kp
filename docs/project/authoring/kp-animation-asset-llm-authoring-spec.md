# KP Animation Asset LLM Authoring Spec

Date: 2026-07-17
Audience: LLM authors, Codex sessions, human authors, external-port authors

## Goal

This spec defines the minimum contract for authoring composable KP animation
assets. It is narrower than the general asset authoring guide: the target
artifact is a `KpAnimationAsset` that can be sampled, rewound, inspected,
searched on the project dashboard, exported, decomposed, and composed with
other animation assets.

The short path is:

```text
semantic objects -> selectors -> semantic transformations ->
transformation tree -> timeline/layout/render targets ->
laws/checks -> dashboard facets -> export or renderer consumers
```

LLMs should author the semantic contract first. Visual motifs, DOM nodes,
WebGL buffers, and frame effects are downstream views of that contract.

## Authoring Contract

Use `KpAnimationAsset` as the primary durable unit. Prefer
`createKpAnimationAsset` when assembling from an existing semantic bundle, and
`createKpAnimationAssetBuilder` when constructing a new asset incrementally.

Every authored animation asset must declare:

1. Immutable semantic objects in one bundle.
2. Selectors for all object parts that can persist, appear, disappear, be
   focused, be blanked in a card, or become a renderer anchor.
3. Semantic transformations with source object ids, target object ids,
   preservation labels, correspondence, assumptions, and law refs where known.
4. A transformation tree that encodes sequence, parallel composition, or later
   higher-order composition explicitly.
5. One timeline with stable duration and beat count if the asset is seekable.
6. One layout node when the asset controls composition such as single, row,
   column, stack, tabs, overlay, split, grid, scroll sequence, or pinned stage.
7. Render targets that name the consuming domain: equation, graph,
   programming, dashboard, export, or custom.
8. Checks for reference closure and seek/rewind behavior.
9. Dashboard metadata with stable row id, tags, source refs, and sample target
   ids when available.

Do not encode semantic truth in renderer-local data. DOM spans, KaTeX node
order, WebGL object ids, canvas paths, and CSS state can be derived render
nodes, but they are not canonical semantic identity.

## Composition Rules

Composition must preserve the ability to inspect and travel through time.

Use these defaults:

- Sequence: use a sequence tree when one transformation must complete before
  the next begins.
- Parallel: use a parallel tree when child animations share one progress clock
  and the author wants them sampled together.
- Row or column layout: use layout composition when separate render targets
  should remain independently addressable.
- Child animation references: expose composed children through metadata such as
  `childAnimationIds` and through dashboard facets like
  `component:<animation-id>`.
- Shared clock: make clock coupling explicit with metadata such as
  `clockCoupling: "shared-progress"`.

An animation of composed concepts should be explainable as the composition of
the child animations wherever the semantics allow it. If a composition loses
identity or ordering, mark the check level as sampled, lax, lossy, or
qualitative instead of pretending it is strict.

Current concrete examples:

- `createLinearSolveAnimationAsset()` adapts equation solving.
- `createGraphSurfaceModeAnimationAsset()` adapts graph surface motion.
- `createLinearMapVectorAnimationAsset()` adapts vector motion under a matrix.
- `createProgramTraceAnimationAsset()` adapts SourceFile execution traces.
- `createLinearSolveProgrammingComparisonAnimationAsset()` composes equation
  and programming render targets in a synchronized row layout.

## External Ports

External deterministic systems should map into the same contract.

Examples include:

- a symbolic algebra system that emits objects and solution steps;
- a graphing system that emits functions, curves, vector fields, and sampled
  geometry;
- an LSP or runtime trace that emits source ranges, call frames, locals, and
  dataflow;
- a generated problem system that emits problem instances plus verified
  solution traces.

Port rules:

1. Preserve external ids and source version metadata.
2. Convert values into semantic objects before creating render targets.
3. Convert external steps into semantic transformations.
4. Emit selector correspondence whenever identity is known.
5. Record unsupported or opaque steps as diagnostics, not as silent visual
   effects.
6. Keep fixtures deterministic before connecting live services.
7. Verify that imported assets pass the same laws as authored assets.

External ports should not call renderers directly. They should produce
animation assets that renderers, exports, flashcards, and dashboards can
consume.

## Governed Semantic Motion Operations

New model-authored work should target `kp.llm-animation-draft.v2`, not author a
`KpAnimationAsset` or visual timeline directly. Load
`createKpLlmSemanticMotionOperationCatalog()` and give the model only its exact
pack pins, operation ids, semantic role contracts, motif names, and phase ids.

The catalog currently joins two domain packs to the universal core:

- `kp.algebra@0.1.0` covers the promoted algebra compatibility operations,
  including rational-power succession, distribution, factoring, fractions,
  exponent rewrites, wrapping, and linear equation operations.
- `kp.semantic-motion@0.1.0` covers promoted identity absorption,
  substitution, inequality pivot, derivative and antiderivative rules, dot
  products, matrix-vector traversal, and matrix-matrix cell composition.

An LLM draft names a high-level operation and binds its required semantic
roles. The compiler validates cardinality and references, resolves the exact
pack, and emits a resolved operation containing the existing KP transform type
and its universal core composition. The authoring catalog maps that transform
type to the established visual motif and semantic phases. This is the contract
that makes generated matrix multiplication use `matrix-cell-compose`, for
example, instead of falling back to an unrelated fade.

Models must not provide coordinates, paths, keyframes, timing, per-token
delays, scale transforms, shadows, DOM, or SVG. KP derives those choices from
the selected operation, semantic role bindings, salience plan, measured
layout, and active gestalt style. Missing roles or unknown operations produce
typed repair gaps; they never select a generic animation as a silent fallback.

## Verification

Every new animation asset should have focused tests that prove:

- `validateKpAnimationAsset(animation)` returns no issues.
- `checkKpAnimationAssetReferenceClosure(animation)` passes.
- `checkKpAnimationAssetSeekRewindLaw(animation)` passes or records an explicit
  non-strict level.
- `compileKpAnimationAssetSemanticRefs(animation)` exposes object,
  transformation, timeline, layout, and render target refs.
- `sampleKpAnimationFrameDescriptor(...)` can sample the asset at canonical
  progress values.
- Rewind order mirrors forward order for sequence trees.
- Dashboard rows can find the asset by id, tags, render target kind, object
  type, layout kind, law status, and child component ids.

For LLM-authored additions, write the test before the asset. The first failing
test should usually assert the intended ids, object types, transformation ids,
layout kind, render target kinds, and law checks.

## Dashboard Exposure

All user-facing or author-facing assets should be discoverable through the
project dashboard.

Use `createAnimationAssetAgendaRows` for the cross-domain animation catalog.
Rows should expose:

- animation id and title;
- bundle id;
- timeline id;
- layout kind;
- render target ids and render target kinds;
- object ids and object types;
- transformation ids, types, and definitions;
- check ids, law ids, and check levels;
- source refs;
- child animation ids using `component:<animation-id>`;
- metadata facets for renderer-neutral hints such as `graphMotionKind`,
  `traceKind`, `compositionKind`, and `clockCoupling`.

Dashboard search is text-based. Prefer stable explicit tokens:

```text
layout-kind:row
render-target-kind:graph
object-type:source-file
check:animation.seek-rewind
component:animation.programming.add.execution-trace
```

Keep numeric preview values visible, but avoid letting counts and durations
pollute semantic search results.

## Decomposition and Flashcards

An animation asset should support decomposition at any sampled point:

```text
sample progress -> active phase -> transformation ids -> source/target refs
```

When a learner asks about a paused moment, an LLM should be able to:

1. Identify the active transformation from the sampled frame.
2. Find selector correspondence and preservation claims.
3. Link to or generate a smaller drill-down animation asset.
4. Return to the parent asset with provenance intact.

Flashcards should reference selectors, transformations, and phases rather than
copying presentation output. Useful card forms include:

- cloze over a selector;
- predict the next transformation;
- explain why a transformation preserves value or structure;
- identify which child animation in a comparison owns a phase;
- blank a source range or vector component and ask for the missing value.

## Anti-Patterns

Avoid:

- calling visual effects semantic transformations;
- putting DOM nodes, WebGL handles, wall-clock reads, or random values in
  semantic objects;
- creating a tutorial-only fixture when the artifact should be an animation
  asset;
- composing assets by copying renderer output instead of composing semantic
  transformations and render targets;
- losing child animation ids in comparison or layout assets;
- accepting generated or external steps without law checks or diagnostics;
- making a new type for every template convenience such as "identity matrix"
  when a constructor or property is enough;
- using numeric preview fields as semantic search evidence.

## Minimal LLM Recipe

For a new animation, an LLM should proceed in this order:

1. Choose exact operation-pack pins from the semantic-motion authoring catalog.
2. Declare source, target, and meaningful intermediate semantic entities with
   provenance and epistemic status.
3. Choose registered high-level operations and bind every required role.
4. Author salience intent and disclosure; do not author concrete motion.
5. Compile the v2 draft and repair only the typed rejected paths.
6. Inspect the resolved operation, inherited motif, and semantic phase ids.
7. Compile or adapt the accepted draft into an animation asset and add it to
   the appropriate catalog.
8. Run focused compiler, role-contract, visual, overflow, rewind, and
   accessibility checks before promotion.

The result should be concise enough for an LLM to author, but strict enough
that another LLM can inspect, decompose, compose, and extend it without
guessing at hidden renderer state.
