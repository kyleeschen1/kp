import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { add, constant, power, variable } from "../src/math/expression.ts";
import { createDefaultLatexRenderer } from "../src/rendering/default-latex.ts";
import {
  projectGraphPoint,
  projectGraphPoint3D,
  renderGraph3DToSvg,
  renderGraphToSvg,
  sampleParabolaCurve,
  sampleSaddleSurfaceMorph,
  sampleSaddleSurface,
  sampleTimeSpiralCurve
} from "../src/rendering/graph-svg.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";
import {
  defaultLatexRenderer,
  matrixToLatex
} from "../src/rendering/matrix-latex.ts";
import { createGraphSceneFromLatexEquation } from "../src/semantic/equation-graph.ts";
import type { KpSemanticObject } from "../src/semantic/document.ts";
import {
  createDefaultGraphScene,
  createDefaultGraph3DScene,
  createParabolaCurve2D,
  createSaddleWeaveCurve3D,
  createSaddleSurface3D,
  createTimeSpiralCurve3D,
  type Curve3DObject,
  type Curve2DObject,
  type Graph3DObject,
  type Graph2DObject,
  type Surface3DObject
} from "../src/semantic/graph.ts";
import { createMatrixObject, identityMatrix } from "../src/semantic/matrix.ts";

interface SvgPoint {
  x: number;
  y: number;
}

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

test("sampleParabolaCurve samples expression-backed 2D curves", () => {
  const scene = createGraphSceneFromLatexEquation({
    idPrefix: "shifted-parabola",
    latex: "y = x^2 + 1"
  });
  const curve = scene.find(
    (object): object is Curve2DObject => object.type === "curve-2d"
  );

  if (curve === undefined) {
    throw new Error("Expected generated 2D curve.");
  }

  assert.deepEqual(sampleParabolaCurve({ ...curve, xDomain: [-1, 1], sampleCount: 3 }), [
    { x: -1, y: 2 },
    { x: 0, y: 1 },
    { x: 1, y: 2 }
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

test("sampleTimeSpiralCurve samples expression-backed 3D curves", () => {
  const curve: Curve3DObject = {
    ...createTimeSpiralCurve3D({
      id: "expression-curve",
      graphId: "saddle-orbit-graph",
      tDomain: [-1, 1],
      sampleCount: 3
    }),
    equation: {
      x: "t",
      y: "t^2",
      z: "t + 1"
    },
    expressions: {
      x: variable("t"),
      y: power(variable("t"), 2),
      z: add(variable("t"), constant(1))
    }
  };

  assert.deepEqual(sampleTimeSpiralCurve(curve), [
    { x: -1, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 1, z: 2 }
  ]);
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

test("sampleSaddleSurface samples parameterized saddle surfaces", () => {
  const surface = createSaddleSurface3D({
    id: "flat-saddle-surface",
    graphId: "saddle-orbit-graph",
    denominator: 8,
    xDomain: [-2, 2],
    yDomain: [-2, 2],
    xSampleCount: 3,
    ySampleCount: 3
  });
  const grid = sampleSaddleSurface(surface);

  assert.deepEqual(grid[1]?.[2], {
    x: 2,
    y: 0,
    z: 0.5
  });
});

test("sampleSaddleSurfaceMorph samples interpolated saddle denominators", () => {
  const surface = createSaddleSurface3D({
    id: "saddle-surface",
    graphId: "saddle-orbit-graph",
    denominator: 4,
    xDomain: [-2, 2],
    yDomain: [-2, 2],
    xSampleCount: 3,
    ySampleCount: 3
  });
  const sample = sampleSaddleSurfaceMorph(surface, {
    targetDenominator: 8,
    progress: 0.5
  });

  assert.equal(sample.denominator, 6);
  assert.equal(sample.progress, 0.5);
  assert.deepEqual(sample.grid[1]?.[2], {
    x: 2,
    y: 0,
    z: 0.667
  });
  assert.equal(surface.parameterization?.denominator, 4);
});

test("sampleSaddleSurface samples expression-backed 3D surfaces", () => {
  const scene = createGraphSceneFromLatexEquation({
    idPrefix: "x-sheet",
    latex: "z = x^2"
  });
  const surface = scene.find(
    (object): object is Surface3DObject => object.type === "surface-3d"
  );

  if (surface === undefined) {
    throw new Error("Expected generated 3D surface.");
  }

  const grid = sampleSaddleSurface({
    ...surface,
    xDomain: [-1, 1],
    yDomain: [-1, 1],
    xSampleCount: 3,
    ySampleCount: 3
  });

  assert.deepEqual(grid[0]?.[0], {
    x: -1,
    y: -1,
    z: 1
  });
  assert.deepEqual(grid[0]?.[1], {
    x: 0,
    y: -1,
    z: 0
  });
  assert.deepEqual(grid[0]?.[2], {
    x: 1,
    y: -1,
    z: 1
  });
});

test("renderGraph3DToSvg renders axes and surface with semantic metadata", () => {
  const scene = createDefaultGraph3DScene();
  const svg = renderGraph3DToSvg(scene, scene[0] as Graph3DObject);
  const customScene = scene.map((object) =>
    object.type === "graph-3d"
      ? {
          ...object,
          occludedAxisLightness: 50
        }
      : object
  );
  const customSvg = renderGraph3DToSvg(customScene, customScene[0] as Graph3DObject);
  const lowLightScene = scene.map((object) =>
    object.type === "graph-3d"
      ? {
          ...object,
          light: {
            ...object.light,
            ambient: 0.2,
            diffuse: 0
          }
        }
      : object
  );
  const lowLightSvg = renderGraph3DToSvg(
    lowLightScene,
    lowLightScene[0] as Graph3DObject
  );
  const debugScene = scene.map((object) =>
    object.type === "graph-3d"
      ? {
          ...object,
          debug: {
            ...object.debug,
            depthOverlay: true
          }
        }
      : object
  );
  const debugSvg = renderGraph3DToSvg(debugScene, debugScene[0] as Graph3DObject);
  const meshScene = scene.map((object) =>
    object.type === "graph-3d"
      ? {
          ...object,
          debug: {
            ...object.debug,
            surfaceMesh: true
          }
        }
      : object
  );
  const meshSvg = renderGraph3DToSvg(meshScene, meshScene[0] as Graph3DObject);

  assert.match(svg, /<svg/);
  assert.match(svg, /data-kp-object="saddle-orbit-graph"/);
  assert.match(svg, /data-kp-object="saddle-orbit-x-axis"/);
  assert.match(svg, /data-kp-object="saddle-orbit-y-axis"/);
  assert.match(svg, /data-kp-object="saddle-orbit-z-axis"/);
  assert.match(svg, /data-kp-object="saddle-surface"/);
  assert.doesNotMatch(svg, /data-kp-object="time-spiral-curve"/);
  assert.doesNotMatch(svg, /time spiral/);
  assert.doesNotMatch(svg, /class="graph-base-grid"/);
  assert.doesNotMatch(svg, /<text\b/);
  assert.match(svg, /class="graph-axis__segment"/);
  assert.match(svg, /data-kp-depth="/);
  assert.match(svg, /data-kp-axis-visibility-layer="hidden"/);
  assert.match(svg, /data-kp-axis-visibility-layer="visible"/);
  assert.match(svg, /data-kp-axis-split-source="analytic-surface\+depth-buffer"/);
  assert.match(svg, /data-kp-axis-analytic-split-count="1"/);
  assert.match(svg, /data-kp-visibility="hidden"/);
  assert.match(svg, /data-kp-visibility="visible"/);
  assert.match(svg, /data-kp-axis-extended-domain="-3.900,3.900"/);
  assert.match(svg, /data-kp-axis-extended-domain="-3.250,3.250"/);
  assert.match(svg, /data-kp-camera-azimuth-degrees="35"/);
  assert.match(svg, /data-kp-occluded-axis-lightness="44"/);
  assert.match(svg, /data-kp-light-direction="-0.350,-0.450,0.820"/);
  assert.match(svg, /data-kp-light-ambient="0.450"/);
  assert.match(svg, /data-kp-light-diffuse="0.400"/);
  assert.match(svg, /data-kp-light-depth-haze="1"/);
  assert.match(svg, /data-kp-light-specular="0.120"/);
  assert.match(svg, /data-kp-light-rim="0.080"/);
  assert.match(svg, /data-kp-debug-depth-overlay="false"/);
  assert.match(svg, /data-kp-debug-surface-mesh="false"/);
  assert.doesNotMatch(svg, /class="graph-debug-overlay"/);
  assert.match(svg, /data-kp-depth-buffer-scale="1"/);
  assert.match(svg, /data-kp-depth-buffer-width="560"/);
  assert.match(svg, /data-kp-depth-buffer-height="420"/);
  assert.match(svg, /data-kp-depth-cell-count="235200"/);
  assert.match(svg, /data-kp-shadow-plane-z="-2.500"/);
  assert.match(svg, /data-kp-shadow-quad-count="144"/);
  assert.match(svg, /data-kp-render-budget-status="ok"/);
  assert.match(svg, /data-kp-render-budget-depth-cell-count="235200"/);
  assert.match(svg, /data-kp-render-budget-max-depth-cell-count="300000"/);
  assert.match(svg, /data-kp-render-budget-depth-triangle-count="288"/);
  assert.match(svg, /data-kp-render-budget-max-depth-triangle-count="800"/);
  assert.match(svg, /data-kp-render-budget-lighting-operation-count="864"/);
  assert.match(svg, /data-kp-render-budget-max-lighting-operation-count="8000"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-stroke-ratio="2"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-stroke-extra-px="1"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-occlusion-treatment="muted"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-occlusion-treatment="strong"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-visibility-source="depth-buffer"/);
  assert.match(svg, /class="graph-axis__arrow"[^>]+data-kp-visibility-source="depth-buffer"/);
  assert.match(svg, /class="graph-axis__arrow"[^>]+data-kp-axis-arrow-visibility-source="endpoint-segment"/);
  assert.match(svg, /class="graph-axis__arrow"[^>]+data-kp-axis-arrow-end-segment-visibility="(?:hidden|visible)"/);
  assert.doesNotMatch(svg, /<line class="graph-axis__segment"/);
  assert.match(svg, /<polygon class="graph-axis__segment"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-visibility="hidden"[^>]+fill="#5d7583"/);
  assert.match(svg, /class="graph-axis__segment"[^>]+data-kp-visibility="visible"[^>]+fill="#000000"/);
  assert.match(customSvg, /data-kp-occluded-axis-lightness="50"/);
  assert.match(customSvg, /class="graph-axis__segment"[^>]+data-kp-visibility="hidden"[^>]+fill="#6a8595"/);
  assert.match(debugSvg, /data-kp-debug-depth-overlay="true"/);
  assert.match(debugSvg, /class="graph-debug-overlay graph-debug-overlay--depth"/);
  assert.match(debugSvg, /data-kp-debug-overlay="depth-buffer"/);
  assert.match(debugSvg, /data-kp-debug-sample-columns="28"/);
  assert.match(debugSvg, /data-kp-debug-sample-rows="21"/);
  assert.match(debugSvg, /class="graph-debug-overlay__cell"/);
  assert.match(meshSvg, /data-kp-debug-surface-mesh="true"/);
  assert.match(meshSvg, /data-kp-render-node="rn-saddle-surface-svg-wireframe"/);
  assert.match(meshSvg, /data-kp-surface-mesh="debug"/);
  assert.match(meshSvg, /class="graph-surface__line/);
  assert.match(svg, /class="graph-axis__arrow"/);
  assert.match(svg, /data-kp-axis-arrow="negative-end"/);
  assert.match(svg, /data-kp-axis-arrow="positive-end"/);
  assert.doesNotMatch(svg, /<marker class="graph-axis__arrow"/);
  assert.doesNotMatch(svg, /marker-(?:start|end)=/);
  assert.match(svg, /<polygon class="graph-axis__arrow"/);
  assert.match(svg, /graph-axis--base-plane/);
  assert.match(svg, /graph-axis--subtle/);
  assert.match(svg, /class="graph-surface__quad"/);
  assert.match(svg, /class="graph-surface-shadow-layer"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-shadow-layer"/);
  assert.match(svg, /class="graph-surface__shadow"/);
  assert.match(svg, /data-kp-shadow-caster="saddle-surface"/);
  assert.match(svg, /data-kp-shadow-projection="light-to-z-plane"/);
  assert.match(svg, /data-kp-lighting-model="ambient-diffuse-specular-rim-depth-haze"/);
  assert.match(svg, /class="graph-surface__quad"[^>]+data-kp-light-direction="-0.350,-0.450,0.820"/);
  assert.match(svg, /class="graph-surface__quad"[^>]+data-kp-light-ambient="0.450"/);
  assert.match(svg, /class="graph-surface__quad"[^>]+data-kp-light-diffuse="0.400"/);
  assert.match(svg, /class="graph-surface__quad"[^>]+data-kp-light-depth-haze="1"/);
  assert.match(svg, /class="graph-surface__quad"[^>]+data-kp-light-specular="0.120"/);
  assert.match(svg, /class="graph-surface__quad"[^>]+data-kp-light-rim="0.080"/);
  assert.match(svg, /data-kp-depth-haze="/);
  assert.match(svg, /class="graph-surface__edge-outline"/);
  assert.match(svg, /class="graph-surface__edge-outline"[^>]+data-kp-visibility-source="depth-buffer"/);
  assert.match(svg, /data-kp-edge-visibility="hidden"/);
  assert.match(svg, /data-kp-edge-visibility="visible"/);
  assert.match(svg, /data-kp-edge-split-source="analytic-surface\+depth-buffer"/);
  assert.match(svg, /data-kp-edge-analytic-split-count="0"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-edge-outline-hidden"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-edge-outline-visible"/);
  assert.match(svg, /data-kp-surface-depth="/);
  assert.match(svg, /data-kp-cell="0,0"/);
  assert.match(svg, /data-kp-facing="front"/);
  assert.match(svg, /data-kp-facing="back"/);
  assert.match(svg, /data-kp-render-node="rn-saddle-surface-svg-quads"/);
  assert.doesNotMatch(svg, /data-kp-render-node="rn-saddle-surface-svg-wireframe"/);
  assert.doesNotMatch(svg, /class="graph-surface__line/);
  assert.doesNotMatch(svg, /z = \(x\^2 - y\^2\) \/ 4/);

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
  const surfaceOpacityByFacing = [...svg.matchAll(/class="graph-surface__quad"[^>]+data-kp-facing="(front|back)"[^>]+fill-opacity="(\d+(?:\.\d+)?)"[^>]+opacity="(\d+(?:\.\d+)?)"/g)].map(
    (match) => ({
      facing: match[1],
      fillOpacity: Number(match[2]),
      opacity: Number(match[3])
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
  const surfaceDepthHazes = [...svg.matchAll(/data-kp-depth-haze="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const defaultSurfaceQuadFills = [...svg.matchAll(/class="graph-surface__quad"[^>]+fill="([^"]+)"/g)].map(
    (match) => match[1]
  );
  const lowLightSurfaceQuadFills = [...lowLightSvg.matchAll(/class="graph-surface__quad"[^>]+fill="([^"]+)"/g)].map(
    (match) => match[1]
  );
  const axisStrips = [...svg.matchAll(/<polygon class="graph-axis__segment"[^>]+points="([^"]+)"/g)].map(
    (match) => parseSvgPoints(match[1]!)
  );
  const axisStripWidths = axisStrips.flatMap((points) => [
    distanceBetween(points[0]!, points[3]!),
    distanceBetween(points[1]!, points[2]!)
  ]);
  const edgeStrips = [...svg.matchAll(/<polygon class="graph-surface__edge-outline"[^>]+points="([^"]+)"/g)].map(
    (match) => parseSvgPoints(match[1]!)
  );
  const edgeStripWidths = edgeStrips.flatMap((points) => [
    distanceBetween(points[0]!, points[3]!),
    distanceBetween(points[1]!, points[2]!)
  ]);
  const arrowLengths = [...svg.matchAll(/class="graph-axis__arrow"[^>]+data-kp-arrow-length="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const hiddenArrowLengths = [...svg.matchAll(/class="graph-axis__arrow"[^>]+data-kp-visibility="hidden"[^>]+data-kp-arrow-length="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const hiddenAxisOpacities = [...svg.matchAll(/<polygon class="graph-axis__segment"[^>]+data-kp-visibility="hidden"[^>]+opacity="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const visibleAxisOpacities = [...svg.matchAll(/<polygon class="graph-axis__segment"[^>]+data-kp-visibility="visible"[^>]+opacity="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const hiddenArrowOpacities = [...svg.matchAll(/<polygon class="graph-axis__arrow"[^>]+data-kp-axis-arrow="(?:negative|positive)-end"[^>]+data-kp-visibility="hidden"[^>]+opacity="(\d+(?:\.\d+)?)"/g)].map(
    (match) => Number(match[1])
  );
  const hiddenArrowFills = [...svg.matchAll(/<polygon class="graph-axis__arrow"[^>]+data-kp-axis-arrow="(?:negative|positive)-end"[^>]+data-kp-visibility="hidden"[^>]+fill="([^"]+)"/g)].map(
    (match) => match[1]
  );
  const arrowTipChecks = [...svg.matchAll(/<polygon class="graph-axis__arrow"[^>]+data-kp-axis-tip="([^"]+)"[^>]+data-kp-axis-endpoint="([^"]+)"[^>]+points="([^"]+)"/g)].map(
    (match) => ({
      tip: parsePointPair(match[1]!),
      endpoint: parsePointPair(match[2]!),
      points: parseSvgPoints(match[3]!)
    })
  );
  const arrowBaseWidths = arrowTipChecks.map((check) =>
    distanceBetween(check.points[1]!, check.points[2]!)
  );
  const edgeSegmentCount = [...svg.matchAll(/data-kp-edge-segment="/g)].length;
  const shadowQuadCount = [...svg.matchAll(/class="graph-surface__shadow"/g)].length;

  assert.ok(surfaceFillHues.length > 0);
  assert.ok(surfaceFillHues.every((hue) => hue >= 184 && hue <= 224));
  assert.ok(frontLightness.length > 0);
  assert.ok(backLightness.length > 0);
  assert.ok(surfaceOpacityByFacing.some((surface) => surface.facing === "front"));
  assert.ok(surfaceOpacityByFacing.some((surface) => surface.facing === "back"));
  assert.ok(
    surfaceOpacityByFacing.every(
      (surface) => surface.fillOpacity === 1 && surface.opacity === 1
    )
  );
  assert.ok(
    backLightness.every((lightness) => lightness > Math.min(...frontLightness))
  );
  assert.ok(surfaceFills.every((fill) => fill.hue >= 184 && fill.hue <= 224));
  assert.ok(surfaceDepths.length > 0);
  assert.ok(surfaceDepthHazes.length > 0);
  assert.ok(surfaceDepthHazes.every((haze) => haze >= 0 && haze <= 1));
  assert.ok(defaultSurfaceQuadFills.length > 0);
  assert.deepEqual(lowLightSurfaceQuadFills.length, defaultSurfaceQuadFills.length);
  assert.notDeepEqual(lowLightSurfaceQuadFills, defaultSurfaceQuadFills);
  assert.ok(
    surfaceDepths.every(
      (depth, index) => index === 0 || depth >= surfaceDepths[index - 1]!
    )
  );
  assert.ok(axisStrips.length > 0);
  assert.ok(axisStrips.every((points) => points.length === 4));
  assert.ok(axisStripWidths.length > 0);
  assert.ok(axisStripWidths.every((width) => width >= 1.75 && width <= 3.5));
  assert.ok(Math.max(...axisStripWidths) > Math.min(...axisStripWidths));
  assert.ok(edgeStrips.length > 0);
  assert.ok(edgeStrips.every((points) => points.length === 4));
  assert.ok(edgeStripWidths.length > 0);
  assert.ok(edgeStripWidths.every((width) => width >= 1.3 && width <= 2.6));
  assert.ok(Math.max(...edgeStripWidths) > Math.min(...edgeStripWidths));
  assert.equal(shadowQuadCount, 144);
  assert.ok(arrowLengths.length > 0);
  assert.ok(arrowLengths.every((length) => length >= 8 && length <= 16));
  assert.ok(hiddenArrowLengths.length > 0);
  assert.ok(hiddenArrowLengths.every((length) => length <= 14));
  assert.ok(arrowBaseWidths.length > 0);
  assert.ok(arrowBaseWidths.every((width) => width >= 9.5 && width <= 21));
  assert.ok(hiddenAxisOpacities.length > 0);
  assert.ok(visibleAxisOpacities.length > 0);
  assert.ok(hiddenAxisOpacities.every((opacity) => opacity === 1));
  assert.ok(visibleAxisOpacities.every((opacity) => opacity >= 0.92));
  assert.ok(hiddenArrowOpacities.length > 0);
  assert.ok(hiddenArrowOpacities.every((opacity) => opacity === 1));
  assert.ok(hiddenArrowFills.every((fill) => fill === "#5d7583"));
  assert.ok(arrowTipChecks.length > 0);
  assert.ok(
    arrowTipChecks.every((check) => {
      const [firstPoint] = check.points;

      return (
        firstPoint !== undefined &&
        pointsAreAlmostEqual(firstPoint, check.tip) &&
        pointsAreAlmostEqual(check.tip, check.endpoint)
      );
    })
  );
  assert.ok(edgeSegmentCount > 48);
  assert.ok(
    svg.indexOf('data-kp-edge-visibility="hidden"') <
      svg.indexOf('class="graph-surface__quad"')
  );
  assert.ok(
    svg.indexOf('class="graph-surface__quad"') <
      svg.indexOf('data-kp-edge-visibility="visible"')
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

test("renderGraph3DToSvg depth-classifies 3D curve segments when present", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const curve = createSaddleWeaveCurve3D({
    id: "saddle-weave-curve",
    graphId: graph.id,
    tDomain: [-3, 3],
    sampleCount: 48
  });
  const svg = renderGraph3DToSvg([...scene, curve], graph);

  assert.match(svg, /data-kp-object="saddle-weave-curve"/);
  assert.match(svg, /class="graph-curve__segment"/);
  assert.match(svg, /class="graph-curve__segment"[^>]+data-kp-visibility-source="depth-buffer"/);
  assert.match(svg, /class="graph-curve__segment"[^>]+data-kp-visibility="hidden"/);
  assert.match(svg, /class="graph-curve__segment"[^>]+data-kp-visibility="visible"/);
});

test("renderGraph3DToSvg exposes depth-scene counts for multiple surfaces", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const secondSurface = createSaddleSurface3D({
    id: "second-saddle-surface",
    graphId: graph.id,
    xDomain: [-2, 2],
    yDomain: [-2, 2],
    xSampleCount: 13,
    ySampleCount: 13
  });
  const svg = renderGraph3DToSvg([...scene, secondSurface], graph);
  const overlapMatch = svg.match(/data-kp-depth-overlap-count="(\d+)"/);

  assert.match(svg, /data-kp-depth-surface-count="2"/);
  assert.match(svg, /data-kp-depth-triangle-count="576"/);
  assert.notEqual(overlapMatch, null);
  assert.ok(Number(overlapMatch?.[1]) > 0);
  assert.match(svg, /data-kp-object="saddle-surface"/);
  assert.match(svg, /data-kp-object="second-saddle-surface"/);
});

test("renderGraph3DToSvg orders opaque surface quads back to front", () => {
  const scene = createDefaultGraph3DScene();
  const svg = renderGraph3DToSvg(scene, scene[0] as Graph3DObject);
  const depths = Array.from(
    svg.matchAll(
      /class="graph-surface__quad"[^>]+data-kp-surface-depth="([^"]+)"/g
    ),
    (match) => Number(match[1])
  );
  const sortedDepths = [...depths].sort((left, right) => left - right);

  assert.ok(depths.length > 0);
  assert.deepEqual(depths, sortedDepths);
  assert.match(svg, /data-kp-depth-order="back-to-front"/);
});

test("3D surface quads are fully opaque in the stylesheet", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.graph-surface__quad\s*{[^}]*opacity:\s*1;/s);
  assert.match(
    css,
    /\.graph-surface__quad\[data-kp-facing="back"\]\s*{[^}]*opacity:\s*1;/s
  );
  assert.match(css, /\.graph-surface__edge-outline\s*{[^}]*fill:\s*#0f3d5e;/s);
});

function parseSvgPoints(value: string): readonly SvgPoint[] {
  return value.trim().split(/\s+/).map(parsePointPair);
}

function parsePointPair(value: string): SvgPoint {
  const [rawX, rawY] = value.split(",");
  const x = Number(rawX);
  const y = Number(rawY);

  assert.ok(Number.isFinite(x));
  assert.ok(Number.isFinite(y));

  return { x, y };
}

function distanceBetween(left: SvgPoint, right: SvgPoint): number {
  return Number(Math.hypot(left.x - right.x, left.y - right.y).toFixed(3));
}

function pointsAreAlmostEqual(left: SvgPoint, right: SvgPoint): boolean {
  return Math.abs(left.x - right.x) <= 0.001 && Math.abs(left.y - right.y) <= 0.001;
}
