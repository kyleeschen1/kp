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

`createDefaultGraph3DScene()` creates `saddle-orbit-graph`, `saddle-orbit-x-axis`, `saddle-orbit-y-axis`, `saddle-orbit-z-axis`, `saddle-surface`, and `time-spiral-curve`.

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

3D graph objects render through the same SVG semantic metadata model. The current renderer uses a pure TypeScript orthographic projection from 3D graph coordinates into SVG coordinates. The 3D graph owns the SVG container, while axes, the saddle surface, and the time spiral render inside it:

```html
data-kp-object="saddle-orbit-graph"
data-kp-render-node="rn-saddle-orbit-graph-svg"
data-kp-type="graph-3d"
```

The 3D SVG uses semantic layers to make the axes feel integrated with the drawing. A projected base-plane grid renders first, x/y axes render as segmented depth-aware lines over that grid, filled surface cells render above them, and the z-axis renders last as a subtler reference axis. This lets the surface visually cover parts of the base plane in SVG without a WebGL z-buffer.

```html
<g class="graph-base-grid"
  data-kp-object="saddle-orbit-graph"
  data-kp-render-node="rn-saddle-orbit-graph-svg-base-grid"
  data-kp-type="graph-3d">
  <line class="graph-base-grid__line" data-kp-depth="0" />
</g>
```

The saddle surface renders as filled SVG quadrilateral cells with mesh lines overlaid. Each cell preserves semantic identity and records its grid coordinate and camera-facing side:

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-quads"
data-kp-type="surface-3d"
data-kp-cell="0,0"
data-kp-facing="front"
```

Cell fill colors use the analytic saddle derivatives:

```text
dz/dx = x / 2
dz/dy = -y / 2
normal = normalize([-dz/dx, -dz/dy, 1])
```

The renderer compares that normal with the current camera direction to color front-facing and back-facing cells differently, then applies a light direction to vary brightness.

```html
data-kp-object="saddle-surface"
data-kp-render-node="rn-saddle-surface-svg-wireframe"
data-kp-type="surface-3d"
```

```html
data-kp-object="time-spiral-curve"
data-kp-render-node="rn-time-spiral-curve-svg-path"
data-kp-type="curve-3d"
```

## Compile Path

The backend exposes `POST /api/compile`.

Input is a `KpDocument` JSON body. Output is a standalone HTML asset containing the rendered editor document. The editor compile button posts the current semantic document to that endpoint and shows the returned HTML source.

## Current Limits

- Only matrix objects, one 2D graph family, and one 3D graph family are supported.
- Curve rendering supports `y = x^2`; it is not a general equation parser.
- 3D rendering supports the built-in saddle surface and time spiral curve; it is not a general 3D equation parser.
- The 3D renderer is SVG projection only. It has semantic metadata, filled surface cells, derivative shading, and export-friendly output, but no WebGL z-buffer or interactive camera controls.
- Validation is structural and narrow.
- The compiled HTML asset does not yet inline the full editor stylesheet or KaTeX CSS.
- The editor JSON is read-only.
- The render identity model is attribute-based, not a full render index yet.
