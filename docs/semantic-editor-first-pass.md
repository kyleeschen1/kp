# Semantic Editor First Pass

This pass establishes the smallest working Kinetic Press editor loop:

```text
semantic JSON
  -> default LaTeX representation
  -> executable math expression
  -> automatic differentiation
  -> KaTeX HTML
  -> graph SVG
  -> 3D graph SVG projection
  -> rendered editor preview
  -> compiled HTML asset
```

## Semantic Document

The current document contract is `KpDocument`:

```ts
{
  id: string;
  title: string;
  version: 1;
  objects: KpSemanticObject[];
}
```

The first semantic object is `MatrixObject`:

```ts
{
  id: string;
  type: "matrix";
  label: string;
  rows: number[][];
}
```

`identityMatrix({ id: "identity-3x3", label: "I_3", size: 3 })` creates the initial rendered object.

The first graph object family is:

```ts
{
  id: string;
  type: "graph-2d";
  label: string;
  xAxisId: string;
  yAxisId: string;
  xDomain: [number, number];
  yDomain: [number, number];
  width: number;
  height: number;
}
```

```ts
{
  id: string;
  type: "axis-2d";
  graphId: string;
  label: string;
  orientation: "x" | "y";
  domain: [number, number];
  tickStep: number;
}
```

```ts
{
  id: string;
  type: "curve-2d";
  graphId: string;
  label: "x^2 = y";
  equation: "y = x^2";
  xDomain: [number, number];
  sampleCount: number;
}
```

`createDefaultGraphScene()` creates `parabola-graph`, `parabola-x-axis`, `parabola-y-axis`, and `curve-y-equals-x-squared`.

The first 3D graph object family mirrors the 2D graph interface with one additional axis and a camera:

```ts
{
  id: string;
  type: "graph-3d";
  label: string;
  xAxisId: string;
  yAxisId: string;
  zAxisId: string;
  xDomain: [number, number];
  yDomain: [number, number];
  zDomain: [number, number];
  width: number;
  height: number;
  camera: {
    azimuthDegrees: number;
    elevationDegrees: number;
    scale: number;
    origin: [number, number];
  };
}
```

```ts
{
  id: string;
  type: "axis-3d";
  graphId: string;
  label: string;
  orientation: "x" | "y" | "z";
  domain: [number, number];
  tickStep: number;
}
```

```ts
{
  id: string;
  type: "surface-3d";
  graphId: string;
  label: string;
  equation: string;
  parameterization?: {
    kind: "saddle";
    denominator: number;
  };
  expression: MathExpression;
  xDomain: [number, number];
  yDomain: [number, number];
  xSampleCount: number;
  ySampleCount: number;
}
```

```ts
{
  id: string;
  type: "curve-3d";
  graphId: string;
  label: "time spiral";
  equation: {
    x: string;
    y: string;
    z: string;
  };
  expressions: {
    x: MathExpression;
    y: MathExpression;
    z: MathExpression;
  };
  tDomain: [number, number];
  sampleCount: number;
}
```

`createDefaultGraph3DScene()` currently creates `saddle-orbit-graph`,
`saddle-orbit-x-axis`, `saddle-orbit-y-axis`, `saddle-orbit-z-axis`, and
`saddle-surface`. The default saddle has `{ kind: "saddle", denominator: 4 }`.
The time spiral and saddle-weave 3D curve factories still exist for targeted
renderer tests, but the default editor scene omits 3D curves while the
surface/axis renderer is being refined.

Animation is represented as a nonvisual semantic intent object:

```ts
{
  id: string;
  type: "animation-intent";
  label: string;
  targetId: string;
  targetType: "surface-3d";
  property: "saddle.denominator";
  from: number;
  to: number;
  durationMs: number;
  easing: "ease-in-out" | "linear";
}
```

## Rendering

Mathematical semantic objects render through a default LaTeX protocol. The matrix renderer emits:

```latex
I_3 = \begin{bmatrix}1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1\end{bmatrix}
```

KaTeX converts that LaTeX string to HTML. Rendered object containers preserve semantic identity with:

```html
data-kp-object="identity-3x3"
data-kp-render-node="rn-identity-3x3-default-latex"
data-kp-type="matrix"
```

Graph objects render as SVG. The graph object owns the visible SVG container, while axis and curve semantic objects are rendered inside that graph with their own metadata:

```html
data-kp-object="parabola-graph"
data-kp-render-node="rn-parabola-graph-svg"
data-kp-type="graph-2d"
```

```html
data-kp-object="curve-y-equals-x-squared"
data-kp-render-node="rn-curve-y-equals-x-squared-svg-path"
data-kp-type="curve-2d"
```

3D graph objects render through the same SVG semantic metadata model. The current renderer uses a pure TypeScript orthographic projection from 3D graph coordinates into SVG coordinates. The 3D graph owns the SVG container, while axes and the saddle surface render inside it:

```html
data-kp-object="saddle-orbit-graph"
data-kp-render-node="rn-saddle-orbit-graph-svg"
data-kp-type="graph-3d"
```

The 3D SVG uses semantic layers to make axes, borders, and curves feel integrated with the drawing. Mathematical objects first become projected geometry. Opaque surface quads write depth into a shared software depth scene, and line-like objects query that scene for visibility. Surface cells render first, then hidden line segments render as muted annotations, and visible line segments render as stronger strokes. This intentionally fakes occlusion: behind-surface pieces stay visible but subdued instead of disappearing. The axes extend 15% past their domains, render in black when visible, and carry `data-kp-stroke-ratio="2"` plus `data-kp-stroke-extra-px="1"` because they are intentionally thicker than mesh lines. Both axis ends receive depth-scaled SVG polygon arrowheads.

```html
<g class="graph-axis graph-axis--3d graph-axis--x graph-axis--base-plane"
  data-kp-object="saddle-orbit-x-axis"
  data-kp-axis-extended-domain="-3.900,3.900"
  data-kp-axis-extension-ratio="0.15"
  data-kp-axis-visibility-layer="visible">
  <polygon class="graph-axis__segment"
    data-kp-depth="0"
    data-kp-visibility="visible"
    data-kp-visibility-source="depth-buffer"
    data-kp-occlusion-treatment="strong"
    data-kp-stroke-ratio="2"
    data-kp-stroke-extra-px="1" />
  <polygon class="graph-axis__arrow"
    data-kp-axis-arrow="negative-end"
    data-kp-visibility-source="depth-buffer"
    data-kp-depth-weight="0.5" />
  <polygon class="graph-axis__arrow"
    data-kp-axis-arrow="positive-end"
    data-kp-visibility-source="depth-buffer"
    data-kp-depth-weight="0.5" />
</g>
```

The current occlusion pass builds a small software depth scene before emitting
SVG. Each opaque surface quad is split into two projected triangles and
rasterized into a `Float32Array`. The convention is larger depth means closer to
the camera. Axes, arrows, surface perimeter outlines, and 3D curve segments use
one adaptive projected-line visibility helper. If endpoint visibility changes,
the helper first refines the signed depth-delta crossing with binary search; if
the endpoints agree but the midpoint differs, it recursively splits the segment
to catch pass-through cases. A segment-budget fallback can trade exactness for a
bounded SVG segment count. This keeps SVG as the semantic/event surface while
giving line-like objects one shared visibility source:

```html
data-kp-depth-buffer-scale="1"
data-kp-depth-buffer-width="560"
data-kp-depth-buffer-height="420"
data-kp-depth-surface-count="1"
data-kp-depth-triangle-count="288"
data-kp-depth-overlap-count="0"
data-kp-visibility-source="depth-buffer"
```

The SVG root also records the current software-depth performance budget. The
default scene is currently within budget:

```html
data-kp-render-budget-status="ok"
data-kp-render-budget-depth-cell-count="235200"
data-kp-render-budget-max-depth-cell-count="300000"
data-kp-render-budget-depth-triangle-count="288"
data-kp-render-budget-max-depth-triangle-count="800"
```

This is not exact computational geometry. It does not split SVG shapes at every
surface crossing analytically. It uses projected depth-delta refinement plus
adaptive subdivision rather than solving every line/surface intersection in
graph space. For multiple surfaces, the renderer records projected triangle
overlap counts as metadata so ambiguous regions can be debugged before full
surface/surface splitting exists. It is the current pragmatic bridge between
hand-authored SVG semantics and future deeper geometry kernels.

The generic renderer boundary is now:

```text
semantic math object
  -> executable samples
  -> projected geometry
  -> depth writers: projected surface triangles
  -> depth queries: projected axes, borders, curves, arrows
  -> SVG with semantic metadata
```

The saddle surface renders as filled SVG quadrilateral cells with mesh lines overlaid and a dark blue projected perimeter outline for contrast. Each cell preserves semantic identity and records its grid coordinate, camera-facing side, and projected average depth:

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-quads"
data-kp-type="surface-3d"
data-kp-cell="0,0"
data-kp-facing="front"
data-kp-surface-depth="-1.234"
```

Cell fill colors use the executable saddle expression and its automatically
differentiated partials from `src/math/surface-examples.ts`. The default
parameterization is:

```latex
\frac{x^{2} - y^{2}}{4}
```

The renderer samples `z` values by evaluating that expression, then computes
normals from the compiled gradient:

```text
normal = normalize([-dz/dx, -dz/dy, 1])
```

The renderer compares that normal with the current camera direction to classify front-facing and back-facing cells, then applies a light direction to vary brightness. Surface quads are fully opaque. Both sides use blue-family fills, and the back-facing underside is lighter than the darkest front-facing color so projected overlap does not blend yellow or muddy the top surface.

## Executable Math and AD

The first automatic differentiation slice lives in `src/math/expression.ts`.
It introduces a dependency-free expression AST that can be interpreted several
ways:

- render a default LaTeX representation;
- compile an allocation-light numeric evaluator closure;
- symbolically differentiate with respect to named variables;
- compile gradients as reusable numeric closures.

This is deliberately a TypeScript-first foundation. The intended Wasm boundary
is bulk numeric geometry, not per-point DOM work: TypeScript should keep
semantic JSON, editor state, LaTeX, and SVG/WebGL rendering, while a future Wasm
module can evaluate expression bytecode, derivatives, intersections, overlap,
and visibility over typed arrays.

## LaTeX Equation Input

The editor now has a small equation input path for graphable math. This is not
a full TeX parser. It accepts a compact math subset:

- numbers, variables, `+`, `-`, `*`, `/`, `^`, and `=`;
- grouped expressions with `{...}` and `(...)`;
- `\frac{...}{...}`;
- `\sin(...)`, `\cos(...)`, and `\sqrt{...}`.

The pipeline is:

```text
LaTeX equation string
  -> tokenizer
  -> parse AST
  -> MathExpression AST
  -> explicit equation classifier
  -> semantic graph scene
  -> expression-backed SVG sampling
```

`y = f(x)` creates a 2D graph scene with x/y axes and an expression-backed
curve. `z = f(x,y)` creates a 3D graph scene with x/y/z axes and an
expression-backed surface. The renderer samples those curve and surface
objects from their stored `MathExpression`, so generated equations use the same
evaluation and AD machinery as the built-in saddle.

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-wireframe"
data-kp-type="surface-3d"
```

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-edge-outline"
data-kp-type="surface-3d"
```

The editor exposes the graph camera azimuth and saddle denominator as range
controls. Moving either slider updates the semantic document, refreshes the JSON
pane, and re-renders the matching 3D SVG preview. The denominator slider rebuilds
the surface's label, equation text, parameter metadata, and executable
`MathExpression` together.

```html
data-action="set-graph-azimuth"
data-graph-id="saddle-orbit-graph"
data-kp-graph-rotation-axis="z"
```

```html
data-action="set-saddle-denominator"
data-graph-id="saddle-orbit-graph"
data-surface-id="saddle-surface"
data-kp-graph-surface-parameter="saddle-denominator"
```

For future surface animation, triangles are the better transform-only primitive.
Any projected 2D triangle can be mapped exactly to another projected triangle
with one affine matrix, while arbitrary quadrilateral deformation cannot
generally be represented by translate/rotate/scale/skew alone. The current
prototype has deterministic JS tween helpers that sample number frames and saddle
denominator morph grids from an `animation-intent`; live playback should drive
the same frame math from `requestAnimationFrame`, then recompute depth ordering,
normals, and occlusion for the visible SVG state.

## Compile Path

The backend exposes `POST /api/compile`.

Input is a `KpDocument` JSON body. Output is a standalone HTML asset containing the rendered editor document. The editor compile button posts the current semantic document to that endpoint and shows the returned HTML source.

## Current Limits

- Only matrix objects, one 2D graph family, and one 3D graph family are supported.
- Equation parsing is intentionally narrow and only supports explicit `y = f(x)` curves and `z = f(x,y)` surfaces.
- Implicit equations, inequalities, piecewise definitions, full TeX macro expansion, and contouring are not supported yet.
- The 3D renderer is SVG projection only. It has semantic metadata, filled surface cells, derivative shading, extended axes, z-rotation and saddle-denominator sliders, a lightweight software depth scene for axis/border/curve visibility, performance-budget metadata, and export-friendly output, but no WebGL z-buffer.
- Animation has semantic intents, deterministic tween frame sampling, and saddle morph grid sampling, but no live playback loop or DOM patching yet.
- Validation is structural and narrow.
- The compiled HTML asset does not yet inline the full editor stylesheet or KaTeX CSS.
- The editor JSON is read-only.
- The render identity model is attribute-based, not a full render index yet.
