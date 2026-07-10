import { strict as assert } from "node:assert";
import test from "node:test";

import { expressionToLatex } from "../src/math/expression.ts";
import {
  createGraphSceneFromLatexEquation
} from "../src/semantic/equation-graph.ts";
import {
  deriveGraphLatexFromScene
} from "../src/semantic/graph-latex.ts";
import type {
  Curve2DObject,
  Graph2DObject,
  Graph3DObject,
  Surface3DObject
} from "../src/semantic/graph.ts";
import {
  createGraph2DObject
} from "../src/semantic/graph.ts";
import { power, variable } from "../src/math/expression.ts";

test("createGraphSceneFromLatexEquation creates a 2D curve scene", () => {
  const scene = createGraphSceneFromLatexEquation({
    idPrefix: "typed-parabola",
    latex: "y = x^2"
  });
  const graph = scene[0] as Graph2DObject;
  const curve = scene[3] as Curve2DObject;

  assert.deepEqual(
    scene.map((object) => object.type),
    ["graph-2d", "axis-2d", "axis-2d", "curve-2d"]
  );
  assert.equal(graph.id, "typed-parabola-graph");
  assert.equal(graph.xAxisId, "typed-parabola-x-axis");
  assert.equal(graph.yAxisId, "typed-parabola-y-axis");
  assert.equal(curve.id, "typed-parabola-curve");
  assert.equal(curve.graphId, graph.id);
  assert.equal(curve.equation, "y = x^2");
  assert.equal(curve.latexProvenance?.kind, "exact");
  assert.equal(curve.latexProvenance?.latex, "y = x^2");
  assert.equal(curve.latexProvenance?.sourceKind, "equation");
  assert.equal(expressionToLatex(curve.expression), "x^{2}");
});

test("deriveGraphLatexFromScene requires exact provenance for graph LaTeX", () => {
  const scene = createGraphSceneFromLatexEquation({
    idPrefix: "typed-parabola",
    latex: "y = x^2"
  });
  const graph = scene[0] as Graph2DObject;
  const derivation = deriveGraphLatexFromScene(scene, graph.id);

  assert.equal(derivation.kind, "exact");
  assert.equal(derivation.descriptorId, "graph2d.exact-latex");
  assert.equal(derivation.latex, "y = x^2");
  assert.deepEqual(derivation.sourceObjectIds, ["typed-parabola-curve"]);
});

test("deriveGraphLatexFromScene marks unproven sampled graph LaTeX honestly", () => {
  const graph = createGraph2DObject({
    id: "sampled-graph",
    label: "Sampled graph",
    xAxisId: "sampled-x-axis",
    yAxisId: "sampled-y-axis",
    xDomain: [-3, 3],
    yDomain: [-1, 9],
    width: 520,
    height: 360
  });
  const curve: Curve2DObject = {
    id: "sampled-curve",
    type: "curve-2d",
    graphId: graph.id,
    label: "sampled y = x^2",
    equation: "y = x^2",
    expression: power(variable("x"), 2),
    xDomain: graph.xDomain,
    sampleCount: 121
  };
  const derivation = deriveGraphLatexFromScene([graph, curve], graph.id);

  assert.equal(derivation.kind, "sampled");
  assert.equal(derivation.descriptorId, "graph2d.sampled-latex");
  assert.match(derivation.reason, /exact LaTeX provenance/);
  assert.deepEqual(derivation.sourceObjectIds, ["sampled-curve"]);
});

test("createGraphSceneFromLatexEquation creates a 3D surface scene", () => {
  const scene = createGraphSceneFromLatexEquation({
    idPrefix: "typed-saddle",
    latex: "z = \\frac{x^2-y^2}{4}"
  });
  const graph = scene[0] as Graph3DObject;
  const surface = scene[4] as Surface3DObject;

  assert.deepEqual(
    scene.map((object) => object.type),
    ["graph-3d", "axis-3d", "axis-3d", "axis-3d", "surface-3d"]
  );
  assert.equal(graph.id, "typed-saddle-graph");
  assert.equal(graph.xAxisId, "typed-saddle-x-axis");
  assert.equal(graph.yAxisId, "typed-saddle-y-axis");
  assert.equal(graph.zAxisId, "typed-saddle-z-axis");
  assert.equal(surface.id, "typed-saddle-surface");
  assert.equal(surface.graphId, graph.id);
  assert.equal(surface.equation, "z = \\frac{x^2-y^2}{4}");
  assert.equal(expressionToLatex(surface.expression), "\\frac{x^{2} - y^{2}}{4}");
});
