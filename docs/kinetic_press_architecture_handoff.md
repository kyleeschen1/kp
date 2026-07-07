# Kinetic Press Architecture Handoff

## 1. Core Vision

Kinetic Press is a semantic educational media system for creating interactive explanations of math, code, data, science, and technical ideas.

The central metaphor is:

**Kinetic Press creates thousands of interoperable, executable, composable GIFs.**

A normal GIF is dead pixels. A KP “executable GIF” is a small semantic explanation object that can be:

- played, paused, scrubbed, rewound, and fast-forwarded
- embedded in text and annotations
- linked to definitions, tutorials, examples, and prerequisites
- parameterized with new inputs
- composed with other animations
- transformed into flashcards, problem sets, and popups
- queried by an LLM tutor
- rendered as an interactive lesson, slideshow, static diagram, worksheet, or video

KP should not be “just a graphing calculator,” “just a slide generator,” “just a Manim clone,” or “just an AI tutor.”

KP is a **semantic media runtime and authoring system**.

The core architecture principle:

**The semantic lesson graph owns meaning. Renderers own pixels. Timelines own time. Observers report browser side effects.**

---

## 2. High-Level Architecture

The system should be organized in layers:

```text
Authoring API / LLM patches
        ↓
Semantic lesson graph
        ↓
Transformation tree
        ↓
Presentation state
        ↓
Renderer-independent render plan
        ↓
Renderer adapters
  SVG / HTML / WebGL / Canvas / static export
        ↓
DOM / WebGL runtime
        ↓
Observers + animation drivers
```

Browser APIs such as `MutationObserver`, `IntersectionObserver`, `ResizeObserver`, Web Animations API, D3, SVG, Canvas, and WebGL should live at the edges.

They should not define the core meaning model.

---

## 3. Package Layout

Suggested package separation:

```text
@kp/core
  IDs, object refs, selectors, semantic object protocols, object graph

@kp/lesson
  lesson model, sections, slides, rich text, annotations

@kp/transform
  transformation trees, correspondence maps, validity annotations

@kp/presentation
  view state, focus, folding, composition layouts, TOC anchors

@kp/render-core
  render tree, render nodes, render index, renderer protocol

@kp/render-svg
  SVG renderer, D3 helpers if useful, SVG hit targets

@kp/render-html
  rich text, popups, labels, controls, overlays

@kp/render-webgl
  vanilla WebGL / Three.js renderer, no React dependency

@kp/render-hybrid
  WebGL geometry + SVG/HTML semantic overlay

@kp/animation
  timeline runtime, animation intents, WAAPI/RAF/scroll/manual drivers

@kp/observers
  MutationObserver, IntersectionObserver, ResizeObserver adapters

@kp/runtime
  orchestration, event bus, lifecycle, selection manager, seek engine

@kp/authoring
  TypeScript/JavaScript authoring API, compiler to KPIR

@kp/llm
  object cards, action cards, patch schemas, validators, context packets

@kp/components
  Web Components for player/editor/view shells

@kp/devtools
  inspector, render tree viewer, timeline debugger, mutation log
```

Dependency direction should be mostly downward:

```text
authoring → core/lesson/transform
runtime → core/presentation/render/animation
renderers → render-core/core
components → runtime/renderers
```

Core semantic packages should not depend on DOM APIs.

---

## 4. Semantic Object System

KP should use a protocol-based object system.

The system should not have a permanently closed list of object types. Built-ins such as `Matrix`, `Equation`, `FunctionObject`, `Graph2D`, `Graph3D`, `Table`, and `CodeFile` should be standard library objects, not privileged architecture.

The main design principle:

**KP defines what objects must be able to say about themselves, not exactly what objects must be.**

Example protocols:

```ts
interface KPObject {
  id: ObjectId;
  type: string;
  label?: string;
  describe(context?: LessonContext): ObjectCard;
  serialize(): SerializedObject;
}

interface Selectable {
  selectors(): SelectorSpec[];
  resolveSelector(selector: SelectorExpr): Selection;
}

interface Renderable {
  supportedRenderModes(): RenderModeSpec[];
  renderToPlan(mode: RenderMode, options: RenderOptions): RenderPlanFragment;
}

interface Transformable {
  availableTransformations(selection?: Selection): TransformationCard[];
  applyTransformation(request: TransformationRequest): TransformationNode;
}

interface Linkable {
  links(context?: LessonContext): SemanticLink[];
  popup(selection?: Selection, context?: LessonContext): Popup;
}

interface Computable {
  compute(request: ComputationRequest): ComputationResult;
}

interface Comparable {
  compare(other: KPObject, options?: CompareOptions): ComparisonObject;
}
```

Objects can implement only the protocols they need.

Examples:

```text
Matrix:
  Renderable
  Selectable
  Transformable
  Computable
  Comparable
  Linkable

MalformedEquation:
  Renderable
  Selectable
  Diagnosable
  Linkable

StaticDiagram:
  Renderable
  Linkable
  Annotatable

CodeFile:
  Renderable
  Selectable
  Linkable
  Transformable
  PossiblyComputable
```

---

## 5. Semantic vs Formal Correctness

KP objects should be semantic, but not necessarily formally valid.

This is important because KP must represent:

- invalid student attempts
- malformed expressions
- incomplete ideas
- partially parsed code
- intentionally wrong transformations
- common misconceptions
- pedagogical fictions
- exploratory states

Validity should be an annotation, not a gatekeeping requirement.

Example:

```ts
type ValidityStatus =
  | "valid"
  | "invalid"
  | "unknown"
  | "intentionally-invalid"
  | "partial"
  | "unresolved";
```

A transformation should be representable even when invalid:

```ts
InvalidTransition({
  from: Equation("x + 3 = 7"),
  to: Equation("x = 10"),
  claimedOperation: "move +3 to the other side",
  diagnosis: "sign-error",
  repair: subtractBothSides(3)
});
```

KP is not trying to be Lean or a full CAS. It is trying to be a semantic explanatory medium.

---

## 6. Transformations as First-Class Objects

Transformations are not animations.

A transformation is a semantic event in the lesson object graph. Animation is one possible rendering of that event.

Example:

```ts
RowOperation({
  id: "elim-r2-c1",
  operation: "R2 <- R2 - 3R1",
  purpose: "Eliminate the entry below the first pivot",
  from: A0,
  to: A1,
  inputs: {
    pivot: A0.entry(1, 1),
    sourceRow: A0.row(1),
    targetRow: A0.row(2),
    targetEntry: A0.entry(2, 1),
    scalar: -3
  },
  correspondence: [...],
  validity: { status: "valid" },
  children: [
    SelectPivot(...),
    ComputeMultiplier(...),
    ApplyRowCombination(...),
    UpdateTargetRow(...)
  ]
});
```

Transformation trees are nested and foldable.

They support:

- table of contents
- skipping
- replaying
- folding
- expanding
- drill-down explanations
- flashcard generation
- problem generation
- LLM patching
- popup linking
- misconception diagnosis

A transformation tree is closer to a semantic document outline than to a flat timeline.

---

## 7. Animation Layer

The animation system should consume semantic transformation nodes and presentation states.

It should not be the source of truth.

Use a KP timeline abstraction:

```ts
interface TimelineDriver {
  play(): void;
  pause(): void;
  seek(time: number): void;
  setPlaybackRate(rate: number): void;
  getTime(): number;
  onTick(cb: (time: number) => void): Unsubscribe;
}
```

Supported drivers:

```text
WAAPIDriver
  Uses Web Animations API for DOM/SVG/HTML animation.

RAFDriver
  Uses requestAnimationFrame for custom renderers and WebGL.

ScrollDriver
  Maps scroll progress to timeline time.

ManualDriver
  Used by scrubbers/sliders.

TestDriver
  Deterministic timeline for tests.
```

Animation intents should be semantic:

```ts
AnimationIntent({
  target: A.entry(2, 1),
  effect: "highlight",
  start: 0,
  duration: 400
});
```

Renderer adapters compile these intents into WAAPI, SVG attributes, CSS transforms, WebGL uniforms, or static before/after states.

---

## 8. Seek, Rewind, Fast-Forward, and TOC Navigation

KP must support random access to semantic states.

A TOC click is not “play really fast.” It is a seek.

Operations:

```text
play
  Animate from current state to next state.

scrub
  Continuously map time/scroll to intermediate states.

seek
  Jump to a named semantic state.
```

TOC items and links should point to semantic anchors:

```ts
toc.linkTo("gauss.forward.eliminate-a31");
```

The runtime resolves:

```text
anchor ID
  -> transformation node
  -> target presentation state
  -> target timeline position
  -> target render plan
```

Seeking should be transactional:

```ts
async function seekTo(anchorId: string, options: SeekOptions = {}) {
  runtime.beginTransaction(`seek:${anchorId}`);

  timeline.pause();
  animationRuntime.cancelTransientAnimations();

  const target = seekEngine.resolve(anchorId);
  const targetState = snapshotStore.materialize(target);

  presentationRuntime.setState(targetState.presentation);
  objectGraph.setState(targetState.objects);
  timeline.seek(targetState.timelineTime);

  renderScheduler.commitNow(targetState.renderPlan);

  anchorRegistry.setCurrent(anchorId);
  tocRuntime.setActive(anchorId);
  urlRuntime.updateHash(anchorId);

  runtime.endTransaction();
}
```

Do not replay DOM mutations to reach a target state.

Instead:

```text
current state
  -> compute target semantic state
  -> compute target render plan
  -> commit once
```

Use snapshots at important anchors:

```text
lesson start
section start
transformation subtree start
major TOC nodes
```

Then materialize target state by starting from the nearest snapshot and replaying semantic reducers in memory, not in the DOM.

---

## 9. Rendering Architecture

KP should use renderer-independent render plans.

A render node should contain semantic identity:

```ts
type RenderNode = {
  id: RenderNodeId;
  objectRef: ObjectRef;
  selectionRef?: SelectionRef;
  role?: string;

  kind:
    | "group"
    | "path"
    | "polygon"
    | "text"
    | "point"
    | "mesh"
    | "label"
    | "hitTarget";

  geometry?: GeometrySpec;
  style: StyleToken[];
  interactions?: InteractionSpec[];
};
```

Renderers consume render plans:

```ts
interface Renderer {
  mount(root: Element): void;
  render(plan: RenderPlan): RenderHandle;
  update(plan: RenderPlan): RenderPatchResult;
  unmount(): void;
}
```

Renderers should be idempotent:

```ts
renderer.commit(stateAt("elim-a31"));
renderer.commit(stateAt("elim-a31"));
```

The second call should not alter the outcome.

Rendering should describe desired final state, not imperative increments.

Bad:

```ts
moveBy(target, dx, dy);
```

Good:

```ts
setTransform(target, matrix);
```

---

## 10. Render Index

KP should maintain a render index to associate DOM/WebGL elements with semantic render nodes.

Do not repeatedly query the DOM to discover meaning.

Use:

```ts
class RenderIndex {
  elementToRenderNode = new WeakMap<Element, RenderNode>();
  renderNodeToElement = new Map<RenderNodeId, Element>();

  objectToRenderNodes = new Map<ObjectId, Set<RenderNodeId>>();
  selectionToRenderNodes = new Map<SelectionKey, Set<RenderNodeId>>();

  bind(el: Element, node: RenderNode) {
    this.elementToRenderNode.set(el, node);
    this.renderNodeToElement.set(node.id, el);

    addToSet(this.objectToRenderNodes, node.objectRef.objectId, node.id);

    if (node.selectionRef) {
      addToSet(this.selectionToRenderNodes, keyOf(node.selectionRef), node.id);
    }
  }

  unbind(node: RenderNode) {
    const el = this.renderNodeToElement.get(node.id);
    if (!el) return;

    this.renderNodeToElement.delete(node.id);
    this.elementToRenderNode.delete(el);

    // Also remove from objectToRenderNodes / selectionToRenderNodes.
  }

  getSemanticTarget(el: Element): RenderNode | undefined {
    return this.elementToRenderNode.get(el);
  }
}
```

Use `data-*` attributes too for debugging:

```html
<path
  data-kp-object="graph-f"
  data-kp-selector="curve('f')"
  data-kp-render-node="rn-123"
/>
```

But do not rely on DOM queries in hot paths.

---

## 11. D3’s Role

D3 should be optional and limited to the SVG renderer.

KP should not use D3 as:

- the graph API
- the semantic object model
- the animation runtime
- the selection model
- the timeline
- the source of truth

D3 can be useful for:

- data joins
- enter/update/exit DOM reconciliation
- scales
- axes
- path generation
- shape helpers
- zoom/drag utilities
- some local SVG transitions

Correct use:

```ts
svg
  .select(".curve-layer")
  .selectAll<SVGPathElement, RenderNode>("path.kp-curve")
  .data(curveRenderNodes, d => d.id)
  .join(
    enter =>
      enter
        .append("path")
        .attr("class", "kp-curve")
        .each(function (d) {
          renderIndex.bind(this, d);
        }),
    update => update,
    exit =>
      exit
        .each(function (d) {
          renderIndex.unbind(d);
        })
        .remove()
  )
  .attr("d", d => d.geometry.path)
  .attr("data-kp-object", d => d.objectRef.objectId);
```

Architecture slogan:

**D3 binds render nodes to DOM nodes. KP binds render nodes to semantic objects.**

---

## 12. Web Components

KP should use Web Components as framework-free view shells.

Web Components should not be the semantic object system.

Good components:

```html
<kp-lesson-player></kp-lesson-player>
<kp-scene-view></kp-scene-view>
<kp-graph-view></kp-graph-view>
<kp-matrix-view></kp-matrix-view>
<kp-rich-text></kp-rich-text>
<kp-transformation-tree></kp-transformation-tree>
<kp-toc></kp-toc>
<kp-inspector></kp-inspector>
<kp-popup-layer></kp-popup-layer>
<kp-timeline-scrubber></kp-timeline-scrubber>
```

Bad canonical semantic model:

```html
<kp-matrix>
  <kp-row>
    <kp-cell>1</kp-cell>
  </kp-row>
</kp-matrix>
```

Instead, the semantic object is:

```ts
const A = matrix("A", [
  [1, 2],
  [3, 4]
]);
```

and the component renders a view:

```html
<kp-matrix-view object-id="A"></kp-matrix-view>
```

Use Web Components for:

- player/editor boundaries
- lifecycle management
- embedding in arbitrary pages
- framework independence
- inspector UI
- TOC
- popup layers
- scene mounting

Avoid one custom element per tiny visual primitive.

Inside a component, use ordinary SVG/HTML/WebGL renderers.

---

## 13. Graph and 3D Rendering

KP should have one graph/scene API and multiple render backends.

Avoid:

```ts
svgGraph(...)
threeGraph(...)
```

Prefer:

```ts
const scene = graph3D({
  id: "saddle-scene",
  coordinateSystem: cartesian3D(),
  objects: [
    surface({
      id: "saddle",
      equation: "z = x^2 - y^2",
      xRange: [-3, 3],
      yRange: [-3, 3]
    }),
    crossSection({
      id: "x-slice",
      surface: "saddle",
      y: 0
    }),
    pointOnSurface({
      id: "p",
      surface: "saddle",
      x: 1,
      y: 1
    })
  ]
});
```

Then choose renderer:

```ts
show(scene, {
  renderer: "svg-projected-3d"
});
```

or:

```ts
show(scene, {
  renderer: "webgl-three"
});
```

The public API stays the same.

### Recommended renderer tiers

```text
Tier 1: SVG 2D
  Ordinary graphs, axes, curves, regions, diagrams.

Tier 2: SVG-projected 3D
  Educational 3D-looking surfaces, wireframes, cross-sections, low-res meshes.

Tier 3: WebGL / Three.js
  Real 3D rotation, dense surfaces, lighting, z-buffering, many polygons.
```

No React dependency is required. If using Three.js, use vanilla Three.js.

### Hybrid 3D renderer

Long-term, use:

```text
WebGL layer:
  dense surfaces, meshes, lighting, depth

SVG layer:
  semantic curves, axes, highlights, hit targets

HTML layer:
  labels, popups, controls
```

DOM structure:

```html
<div class="kp-scene">
  <canvas class="kp-webgl-layer"></canvas>
  <svg class="kp-svg-overlay"></svg>
  <div class="kp-html-overlay"></div>
</div>
```

All layers share a camera/projection model.

For a 3D point:

```ts
function projectToSvg(point3D, camera, width, height) {
  const v = new THREE.Vector3(point3D.x, point3D.y, point3D.z);
  v.project(camera);

  return {
    x: (v.x * 0.5 + 0.5) * width,
    y: (-v.y * 0.5 + 0.5) * height,
    depth: v.z
  };
}
```

Do not extract SVG curves from rendered WebGL pixels. Derive SVG overlays from the same semantic objects and camera projection.

---

## 14. CSS/SVG/WebGL Transforms

Matrix calculations often produce direct transform changes. KP should support this smoothly.

Core rule:

**Semantic transformations produce target matrices. Renderers apply target matrices. Timelines interpolate between matrices. DOM is only the final projection.**

Use internal transform objects:

```ts
type TransformEffect = {
  id: string;
  target: SelectionRef;
  matrix: DOMMatrixReadOnly;
  origin?: Point2;
  space: "screen" | "graph" | "object" | "world";
  duration?: number;
  easing?: string;
  source: TransformationNodeId;
};
```

Renderer adapters decide how to apply:

```text
SVG geometry:
  SVG transform attribute

HTML labels/popups:
  CSS transform

WebGL meshes:
  matrix uniform / object matrix
```

Use transforms for affine changes:

```text
translate
scale
rotate
skew
linear transformation
camera pan/zoom
moving labels
moving points
moving groups
```

For non-affine mathematical changes, recompute geometry.

Use group transforms when possible:

```html
<svg class="kp-graph">
  <g class="kp-world-layer">
    <g class="kp-transform-layer" data-kp-transform-target="graph-f">
      <path class="kp-curve" />
      <circle class="kp-point" />
    </g>
  </g>

  <g class="kp-overlay-layer">
    <path class="kp-highlight" />
  </g>
</svg>
```

Do not update thousands of child nodes if one group transform will do.

### Preview then commit

During interaction:

```text
apply CSS/SVG transform to visual group
```

At rest:

```text
update semantic object / recompute derived geometry
clear temporary transform
rerender canonical geometry
```

This avoids accumulating transform hacks as long-term semantic state.

---

## 15. Render Scheduler

All DOM writes should be batched.

```ts
class RenderScheduler {
  private pending: RenderRequest | null = null;
  private scheduled = false;

  requestRender(request: RenderRequest) {
    this.pending = merge(this.pending, request);

    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  flush() {
    const request = this.pending;
    this.pending = null;
    this.scheduled = false;

    renderer.commit(request.targetState);
  }
}
```

For TOC seek or high-priority jumps, support a controlled immediate commit:

```ts
renderScheduler.commitNow(targetRenderPlan);
```

The goal is:

```text
many semantic changes
  -> one target state
  -> one render commit
```

not:

```text
many semantic changes
  -> many intermediate DOM commits
```

---

## 16. Observers

### MutationObserver

Use `MutationObserver` as recorder/safety net, not source of truth.

Primary rewind should use semantic state and render snapshots. MutationObserver can catch unexpected DOM changes.

Use it on controlled roots only:

```ts
observer.observe(stageRoot, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeOldValue: true,
  characterData: true,
  characterDataOldValue: true
});
```

During renderer commits, classify or suspend expected mutations:

```ts
observerRuntime.suspend(() => {
  renderer.commit(targetRenderPlan);
});
```

or:

```ts
changeRegistry.beginCommit({
  reason: "toc-seek",
  source: "kp-renderer"
});

renderer.commit(targetRenderPlan);

changeRegistry.endCommit();
```

### IntersectionObserver

Use `IntersectionObserver` for activation, not frame-perfect scroll animation.

Use it for:

- activating a scene
- mounting/unmounting expensive renderers
- starting/pausing animations
- preloading next scene
- marking current section

For scroll-based animation:

```text
IntersectionObserver:
  determines which scene is active

ScrollDriver:
  maps exact scroll position to timeline progress
```

### ResizeObserver

Use `ResizeObserver` for layout-dependent renderers, graph rescaling, canvas resizing, and overlay projection updates.

---

## 17. Change Registry

Create an explicit change registry.

```ts
type ChangeRecord =
  | SemanticChange
  | RenderChange
  | DOMMutationChange
  | AnimationChange
  | ExternalChange;

class ChangeRegistry {
  beginFrame(label: string): ChangeFrame;
  record(change: ChangeRecord): void;
  commitFrame(): void;
  rewindTo(frameId: string): void;
}
```

Renderers should record reversible changes explicitly where helpful.

MutationObserver should record unregistered changes as fallback.

For v1, prefer rerendering affected subtrees from semantic state over trying to invert every DOM mutation.

---

## 18. Rich Text and Embedded Objects

KP text should be semantic rich text, not plain strings with HTML.

Authoring syntax can use tagged template strings:

```ts
text`
  The ${ref(A.entry(1, 1), "pivot")} is used to eliminate
  ${ref(A.entry(2, 1), "this entry")}.
`
```

This should compile to:

```ts
RichText([
  Text("The "),
  InlineObjectRef({
    target: A.entry(1, 1),
    label: "pivot"
  }),
  Text(" is used to eliminate "),
  InlineObjectRef({
    target: A.entry(2, 1),
    label: "this entry"
  }),
  Text(".")
]);
```

Inline refs should support:

- hover highlight
- click selection
- popups
- linked definitions
- LLM context packets
- transformation-aware references
- parameterized references in generated animations

Do not store only plain strings.

---

## 19. Composition and Tiling API

Executable GIFs should compose spatially and temporally.

KP needs composition objects, not just layout divs.

Example:

```ts
compose({
  id: "row-operation-comparison",
  title: "Correct vs invalid row operation",

  layout: tile.horizontal({
    panels: [
      panel("Correct", correctRowOperation),
      panel("Invalid", invalidRowOperation)
    ]
  }),

  sync: sync.byLabels([
    "start",
    "select-target-entry",
    "apply-operation",
    "result"
  ]),

  correspondences: [
    correspond(correct.A0, invalid.A0, "same-starting-matrix"),
    correspond(correct.targetEntry, invalid.targetEntry, "same-role"),
    correspond(correct.result, invalid.result, "different-result")
  ],

  emphasis: [
    highlightShared("same-starting-matrix"),
    highlightShared("same-role"),
    highlightDifference("different-result"),
    dimUnchanged()
  ]
});
```

Composition primitives:

```text
Layout:
  horizontal
  vertical
  grid
  overlay
  inset
  tabs
  carousel

Synchronization:
  byTime
  byStep
  byLabels
  byObjectState
  byTransformationRole
  manual

Correspondence:
  same object
  same role
  same input-output pair
  moved into helper
  changed result

Emphasis:
  highlight shared
  highlight differences
  dim unchanged
  ghost irrelevant
  trace across panels
```

Composition should be semantic comparison, not just layout.

---

## 20. LLM Architecture

LLMs should interact with KP through constrained semantic APIs, not arbitrary DOM/code mutation.

Surfaces:

```text
Authoring API:
  generate lessons from scratch

Patch API:
  modify existing lessons safely

Runtime tutoring API:
  respond to student selections/questions
```

### Object cards

Every object should describe itself:

```json
{
  "id": "A",
  "type": "Matrix",
  "label": "A",
  "shape": [3, 3],
  "capabilities": [
    "renderable",
    "selectable",
    "row-operable"
  ],
  "selectors": [
    "row(i)",
    "column(j)",
    "entry(i,j)",
    "diagonal()"
  ],
  "availableActions": [
    "highlight",
    "swapRows",
    "scaleRow",
    "addMultipleOfRow",
    "computeTrace",
    "showAsGrid"
  ],
  "currentRole": "matrix being reduced by Gaussian elimination"
}
```

### Patch format

LLMs should propose patches:

```json
{
  "op": "addAnnotation",
  "afterStep": "step-pivot-1",
  "content": [
    { "type": "text", "value": "We use " },
    {
      "type": "ref",
      "target": { "objectId": "A", "selector": "row(1)" },
      "label": "row 1"
    },
    { "type": "text", "value": " because it contains the pivot " },
    {
      "type": "ref",
      "target": { "objectId": "A", "selector": "entry(1,1)" },
      "label": "A[1,1]"
    },
    { "type": "text", "value": "." }
  ]
}
```

Validate patches before applying.

### Runtime clarification

When a student selects something, send the LLM a context packet:

```json
{
  "lessonGoal": "Teach Gaussian elimination as row operations preserving solution sets.",
  "currentStep": {
    "id": "step-row-eliminate-2-1",
    "operation": "R2 <- R2 - 3R1",
    "pedagogicalGoal": "Use the first pivot to eliminate the entry below it."
  },
  "selectedObject": {
    "id": "A-entry-2-1",
    "type": "MatrixEntry",
    "label": "A[2,1]",
    "value": 3,
    "role": "target entry to eliminate",
    "parent": "A"
  },
  "nearbyObjects": [
    {
      "id": "A-entry-1-1",
      "type": "MatrixEntry",
      "label": "A[1,1]",
      "value": 1,
      "role": "pivot"
    }
  ],
  "availableResponseActions": [
    "shortExplanation",
    "highlightObjects",
    "replayStep",
    "showNumericComputation",
    "showMisconception"
  ],
  "studentQuestion": "Why are we subtracting row 1?"
}
```

LLM responds with rich text and visual actions:

```json
{
  "type": "ClarificationResponse",
  "studentFacingText": [
    { "type": "text", "value": "We subtract " },
    {
      "type": "ref",
      "target": { "objectId": "A", "selector": "row(1)" },
      "label": "row 1"
    },
    { "type": "text", "value": " because it contains the pivot." }
  ],
  "visualActions": [
    {
      "type": "highlight",
      "target": { "objectId": "A", "selector": "row(1)" }
    },
    {
      "type": "highlight",
      "target": { "objectId": "A", "selector": "entry(2,1)" }
    }
  ]
}
```

---

## 21. Authoring Interface

The preferred power-user authoring model is TypeScript/JavaScript, but the canonical artifact should be KPIR.

```text
lesson.kp.ts
  -> build/execute safely
  -> KPIR semantic lesson graph
  -> validation
  -> preview
  -> publish
```

TypeScript should be a construction language. KPIR is the lesson.

Suggested editor layout:

```text
┌───────────────────────┬─────────────────────────────┐
│ Narrative / Code      │ Live Lesson Preview          │
│ lesson.kp.ts          │ interactive rendered lesson  │
│                       │                             │
├───────────────────────┼─────────────────────────────┤
│ Object / Transform    │ Inspector / Links / Actions  │
│ Graph + TOC           │ selected object details      │
└───────────────────────┴─────────────────────────────┘
```

Editing surfaces:

```text
Code editor:
  TypeScript lesson source

Live preview:
  rendered student view with author overlays

Object tree:
  semantic object graph

Transformation tree:
  foldable semantic procedure outline

Inspector:
  selected object protocols, render modes, links, actions, validation

LLM command bar:
  patch-based semantic edits
```

Support multiple authoring levels:

```text
Level 1:
  visual assembly

Level 2:
  structured block editor / MDX-like syntax

Level 3:
  TypeScript authoring

Level 4:
  raw KPIR / patch mode
```

---

## 22. KPIR

KP needs a canonical serializable intermediate representation.

TypeScript, Markdown/MDX, visual editing, and LLM patches should all compile to KPIR.

Example:

```json
{
  "type": "Lesson",
  "id": "quadratic-intro",
  "objects": [
    {
      "id": "f",
      "type": "Function",
      "params": ["x"],
      "body": "x^2 - 3"
    },
    {
      "id": "graph-f",
      "type": "Graph2D",
      "source": "f",
      "xRange": [-5, 5],
      "sampleCount": 200
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "type": "Show",
      "target": "f"
    },
    {
      "id": "step-2",
      "type": "Show",
      "target": "graph-f"
    }
  ]
}
```

KPIR should be:

- serializable
- inspectable
- patchable
- versioned
- diffable
- reviewable
- validated by schemas
- usable by LLMs

---

## 23. Curriculum Graph

KP should support curriculum generation and links.

Core objects:

```text
Concept
Definition
PrerequisiteLink
Lesson
KPSlideshow
Example
NonExample
ProblemTemplate
GeneratedProblem
Flashcard
Misconception
Assessment
Rubric
Popup
TutorialLink
ValidationReport
StudentPerformanceSignal
```

Every artifact should declare:

```text
conceptsIntroduced
conceptsReinforced
prerequisitesRequired
misconceptionsAddressed
representationsUsed
assessmentTargets
sourceProvenance
confidence
reviewStatus
```

KP should be able to generate:

- lessons
- problem sets
- flashcards
- examples
- non-examples
- popups
- prerequisite reviews
- misconception diagnostics
- coverage reports

But LLM-generated curricula should be treated as reviewable drafts, not final truth.

---

## 24. Tutorial and Paper Conversion

KP should support uploading tutorials or papers and converting them into semantic lesson packages.

Pipeline:

```text
source document
  -> extract structure
  -> identify concepts
  -> identify mathematical/code/data objects
  -> identify transformations
  -> build KPIR draft
  -> generate slideshow states
  -> add clickable annotations
  -> add popups and links
  -> generate examples/problems/flashcards
  -> validate
  -> author review
```

For academic papers, KP can create interactive companion artifacts:

```text
definitions
equations
algorithms
figures
claims
proof sketches
toy examples
simulations
code traces
generated exercises
```

Every generated object should track provenance back to the source span.

---

## 25. Default Implementation Priorities

A practical v1 should not try to build everything.

Recommended first implementation:

```text
Semantic object graph
Transformation tree
Rich text AST with clickable refs
SVG renderer
Render index
Timeline runtime
WAAPI + RAF driver
ScrollDriver
IntersectionObserverAdapter
MutationObserverAdapter
Seek engine + TOC anchors
TypeScript authoring API
KPIR serialization
Basic LLM patch validation
Web Components shell
```

First demo:

```text
Gaussian elimination lesson
  Matrix object
  Row operation transformation tree
  Clickable matrix entries
  TOC navigation
  Rewind/fast-forward
  Rich text refs
  Valid vs invalid comparison
  Generated practice
```

Second demo:

```text
Function/graph/table linked representation
  Function object
  Graph object
  Table object
  Synchronized selection
  Formula/graph/table composition
```

Third demo:

```text
Code explanation
  CodeFile parsed by tree-sitter
  Semantic code selections
  Progressive reveal from final file
  Code + runtime trace composition
```

---

## 26. Architecture Rules to Protect

1. **Semantic graph is source of truth.**
   DOM is not the model.

2. **Transformations are not animations.**
   Transformations are semantic trees. Animations render them.

3. **One graph API, multiple renderers.**
   SVG, WebGL, Canvas, and static exports must share object identity.

4. **Renderer commits are idempotent.**
   Render target state, not imperative increments.

5. **TOC navigation is seek, not playback.**
   Compute target state and commit once.

6. **MutationObserver is a safety net.**
   It should not power semantic rewind.

7. **IntersectionObserver activates scenes.**
   It should not control precise timeline progress.

8. **D3 is optional SVG plumbing.**
   It is not KP’s semantic architecture.

9. **Web Components are view shells.**
   They are not the canonical lesson object model.

10. **LLMs patch semantic objects.**
    They should not mutate raw DOM or arbitrary internals.

11. **Rendered objects keep identity.**
    Every important element should be selectable, linkable, and explainable.

12. **Styles use tokens and policies.**
    Maintain consistency across SVG, HTML, WebGL, and static renderers.

13. **Invalid states are first-class.**
    KP must represent student mistakes and incomplete understanding.

14. **Composition is semantic comparison.**
    Tiling, syncing, dimming, and highlighting should operate on object correspondences.

15. **Authoring can be TypeScript, but KPIR is canonical.**
    JS constructs the lesson; KPIR stores the inspectable artifact.

---

## 27. Short Summary

Kinetic Press should be built as a semantic runtime for educational media.

The architecture should separate:

```text
Meaning:
  object graph, transformations, curriculum links

Time:
  timeline runtime, drivers, seek engine

Presentation:
  presentation state, composition, focus, folding

Rendering:
  render plans, SVG/HTML/WebGL adapters

Browser edge:
  observers, DOM nodes, Web Animations, scroll

Authoring:
  TypeScript API, KPIR, LLM patches, visual editor
```

The guiding slogan:

**KP lessons are not timelines. They are semantic transformation trees rendered through timelines, slides, prose, diagrams, and interaction.**

---

## 28. Layout Measurement and Cross-Boundary Motion

KP needs smooth movement for code tokens, KaTeX/math fragments, graph labels, annotations, and other rendered semantic elements — including cases where an object appears to move across parent boundaries, panels, slides, or render layers.

This should be treated as a first-class runtime concern.

The core pattern is **FLIP**:

```text
First:
  measure where the element is now

Last:
  commit the target layout, then measure where the element ends up

Invert:
  apply a transform that visually places the target back at the source

Play:
  animate that transform back to identity
```

The rule:

**Measure at stable layout boundaries. Animate from cached geometry. Do not measure continuously during animation.**

---

### 28.1 Why This Matters

Math and code rendering are layout-sensitive.

Examples:

```text
KaTeX:
  expressions can render into nested spans with complex boxes

Code:
  tokens can move between lines, blocks, functions, or panels

Tiled comparisons:
  the same semantic object may appear in multiple rendered panels

TOC navigation:
  a user may jump directly to a later semantic state

Generated animations:
  one semantic selection may have different DOM instances before and after
```

So KP cannot assume:

```text
same semantic object = same DOM node
```

Instead, KP should support motion between two rendered instances of the same semantic selection.

---

### 28.2 Use Viewport Rectangles as the Neutral Space

For cross-parent movement, measure in viewport coordinates with `getBoundingClientRect()`.

```ts
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();

  return {
    x: r.left,
    y: r.top,
    width: r.width,
    height: r.height
  };
}
```

Viewport coordinates let KP compare positions even when elements live in different parents, panels, SVG groups, Web Components, or overlay layers.

If the animation plays inside a stage overlay, convert viewport coordinates into overlay-local coordinates.

---

### 28.3 Add a Layout Stabilizer

Layout measurement should not happen casually inside animation code.

Create a runtime service:

```ts
class LayoutStabilizer {
  async beforeMeasure() {
    await document.fonts?.ready;
    await nextAnimationFrame();
  }

  async afterCommit() {
    await nextAnimationFrame();
  }
}

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
```

The stabilizer should account for:

```text
font loading
KaTeX rendering
syntax highlighting
line wrapping
fold/unfold changes
container resize
Web Component hydration
theme/font-size changes
scrollbar appearance
renderer commits
```

Use `ResizeObserver` and `MutationObserver` to invalidate cached geometry, not to perform immediate measurement.

---

### 28.4 Runtime Phases for Layout Transitions

Add an explicit layout-transition pipeline:

```text
Prepare
  resolve semantic transition and motion targets

Pre-measure
  measure source rects

Commit
  apply semantic/presentation change and render target state

Post-measure
  measure target rects

Invert
  apply inverse transforms or create overlay clones

Play
  animate from inverted geometry to final geometry

Finalize
  remove clones, reveal real nodes, commit canonical state
```

Possible API:

```ts
type LayoutTransition = {
  id: string;
  selections: SelectionRef[];
  commit: () => void;
  motionPolicy: "real-node" | "overlay-clone" | "crossfade" | "none";
};
```

---

### 28.5 Prefer Overlay Clones for Cross-Boundary Motion

For simple cases, real-node FLIP can work.

But for KP, many transitions should use overlay clones because:

```text
the element crosses parent boundaries
the element crosses clipping boundaries
the element is reparented
the old and new elements are different DOM nodes
KaTeX rerenders
syntax highlighting rerenders
a slide/panel changes
a tiled composition changes layout
```

Use a global motion overlay:

```html
<div class="kp-stage">
  <div class="kp-content"></div>
  <div class="kp-motion-overlay"></div>
</div>
```

Motion process:

```text
1. Measure source rect.
2. Commit target state.
3. Measure target rect.
4. Clone the source visual into the motion overlay.
5. Hide or ghost source/target real nodes.
6. Animate clone from source rect to target rect.
7. Remove clone.
8. Reveal canonical target node.
```

Data structure:

```ts
type MotionPair = {
  selection: SelectionRef;
  fromEl: Element;
  toEl: Element;
  fromRect: Rect;
  toRect: Rect;
};
```

This avoids relying on `fromEl === toEl`.

---

### 28.6 Wrap Semantic Motion Units

For KaTeX and code, animate semantic wrappers rather than arbitrary internal spans by default.

Examples:

```html
<span
  data-kp-selection="eq1.lhs.term('x+3')"
  class="kp-motion-unit"
>
  <span class="katex">...</span>
</span>
```

```html
<span
  data-kp-selection="file.fn('checkout').identifier('total')"
  class="kp-motion-unit"
>
  total
</span>
```

Use granularity levels:

```text
block
line
token
symbol
subexpression
glyph
```

Default to the coarsest meaningful semantic unit.

Avoid glyph-level animation unless explicitly needed.

---

### 28.7 Do Not Measure During Every Frame

Measure only at setup/commit boundaries:

```text
before transition
after target layout commit
after ResizeObserver invalidation
after font/math rendering stabilizes
after container resize
after TOC seek or fold/unfold
```

During playback, interpolate from cached rectangles.

Example transform calculation:

```ts
function flipTransform(first: Rect, last: Rect) {
  const dx = first.x - last.x;
  const dy = first.y - last.y;
  const sx = first.width / last.width;
  const sy = first.height / last.height;

  return {
    transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
  };
}
```

Then animate:

```ts
el.animate(
  [
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
    { transform: "translate(0, 0) scale(1, 1)" }
  ],
  {
    duration: 500,
    easing: "ease-in-out",
    fill: "both"
  }
);
```

---

### 28.8 Geometry Cache

Maintain a geometry cache, but invalidate aggressively.

```ts
class GeometryCache {
  private rects = new Map<RenderNodeId, Rect>();
  private version = 0;

  measure(nodeId: RenderNodeId, el: Element) {
    const rect = rectOf(el);
    this.rects.set(nodeId, rect);
    return rect;
  }

  invalidate(reason: string) {
    this.version++;
    this.rects.clear();
  }
}
```

Invalidate on:

```text
renderer commit
ResizeObserver event
font load completion
KaTeX rerender
code block rerender
fold/unfold
TOC seek
scroll-container change
zoom/camera change
theme/font-size change
layout-affecting mutation
```

`MutationObserver` should mark geometry dirty and schedule later measurement. It should not measure immediately.

---

### 28.9 Handle Active Animations Before Measuring

Before measuring, decide whether KP wants:

```text
canonical layout position
or
current animated visual position
```

For semantic seek and most layout transitions, use canonical layout.

Policy:

```text
For semantic seek:
  cancel transient animations
  render canonical target
  measure target

For scroll scrub:
  timeline owns time
  measure endpoints only
  interpolate from cached rects

For interrupted transition:
  either finish/cancel current animation
  or capture current visual rect and start a new FLIP transition from there
```

Before canonical measurement:

```ts
await animationRuntime.cancelTransientAnimations();
await layoutStabilizer.beforeMeasure();
```

---

### 28.10 Add a First-Class Motion Primitive

Lesson authors should not call `getBoundingClientRect()` directly.

Expose a semantic motion primitive:

```ts
moveSelection({
  selection: eq.term("x"),
  from: "current",
  to: nextEq.term("x"),
  policy: "overlay-clone",
  duration: 500,
  easing: "easeInOut"
});
```

Internal flow:

```text
resolve source render node
resolve target render node
measure source rect
commit next state
measure target rect
clone source visual into overlay
hide/ghost real source and target
animate clone
reveal target
remove clone
```

This makes cross-boundary motion a renderer/runtime feature, not bespoke lesson code.

---

### 28.11 Interaction With TOC Seek

TOC seek should usually materialize the target state without playing intermediate FLIP transitions.

```ts
runtime.seekTo("section-id", {
  mode: "instant"
});
```

If desired, support guided jumps:

```ts
runtime.seekTo("section-id", {
  mode: "guided",
  transition: "brief-crossfade"
});
```

Do not run every previous layout transition just because the user clicked a later TOC item.

---

### 28.12 Architecture Rule

The layout-motion rule:

**Measure at boundaries, animate from cached geometry, and let semantic state — not the DOM — decide what moved.**

This preserves:

```text
rewind
fast-forward
TOC seek
scroll-driven animation
cross-panel motion
KaTeX/code stability
LLM patchability
semantic object identity
```
