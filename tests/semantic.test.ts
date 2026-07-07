import { strict as assert } from "node:assert";
import test from "node:test";

import { createKpDocument } from "../src/semantic/document.ts";
import type { KpDocument } from "../src/semantic/document.ts";
import {
  createAxis2DObject,
  createDefaultGraphScene,
  createGraph2DObject,
  createParabolaCurve2D
} from "../src/semantic/graph.ts";
import { createMatrixObject, identityMatrix } from "../src/semantic/matrix.ts";
import { validateKpDocument } from "../src/semantic/validation.ts";

test("createKpDocument creates a JSON-compatible semantic document", () => {
  const document = createKpDocument({
    id: "lesson-identity",
    title: "Identity matrix"
  });

  assert.deepEqual(document, {
    id: "lesson-identity",
    title: "Identity matrix",
    version: 1,
    objects: []
  });
  assert.equal(JSON.parse(JSON.stringify(document)).id, "lesson-identity");
});

test("createMatrixObject creates a semantic matrix object", () => {
  const matrix = createMatrixObject({
    id: "A",
    label: "A",
    rows: [
      [1, 2],
      [3, 4]
    ]
  });

  assert.deepEqual(matrix, {
    id: "A",
    type: "matrix",
    label: "A",
    rows: [
      [1, 2],
      [3, 4]
    ]
  });
});

test("identityMatrix creates a square identity matrix object", () => {
  const matrix = identityMatrix({
    id: "identity-3x3",
    label: "I_3",
    size: 3
  });

  assert.deepEqual(matrix, {
    id: "identity-3x3",
    type: "matrix",
    label: "I_3",
    rows: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  });
});

test("createMatrixObject rejects ragged matrices", () => {
  assert.throws(
    () =>
      createMatrixObject({
        id: "bad",
        label: "B",
        rows: [[1], [2, 3]]
      }),
    /Matrix bad must be rectangular/
  );
});

test("identityMatrix rejects non-positive sizes", () => {
  assert.throws(
    () =>
      identityMatrix({
        id: "bad-identity",
        label: "I_0",
        size: 0
      }),
    /Identity matrix bad-identity size must be a positive integer/
  );
});

test("validateKpDocument reports matrix shape issues", () => {
  const document = {
    id: "bad-document",
    title: "Bad document",
    version: 1,
    objects: [
      {
        id: "bad",
        type: "matrix",
        label: "B",
        rows: [[1], [2, 3]]
      }
    ]
  } as unknown as KpDocument;

  assert.deepEqual(validateKpDocument(document), [
    {
      path: "objects[0].rows",
      message: "Matrix bad must be rectangular."
    }
  ]);
});

test("createGraph2DObject creates a semantic graph object", () => {
  const graph = createGraph2DObject({
    id: "parabola-graph",
    label: "Parabola graph",
    xAxisId: "parabola-x-axis",
    yAxisId: "parabola-y-axis",
    xDomain: [-3, 3],
    yDomain: [-1, 9],
    width: 520,
    height: 360
  });

  assert.deepEqual(graph, {
    id: "parabola-graph",
    type: "graph-2d",
    label: "Parabola graph",
    xAxisId: "parabola-x-axis",
    yAxisId: "parabola-y-axis",
    xDomain: [-3, 3],
    yDomain: [-1, 9],
    width: 520,
    height: 360
  });
});

test("createAxis2DObject creates semantic axis objects", () => {
  const axis = createAxis2DObject({
    id: "parabola-x-axis",
    graphId: "parabola-graph",
    label: "x",
    orientation: "x",
    domain: [-3, 3],
    tickStep: 1
  });

  assert.deepEqual(axis, {
    id: "parabola-x-axis",
    type: "axis-2d",
    graphId: "parabola-graph",
    label: "x",
    orientation: "x",
    domain: [-3, 3],
    tickStep: 1
  });
});

test("createParabolaCurve2D creates the x^2 = y curve object", () => {
  const curve = createParabolaCurve2D({
    id: "curve-y-equals-x-squared",
    graphId: "parabola-graph",
    xDomain: [-3, 3],
    sampleCount: 121
  });

  assert.deepEqual(curve, {
    id: "curve-y-equals-x-squared",
    type: "curve-2d",
    graphId: "parabola-graph",
    label: "x^2 = y",
    equation: "y = x^2",
    xDomain: [-3, 3],
    sampleCount: 121
  });
});

test("createDefaultGraphScene creates graph, axes, and curve objects", () => {
  const scene = createDefaultGraphScene();

  assert.deepEqual(
    scene.map((object) => object.type),
    ["graph-2d", "axis-2d", "axis-2d", "curve-2d"]
  );
  assert.equal(scene[0]?.id, "parabola-graph");
  assert.equal(scene[3]?.id, "curve-y-equals-x-squared");
});

test("validateKpDocument reports graph reference issues", () => {
  const document = createKpDocument({
    id: "bad-graph-document",
    title: "Bad graph",
    objects: [
      createGraph2DObject({
        id: "bad-graph",
        label: "Bad graph",
        xAxisId: "missing-x-axis",
        yAxisId: "missing-y-axis",
        xDomain: [3, -3],
        yDomain: [-1, 9],
        width: 520,
        height: 360
      }),
      createParabolaCurve2D({
        id: "orphan-curve",
        graphId: "missing-graph",
        xDomain: [-3, 3],
        sampleCount: 121
      })
    ]
  });

  assert.deepEqual(validateKpDocument(document), [
    {
      path: "objects[0].xDomain",
      message: "Graph bad-graph xDomain must increase from min to max."
    },
    {
      path: "objects[0].xAxisId",
      message: "Graph bad-graph references missing x-axis missing-x-axis."
    },
    {
      path: "objects[0].yAxisId",
      message: "Graph bad-graph references missing y-axis missing-y-axis."
    },
    {
      path: "objects[1].graphId",
      message: "Curve orphan-curve references missing graph missing-graph."
    }
  ]);
});
