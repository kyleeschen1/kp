# Rendering And Time Protocol Design

## Summary

Kinetic Press needs a shared rendering and time protocol that works across
KaTeX equation motion, WebGL graphs and simulations, code/programming
visualizations, and future instructional object types.

The protocol should answer one central question:

```text
given object state + selected time + layout context, what exactly should render?
```

The result should be deterministic and addressable. A reader, author, scrubber,
scroll position, comment, link, or test should be able to travel to any point in
an object's lifecycle and get the same sampled render state.

This is similar in spirit to the browser Web Animations API, but KP needs a
semantic version. Browser APIs animate DOM properties. KP timelines animate
semantic objects, selectors, correspondence maps, render plans, layout boxes,
and backend-specific render nodes across DOM, SVG, Canvas, WebGL, and code
views.

## Context From Existing Specs

The same-day design docs establish several constraints this protocol should
honor:

- Branchable object history defines immutable revisions, pinned object-time
  refs, live refs, timelines, and derived render caches.
- Structured instructional objects define object records, selectors,
  capabilities, transformations, and correspondence maps.
- Operation-first equation motion defines semantic transformations that compile
  to lifecycle-aware, tweenable motion plans.
- KaTeX WebGL transitions prove the need for a render-node overlay that can
  animate DOM-derived visual tokens while preserving semantic DOM.
- Graph rendering already has deterministic surface morph samplers, but its
  playback API is not yet unified with equations or code.
- Dependency manifests require timelines, render capabilities, samplers, and
  backend renderers to be loadable independently.

The protocol in this document is the missing bridge between those systems.

## Goals

- Provide one progress/time contract for equations, graphs, simulations, code,
  and layouts.
- Make all animations sampleable at arbitrary time.
- Support forward playback, rewind, scrubbers, scroll-driven playback, external
  clocks, and tests from the same sampler.
- Allow animations to compose in sequence, in parallel, in nested layouts, and
  through links between object parts.
- Keep semantic state separate from measured layout state and renderer caches.
- Preserve identity across DOM nodes, WebGL objects, SVG elements, code spans,
  and generated render artifacts.
- Let renderers translate a sampled frame into backend-specific output without
  owning semantic truth.
- Support pinned historical states and live editor states explicitly.
- Allow domain libraries to provide render, animation, simulation, execution,
  and analysis capabilities without loading every capability up front.

## Non-Goals

- Replace browser rendering APIs.
- Store every sampled animation frame as canonical document state.
- Require every object type to be animated.
- Make one renderer handle DOM, SVG, WebGL, and code directly.
- Solve collaborative editing or branch merging.
- Force all layouts to be known before measurement. Some render plans need a
  measurement pass before their final sampled frame can be rendered.

## Core Vocabulary

### Object State

Object state is semantic data resolved from a revision, live edit session, or
simulation/execution state.

```ts
interface KpResolvedObjectState {
  readonly ref: ObjectRef;
  readonly object: KpObjectRecord;
  readonly snapshotId: RevisionId | "live";
}
```

Object state is not a DOM node, WebGL mesh, KaTeX span, or syntax-highlighted
HTML range. Those are visual representations derived from state.

### Selection

A selection is a semantic subpart of an object, not a renderer-specific node.

Examples:

```text
equation eq1 left term x
matrix A row 2 column 1
graph saddle surface mesh vertex channel
code file main.rs function parse_expr
execution trace frame 4 local variable value
```

Selectors are resolved by object capabilities. Renderers consume selector
identity; they do not invent it.

### Timeline

A timeline is deterministic animation intent plus sampling rules.

```ts
interface KpTimelineSpec {
  readonly id: TimelineId;
  readonly sourceRef: ObjectRef;
  readonly targetRef?: ObjectRef;
  readonly affectedRefs: readonly ObjectRef[];
  readonly duration: KpDuration;
  readonly tracks: readonly KpTrackSpec[];
  readonly correspondenceMaps?: readonly CorrespondenceMapId[];
}
```

The timeline stores the recipe, not all frames.

### Clock

A clock supplies time. It does not know semantic object structure.

```ts
interface KpClock {
  readonly kind: "manual" | "raf" | "scroll" | "media" | "external";
  now(): KpTime;
  subscribe(listener: (time: KpTime) => void): () => void;
}
```

Examples:

- manual clock for tests and scrubbers
- RAF clock for normal playback
- scroll clock for scrollytelling
- external clock for synced media or collaborative playback

### Playhead

A playhead maps clock time, scroll position, or direct input to timeline time.

```ts
interface KpPlayhead {
  readonly timelineId: TimelineId;
  readonly direction: 1 | -1;
  readonly time: KpTime;
  readonly progress: NormalizedTime;
}
```

Rewind is not a separate animation. It is the same timeline sampled with a
decreasing playhead.

### Render Plan

A render plan is the object capability output before concrete DOM, SVG, or
WebGL nodes exist.

```ts
interface KpRenderPlan {
  readonly id: RenderPlanId;
  readonly root: KpRenderPlanNode;
  readonly dependencies: DependencySet;
}

interface KpRenderPlanNode {
  readonly id: RenderNodeId;
  readonly objectRef: ObjectRef;
  readonly selector?: ObjectSelector;
  readonly role: RenderRole;
  readonly backend: RenderBackend;
  readonly children?: readonly KpRenderPlanNode[];
}
```

### Render Node

A render node is a concrete visual representation registered by a renderer.

```ts
interface KpRenderNodeRecord {
  readonly renderNodeId: RenderNodeId;
  readonly objectRef: ObjectRef;
  readonly selector?: ObjectSelector;
  readonly backend: RenderBackend;
  readonly nodeKind: "dom" | "svg" | "canvas" | "webgl-object" | "texture";
}
```

One semantic object may have many render nodes at once.

## Protocol Flow

The stable flow is:

```text
object ref + selector + time
  -> resolve semantic state
  -> resolve timeline and correspondence
  -> sample animation state
  -> produce render frame model
  -> layout/measure if needed
  -> render into backend nodes
  -> register render-node identity
```

The important rule is that renderers do not decide semantic identity. They only
materialize sampled render frames.

## Sampling Contract

Every animated capability should expose a pure sampler.

```ts
interface KpSampler<TFrame> {
  sample(input: KpSampleInput): TFrame;
}

interface KpSampleInput {
  readonly snapshot: KpDocumentSnapshot;
  readonly timeline: KpTimelineSpec;
  readonly progress: NormalizedTime;
  readonly layout?: KpLayoutState;
  readonly environment?: KpRenderEnvironment;
}
```

Properties:

- `progress = 0` returns the source state.
- `progress = 1` returns the target state.
- Any `0 <= progress <= 1` is valid.
- Repeated sampling of the same input returns equivalent frames.
- Reverse playback samples the same timeline backward.
- Effects that look random must use deterministic seeds.
- Renderers may cache derived resources, but caches cannot change sampled
  semantics.

## Layout And Measurement

Some render frames depend on layout. KaTeX token motion needs measured token
boxes. Code ranges need line boxes. Graph canvas size affects projection. Layout
therefore participates in the protocol, but it is not canonical semantic state.

Recommended model:

```text
semantic sample
  -> render plan
  -> layout pass
  -> measured layout state
  -> final render frame
```

Layout state can be cached by:

- revision or live edit session
- object ref
- selector
- render mode
- container constraints
- font and device pixel ratio
- time, when layout genuinely changes over time

The cache key must include enough inputs to make reuse safe.

## Composition

The protocol should support timeline composition as data.

```ts
type KpTimelineComposition =
  | { kind: "single"; timelineId: TimelineId }
  | { kind: "sequence"; children: readonly KpTimelineComposition[] }
  | { kind: "parallel"; children: readonly KpTimelineComposition[] }
  | { kind: "stagger"; gap: KpDuration; children: readonly KpTimelineComposition[] }
  | { kind: "link"; source: TimelineMarkerRef; target: TimelineMarkerRef };
```

Composition maps parent time into child time. A split layout can run equation
motion on the left and graph morph on the right from the same parent clock.

Rules:

- Composed timelines still sample their children by explicit progress.
- Parent layouts do not mutate child timelines.
- Links refer to timeline markers, selectors, or object-time refs.
- A child can be replaced with a static sampled frame when it is outside the
  active time range.

## Correspondence And Tracks

Animations become reliable when correspondence is explicit.

```ts
interface KpTrackSpec {
  readonly id: TrackId;
  readonly target: ObjectSelector | RenderNodeSelector;
  readonly relation: CorrespondenceRelation;
  readonly property: KpAnimatableProperty;
  readonly keyframes: readonly KpKeyframe[];
  readonly easing?: EasingName;
}
```

Examples:

- equation token `rhs.7` relation `simplified-to` target `rhs.4`
- matrix row `R2` relation `reordered` target `R1`
- graph surface role `mesh` relation `derived-from` target `donut`
- code variable selector relation `renamed` target renamed identifier
- execution trace variable relation `same` across consecutive frames

Tracks should be semantic first. Backend renderers can lower tracks into CSS
transforms, SVG attributes, WebGL uniforms, buffer updates, or texture quads.

## Renderer Adapter Contract

Each backend implements the same broad lifecycle.

```ts
interface KpRendererAdapter<TFrame> {
  readonly backend: RenderBackend;
  prepare(plan: KpRenderPlan, context: KpRenderContext): KpPreparedRender<TFrame>;
  render(prepared: KpPreparedRender<TFrame>, frame: TFrame): void;
  dispose(prepared: KpPreparedRender<TFrame>): void;
}
```

The adapter can own backend resources:

- DOM elements
- SVG nodes
- WebGL buffers and textures
- Canvas contexts
- syntax-highlight spans
- measured layout caches

The adapter cannot own canonical object state or timeline semantics.

## Domain Applications

### KaTeX And Equation Motion

Semantic operations produce correspondence and token lifecycle tracks. KaTeX DOM
provides layout and accessibility. WebGL or DOM overlays render sampled token
poses. A generic KaTeX visual diff can remain as fallback when no semantic
operation is available.

### WebGL Graphs And Simulations

Graph state changes produce morph or simulation timelines. Surface-mode morphs
already mostly follow this model: the semantic graph state and previous graph
state build a transition, and progress samples a mesh frame. The missing piece
is a public playhead/scrub protocol that can drive graph renderers the same way
equation motion is driven.

Simulations should expose deterministic state samplers:

```text
initial state + simulation parameters + time -> sampled simulation state
```

If simulation stepping is required, checkpoints can be cached, but the visible
state should still be addressed by time.

### Programming Objects

Programming lessons need the same protocol for:

- source code ranges
- AST nodes
- execution traces
- stack frames
- variable values
- compiler diagnostics
- refactors
- tests and test output

Examples:

```text
rename variable:
  source selector -> target selector
  identifier spans fade/move/highlight by correspondence

execution trace:
  trace time -> active statement, stack, heap, stdout, diagnostics

refactor:
  old AST selectors -> new AST selectors
  added/removed/moved code spans animate by semantic relation
```

Code renderers may use DOM spans, Canvas, or WebGL, but selector identity should
come from parse anchors and semantic code capabilities.

## State Layers

At any render point, state can come from several layers:

```text
committed revision snapshot
  + active edit session draft
  + timeline sample
  + simulation/execution sample
  + layout constraints
  + measured layout state
  + renderer cache
```

Only the first two layers are document/edit state. Timeline samples, layout
measurements, and renderer caches are derived.

This distinction matters for branchable history. A pinned object-time ref should
resolve without being affected by later edits, while a live ref explicitly
resolves against the active editor state.

## Linking

Links should target object-time selections, not screen coordinates.

```ts
interface KpObjectTimeSelectionRef {
  readonly objectRef: ObjectRef;
  readonly selector?: ObjectSelector;
  readonly timelineId?: TimelineId;
  readonly time?: NormalizedTime;
}
```

The runtime can then ask the current render index where that selection is
currently represented. If multiple render nodes exist, the link can choose by
layout role, render mode, visibility, or priority.

## Dependency Implications

The compiled dependency manifest should be able to ask for:

- object data chunks
- revision checkpoints
- timeline specs
- correspondence maps
- render capability
- sampler capability
- backend renderer capability
- code parse/query capability
- WebGL graph capability
- texture/font/assets

This lets direct navigation to `timeline:eq1-step3@0.5` load only the equation
object, the needed timeline, the correspondence map, KaTeX render support, and
the appropriate renderer.

## Reliability Rules

1. A renderer must be able to render any valid sampled frame without knowing how
   that frame was reached.
2. A timeline must be sampleable without RAF.
3. Rewind must use the same timeline and sampler as forward playback.
4. Visual effects that allocate resources must be functions of sampled state,
   not one-way imperative events.
5. Semantic selectors must survive render backend changes.
6. DOM/WebGL/SVG nodes must register their object and selector refs in a render
   index.
7. Layout-dependent animation must declare its measurement dependencies.
8. Missing capabilities must produce typed fallbacks, not silent broken views.

## Suggested First Slice

Build a small protocol layer before expanding feature work:

```text
src/runtime/time/
  clock.ts
  playhead.ts
  timeline.ts
  composition.ts
  sampler.ts
  render-frame.ts
  render-index.ts
```

Then adapt one existing path from each domain:

1. Equation motion: wrap `EquationMotionPlan` as a `KpTimelineSpec`.
2. Graph surface morph: expose `setProgress` through the same playhead
   contract.
3. Code view: register render nodes for static code selectors, even before
   code animations exist.

This avoids designing in the abstract. The protocol proves itself only if it can
drive one equation, one graph, and one programming view without special clocks.

## Open Questions

1. Should time be normalized `0..1` everywhere, with duration as metadata, or
   should the core protocol use absolute milliseconds and derive normalized
   progress per timeline?
2. Should layout composition live in the same timeline protocol or in a sibling
   layout protocol that timelines can target?
3. How much of the render index should be persisted for debugging, versus
   rebuilt at runtime?
4. Should simulation time and animation time share one abstraction, or should
   simulation state expose checkpoints plus a separate visual interpolation
   layer?
5. What is the minimum code-domain slice that proves this is not math-only:
   source range highlighting, execution traces, or semantic refactor animation?
