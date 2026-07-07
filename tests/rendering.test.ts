import { strict as assert } from "node:assert";
import test from "node:test";

import { createDefaultLatexRenderer } from "../src/rendering/default-latex.ts";
import {
  projectGraphPoint,
  renderGraphToSvg,
  sampleParabolaCurve
} from "../src/rendering/graph-svg.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";
import {
  defaultLatexRenderer,
  matrixToLatex
} from "../src/rendering/matrix-latex.ts";
import type { KpSemanticObject } from "../src/semantic/document.ts";
import {
  createDefaultGraphScene,
  createParabolaCurve2D,
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
