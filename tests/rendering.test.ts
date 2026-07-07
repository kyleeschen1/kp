import { strict as assert } from "node:assert";
import test from "node:test";

import { createDefaultLatexRenderer } from "../src/rendering/default-latex.ts";
import {
  projectGraphPoint,
  projectGraphPoint3D,
  renderGraph3DToSvg,
  renderGraphToSvg,
  sampleParabolaCurve,
  sampleSaddleSurface,
  sampleTimeSpiralCurve
} from "../src/rendering/graph-svg.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";
import {
  defaultLatexRenderer,
  matrixToLatex
} from "../src/rendering/matrix-latex.ts";
import type { KpSemanticObject } from "../src/semantic/document.ts";
import {
  createDefaultGraphScene,
  createDefaultGraph3DScene,
  createParabolaCurve2D,
  createSaddleSurface3D,
  createTimeSpiralCurve3D,
  type Graph3DObject,
  type Graph2DObject
} from "../src/semantic/graph.ts";
import { createMatrixObject, identityMatrix } from "../src/semantic/matrix.ts";

test("default LaTeX renderer dispatches by semantic object type", () => {
  const renderer = createDefaultLatexRenderer([
    {
      type: "matrix",
      render: (object) => object.label
    }
  ]);
  const matrix = createMatrixObject({
    id: "A",
    label: "A",
    rows: [[1]]
  });

  assert.equal(renderer.render(matrix), "A");
});

test("default LaTeX renderer rejects unsupported semantic object types", () => {
  const renderer = createDefaultLatexRenderer([]);

  assert.throws(
    () =>
      renderer.render({
        id: "x",
        type: "unknown"
      } as unknown as KpSemanticObject),
    /No default LaTeX renderer registered for unknown/
  );
});

test("matrixToLatex renders a matrix with a default bmatrix representation", () => {
  const matrix = identityMatrix({
    id: "identity-3x3",
    label: "I_3",
    size: 3
  });

  assert.equal(
    matrixToLatex(matrix),
    String.raw`I_3 = \begin{bmatrix}1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1\end{bmatrix}`
  );
  assert.equal(defaultLatexRenderer.render(matrix), matrixToLatex(matrix));
});

test("renderLatexToHtml renders KaTeX HTML for a LaTeX string", () => {
  const html = renderLatexToHtml(String.raw`I_3 = \begin{bmatrix}1\end{bmatrix}`);

  assert.match(html, /class="katex"/);
  assert.match(html, /aria-hidden="true"/);
});

test("projectGraphPoint maps graph coordinates into SVG coordinates", () => {
  const [graph] = createDefaultGraphScene();

  assert.deepEqual(
    projectGraphPoint(graph as Graph2DObject, {
      x: 0,
      y: 0
    }),
    {
      x: 260,
      y: 324
    }
  );
});

test("sampleParabolaCurve samples y = x^2 across the curve domain", () => {
  const curve = createParabolaCurve2D({
    id: "curve",
    graphId: "graph",
    xDomain: [-1, 1],
    sampleCount: 3
  });

  assert.deepEqual(sampleParabolaCurve(curve), [
    { x: -1, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);
});

test("renderGraphToSvg renders graph, axes, and curve with semantic metadata", () => {
  const scene = createDefaultGraphScene();
  const svg = renderGraphToSvg(scene, scene[0] as Graph2DObject);

  assert.match(svg, /<svg/);
  assert.match(svg, /data-kp-object="parabola-graph"/);
  assert.match(svg, /data-kp-object="parabola-x-axis"/);
  assert.match(svg, /data-kp-object="parabola-y-axis"/);
  assert.match(svg, /data-kp-object="curve-y-equals-x-squared"/);
  assert.match(svg, /data-kp-render-node="rn-curve-y-equals-x-squared-svg-path"/);
  assert.match(svg, /x\^2 = y/);
});

test("projectGraphPoint3D maps graph coordinates into projected SVG coordinates", () => {
  const [graph] = createDefaultGraph3DScene();
  const projected = projectGraphPoint3D(graph as Graph3DObject, {
    x: 0,
    y: 0,
    z: 0
  });

  assert.deepEqual(projected, {
    x: 280,
    y: 244,
    depth: 0
  });
});

test("sampleTimeSpiralCurve samples a time-visible 3D spiral", () => {
  const curve = createTimeSpiralCurve3D({
    id: "time-spiral-curve",
    graphId: "saddle-orbit-graph",
    tDomain: [0, Math.PI * 4],
    sampleCount: 3
  });

  const points = sampleTimeSpiralCurve(curve);

  assert.equal(points.length, 3);
  assert.deepEqual(points[0], {
    x: 2.2,
    y: 0,
    z: -1.131
  });
  assert.deepEqual(points[1], {
    x: 2.2,
    y: 0,
    z: 0
  });
  assert.deepEqual(points[2], {
    x: 2.2,
    y: 0,
    z: 1.131
  });
});

test("sampleSaddleSurface samples z = (x^2 - y^2) / 4 as a grid", () => {
  const surface = createSaddleSurface3D({
    id: "saddle-surface",
    graphId: "saddle-orbit-graph",
    xDomain: [-2, 2],
    yDomain: [-2, 2],
    xSampleCount: 3,
    ySampleCount: 3
  });

  const grid = sampleSaddleSurface(surface);

  assert.equal(grid.length, 3);
  assert.equal(grid[0]?.length, 3);
  assert.deepEqual(grid[1]?.[1], {
    x: 0,
    y: 0,
    z: 0
  });
  assert.deepEqual(grid[1]?.[2], {
    x: 2,
    y: 0,
    z: 1
  });
});

test("renderGraph3DToSvg renders axes, surface, and curve with semantic metadata", () => {
  const scene = createDefaultGraph3DScene();
  const svg = renderGraph3DToSvg(scene, scene[0] as Graph3DObject);

  assert.match(svg, /<svg/);
  assert.match(svg, /data-kp-object="saddle-orbit-graph"/);
  assert.match(svg, /data-kp-object="saddle-orbit-x-axis"/);
  assert.match(svg, /data-kp-object="saddle-orbit-y-axis"/);
  assert.match(svg, /data-kp-object="saddle-orbit-z-axis"/);
  assert.match(svg, /data-kp-object="saddle-surface"/);
  assert.match(svg, /data-kp-object="time-spiral-curve"/);
  assert.match(svg, /class="graph-surface__quad"/);
  assert.match(svg, /data-kp-cell="0,0"/);
  assert.match(svg, /data-kp-facing="front"/);
  assert.match(svg, /data-kp-facing="back"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-quads"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-wireframe"/);
  assert.match(svg, /data-kp-render-node="rn-time-spiral-curve-svg-path"/);
  assert.match(svg, /z = \(x\^2 - y\^2\) \/ 4/);
  assert.match(svg, /time spiral/);
  assert.ok(
    svg.indexOf('class="graph-surface__quad"') <
      svg.indexOf('class="graph-surface__line')
  );
});
