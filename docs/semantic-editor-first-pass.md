# Semantic Editor First Pass

This pass establishes the smallest working Kinetic Press editor loop:

```text
semantic JSON
  -> default LaTeX representation
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
  label: "z = (x^2 - y^2) / 4";
  equation: "z = (x^2 - y^2) / 4";
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
    x: "2.2 cos(t)";
    y: "1.3 sin(t)";
    z: "0.18 (t - 2 pi)";
  };
  tDomain: [number, number];
  sampleCount: number;
}
```

`createDefaultGraph3DScene()` currently creates `saddle-orbit-graph`, `saddle-orbit-x-axis`, `saddle-orbit-y-axis`, `saddle-orbit-z-axis`, and `saddle-surface`. The time spiral semantic object and renderer still exist, but the default editor scene omits it while the 3D surface/axis rendering is being refined.

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

The 3D SVG uses semantic layers to make the axes feel integrated with the drawing. Axes are sampled into short projected segments and classified against the projected surface mesh. Surface cells render first, then hidden axis segments render as muted annotations, and visible axis segments render as stronger strokes. This intentionally fakes occlusion: behind-surface axis pieces stay visible but subdued instead of disappearing. The axes extend 15% past their domains and carry a `data-kp-stroke-ratio="2"` marker because they are intentionally twice as thick as mesh lines. Positive axis ends receive depth-scaled SVG arrowheads.

```html
<g class="graph-axis graph-axis--3d graph-axis--x graph-axis--base-plane"
  data-kp-object="saddle-orbit-x-axis"
  data-kp-axis-extended-domain="-3.900,3.900"
  data-kp-axis-extension-ratio="0.15"
  data-kp-axis-visibility-layer="visible">
  <line class="graph-axis__segment"
    data-kp-depth="0"
    data-kp-visibility="visible"
    data-kp-occlusion-treatment="strong"
    data-kp-stroke-ratio="2"
    marker-end="url(#graph-axis-arrow-saddle-orbit-x-axis-visible)" />
  <marker class="graph-axis__arrow"
    data-kp-axis-arrow="positive-end"
    data-kp-depth-weight="0.5" />
</g>
```

The saddle surface renders as filled SVG quadrilateral cells with mesh lines overlaid. Each cell preserves semantic identity and records its grid coordinate, camera-facing side, and projected average depth:

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-quads"
data-kp-type="surface-3d"
data-kp-cell="0,0"
data-kp-facing="front"
data-kp-surface-depth="-1.234"
```

Cell fill colors use the analytic saddle derivatives:

```text
dz/dx = x / 2
dz/dy = -y / 2
normal = normalize([-dz/dx, -dz/dy, 1])
```

The renderer compares that normal with the current camera direction to classify front-facing and back-facing cells, then applies a light direction to vary brightness. Surface quads are fully opaque. Both sides use blue-family fills, and the back-facing underside is lighter than the darkest front-facing color so projected overlap does not blend yellow or muddy the top surface.

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-wireframe"
data-kp-type="surface-3d"
```

## Compile Path

The backend exposes `POST /api/compile`.

Input is a `KpDocument` JSON body. Output is a standalone HTML asset containing the rendered editor document. The editor compile button posts the current semantic document to that endpoint and shows the returned HTML source.

## Current Limits

- Only matrix objects, one 2D graph family, and one 3D graph family are supported.
- Curve rendering supports `y = x^2`; it is not a general equation parser.
- 3D rendering supports the built-in saddle surface and optional time spiral curve; it is not a general 3D equation parser.
- The 3D renderer is SVG projection only. It has semantic metadata, filled surface cells, derivative shading, extended axes, and export-friendly output, but no WebGL z-buffer or interactive camera controls.
- Validation is structural and narrow.
- The compiled HTML asset does not yet inline the full editor stylesheet or KaTeX CSS.
- The editor JSON is read-only.
- The render identity model is attribute-based, not a full render index yet.
