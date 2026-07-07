import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
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

test("renderGraph3DToSvg renders axes and surface with semantic metadata", () => {
  const scene = createDefaultGraph3DScene();
  const svg = renderGraph3DToSvg(scene, scene[0] as Graph3DObject);

  assert.match(svg, /<svg/);
  assert.match(svg, /data-kp-object="saddle-orbit-graph"/);
  assert.match(svg, /data-kp-object="saddle-orbit-x-axis"/);
  assert.match(svg, /data-kp-object="saddle-orbit-y-axis"/);
  assert.match(svg, /data-kp-object="saddle-orbit-z-axis"/);
  assert.match(svg, /data-kp-object="saddle-surface"/);
  assert.doesNotMatch(svg, /data-kp-object="time-spiral-curve"/);
  assert.doesNotMatch(svg, /time spiral/);
  assert.doesNotMatch(svg, /class="graph-base-grid"/);
  assert.match(svg, /class="graph-axis__segment"/);
  assert.match(svg, /data-kp-depth="/);
  assert.match(svg, /data-kp-axis-visibility-layer="hidden"/);
  assert.match(svg, /data-kp-axis-visibility-layer="visible"/);
  assert.match(svg, /data-kp-visibility="hidden"/);
  assert.match(svg, /data-kp-visibility="visible"/);
  assert.match(svg, /data-kp-axis-extended-domain="-3.900,3.900"/);
  assert.match(svg, /data-kp-axis-extended-domain="-3.250,3.250"/);
  assert.match(svg, /data-kp-camera-azimuth-degrees="35"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-stroke-ratio="2"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-stroke-extra-px="1"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-occlusion-treatment="muted"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-occlusion-treatment="strong"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+style="stroke: #000000; stroke-width: 3.500;/);
  assert.match(svg, /class="graph-axis__arrow"/);
  assert.match(svg, /data-kp-axis-arrow="negative-end"/);
  assert.match(svg, /data-kp-axis-arrow="positive-end"/);
  assert.match(svg, /marker-start="url\(#graph-axis-arrow-/);
  assert.match(svg, /marker-end="url\(#graph-axis-arrow-/);
  assert.match(svg, /graph-axis--base-plane/);
  assert.match(svg, /graph-axis--subtle/);
  assert.match(svg, /class="graph-surface__quad"/);
  assert.match(svg, /class="graph-surface__edge-outline"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-edge-outline"/);
  assert.match(svg, /data-kp-surface-depth="/);
  assert.match(svg, /data-kp-cell="0,0"/);
  assert.match(svg, /data-kp-facing="front"/);
  assert.match(svg, /data-kp-facing="back"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-quads"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-wireframe"/);
  assert.match(svg, /z = \(x\^2 - y\^2\) \/ 4/);

  const surfaceFillHues = [...svg.matchAll(/class="graph-surface__quad"[^>]+fill="hsl\((\d+) /g)].map(
    (match) => Number(match[1])
  );
  const surfaceFills = [...svg.matchAll(/class="graph-surface__quad"[^>]+data-kp-facing="(front|back)"[^>]+fill="hsl\((\d+) (\d+)% (\d+)%\)"/g)].map(
    (match) => ({
      facing: match[1],
      hue: Number(match[2]),
      lightness: Number(match[4])
    })
  );
  const frontLightness = surfaceFills
    .filter((fill) => fill.facing === "front")
    .map((fill) => fill.lightness);
  const backLightness = surfaceFills
    .filter((fill) => fill.facing === "back")
    .map((fill) => fill.lightness);
  const surfaceDepths = [...svg.matchAll(/data-kp-surface-depth="(-?\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const arrowSizes = [...svg.matchAll(/class="graph-axis__arrow"[^>]+markerWidth="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const hiddenAxisOpacities = [...svg.matchAll(/data-kp-visibility="hidden"[^>]+opacity: (\d+(?:\.\d+)?);/g)].map(
    (match) => Number(match[1])
  );
  const visibleAxisOpacities = [...svg.matchAll(/data-kp-visibility="visible"[^>]+opacity: (\d+(?:\.\d+)?);/g)].map(
    (match) => Number(match[1])
  );

  assert.ok(surfaceFillHues.length > 0);
  assert.ok(surfaceFillHues.every((hue) => hue >= 184 && hue <= 224));
  assert.ok(frontLightness.length > 0);
  assert.ok(backLightness.length > 0);
  assert.ok(
    backLightness.every((lightness) => lightness > Math.min(...frontLightness))
  );
  assert.ok(surfaceFills.every((fill) => fill.hue >= 184 && fill.hue <= 224));
  assert.ok(surfaceDepths.length > 0);
  assert.ok(
    surfaceDepths.every(
      (depth, index) => index === 0 || depth >= surfaceDepths[index - 1]!
    )
  );
  assert.ok(arrowSizes.length > 0);
  assert.ok(arrowSizes.every((size) => size >= 4 && size <= 8));
  assert.ok(hiddenAxisOpacities.length > 0);
  assert.ok(visibleAxisOpacities.length > 0);
  assert.ok(hiddenAxisOpacities.every((opacity) => opacity >= 0.84));
  assert.ok(visibleAxisOpacities.every((opacity) => opacity >= 0.92));
  assert.ok(
    svg.indexOf('class="graph-surface__quad"') <
      svg.indexOf('class="graph-surface__line')
  );
  assert.ok(
    svg.indexOf('class="graph-surface__quad"') <
      svg.indexOf('data-kp-axis-visibility-layer="hidden"')
  );
  assert.ok(
    svg.indexOf('data-kp-axis-visibility-layer="hidden"') <
      svg.indexOf('data-kp-axis-visibility-layer="visible"')
  );
});

test("3D surface quads are fully opaque in the stylesheet", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.graph-surface__quad\s*{[^}]*opacity:\s*1;/s);
  assert.match(
    css,
    /\.graph-surface__quad\[data-kp-facing="back"\]\s*{[^}]*opacity:\s*1;/s
  );
});
