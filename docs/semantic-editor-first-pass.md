# Semantic Editor First Pass

This pass establishes the smallest working Kinetic Press editor loop:

```text
semantic JSON
  -> default LaTeX representation
  -> KaTeX HTML
  -> graph SVG
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

## Compile Path

The backend exposes `POST /api/compile`.

Input is a `KpDocument` JSON body. Output is a standalone HTML asset containing the rendered editor document. The editor compile button posts the current semantic document to that endpoint and shows the returned HTML source.

## Current Limits

- Only matrix objects and one 2D graph family are supported.
- Curve rendering supports `y = x^2`; it is not a general equation parser.
- Validation is structural and narrow.
- The compiled HTML asset does not yet inline the full editor stylesheet or KaTeX CSS.
- The editor JSON is read-only.
- The render identity model is attribute-based, not a full render index yet.
