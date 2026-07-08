import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGraph2DSceneModel,
  projectGraphPoint,
  sampleParabolaCurve
} from "../src/rendering/graph-2d-scene.ts";
import {
  createDefaultGraphScene,
  type Graph2DObject
} from "../src/semantic/graph.ts";

test("createGraph2DSceneModel retains axes, curves, projected geometry, and render ids", () => {
  const scene = createDefaultGraphScene();
  const graph = scene[0] as Graph2DObject;
  const model = createGraph2DSceneModel(scene, graph);
  const xAxis = model.axes.find((axis) => axis.axis.orientation === "x");
  const yAxis = model.axes.find((axis) => axis.axis.orientation === "y");
  const curve = model.curves[0];

  assert.equal(model.graph.id, "parabola-graph");
  assert.equal(model.axes.length, 2);
  assert.equal(model.curves.length, 1);
  assert.equal(xAxis?.renderNodeId, "rn-parabola-x-axis-svg-line");
  assert.equal(yAxis?.renderNodeId, "rn-parabola-y-axis-svg-line");
  assert.deepEqual(xAxis?.line, {
    from: { x: 0, y: 324 },
    to: { x: 520, y: 324 }
  });
  assert.deepEqual(yAxis?.line, {
    from: { x: 260, y: 360 },
    to: { x: 260, y: 0 }
  });
  assert.equal(curve?.renderNodeId, "rn-curve-y-equals-x-squared-svg-path");
  assert.equal(curve?.graphPoints.length, 121);
  assert.equal(curve?.projectedPoints.length, 121);
  assert.deepEqual(curve?.projectedPoints[0], { x: 0, y: 0 });
  assert.deepEqual(curve?.projectedPoints.at(-1), { x: 520, y: 0 });
});

test("2D scene helpers sample and project curve points", () => {
  const scene = createDefaultGraphScene();
  const graph = scene[0] as Graph2DObject;
  const curve = createGraph2DSceneModel(scene, graph).curves[0]?.curve;

  if (curve === undefined) {
    throw new Error("Expected default 2D curve.");
  }

  assert.deepEqual(sampleParabolaCurve({ ...curve, xDomain: [-1, 1], sampleCount: 3 }), [
    { x: -1, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);
  assert.deepEqual(projectGraphPoint(graph, { x: 0, y: 0 }), {
    x: 260,
    y: 324
  });
});
