import { strict as assert } from "node:assert";
import test from "node:test";

import { expressionToLatex } from "../src/math/expression.ts";
import {
  createGraphSceneFromLatexEquation
} from "../src/semantic/equation-graph.ts";
import type {
  Curve2DObject,
  Graph2DObject,
  Graph3DObject,
  Surface3DObject
} from "../src/semantic/graph.ts";

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
  assert.equal(expressionToLatex(curve.expression), "x^{2}");
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
