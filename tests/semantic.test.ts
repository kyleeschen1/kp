import { strict as assert } from "node:assert";
import test from "node:test";

import { expressionToLatex } from "../src/math/expression.ts";
import { createKpDocument } from "../src/semantic/document.ts";
import type { KpDocument } from "../src/semantic/document.ts";
import {
  createAxis2DObject,
  createAxis3DObject,
  createDefaultGraphScene,
  createDefaultGraph3DScene,
  createGraph2DObject,
  createGraph3DObject,
  createParabolaCurve2D,
  createSaddleSurface3D,
  createTimeSpiralCurve3D
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
  const { expression, ...curveMetadata } = curve;

  assert.deepEqual(curveMetadata, {
    id: "curve-y-equals-x-squared",
    type: "curve-2d",
    graphId: "parabola-graph",
    label: "x^2 = y",
    equation: "y = x^2",
    xDomain: [-3, 3],
    sampleCount: 121
  });
  assert.equal(expressionToLatex(expression), "x^{2}");
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

test("createGraph3DObject creates a semantic graph object with a third axis", () => {
  const graph = createGraph3DObject({
    id: "saddle-orbit-graph",
    label: "Saddle surface and time spiral",
    xAxisId: "saddle-orbit-x-axis",
    yAxisId: "saddle-orbit-y-axis",
    zAxisId: "saddle-orbit-z-axis",
    xDomain: [-3, 3],
    yDomain: [-3, 3],
    zDomain: [-2.5, 2.5],
    width: 560,
    height: 420,
    occludedAxisLightness: 44,
    camera: {
      azimuthDegrees: 35,
      elevationDegrees: 30,
      scale: 58,
      origin: [280, 244]
    }
  });

  assert.deepEqual(graph, {
    id: "saddle-orbit-graph",
    type: "graph-3d",
    label: "Saddle surface and time spiral",
    xAxisId: "saddle-orbit-x-axis",
    yAxisId: "saddle-orbit-y-axis",
    zAxisId: "saddle-orbit-z-axis",
    xDomain: [-3, 3],
    yDomain: [-3, 3],
    zDomain: [-2.5, 2.5],
    width: 560,
    height: 420,
    occludedAxisLightness: 44,
    debug: {
      depthOverlay: false,
      surfaceMesh: false
    },
    camera: {
      azimuthDegrees: 35,
      elevationDegrees: 30,
      scale: 58,
      origin: [280, 244]
    }
  });
});

test("createGraph3DObject preserves explicit graph debug settings", () => {
  const graph = createGraph3DObject({
    id: "debug-graph",
    label: "Debug graph",
    xAxisId: "debug-x-axis",
    yAxisId: "debug-y-axis",
    zAxisId: "debug-z-axis",
    xDomain: [-1, 1],
    yDomain: [-1, 1],
    zDomain: [-1, 1],
    width: 300,
    height: 220,
    debug: {
      depthOverlay: true,
      surfaceMesh: true
    },
    camera: {
      azimuthDegrees: 35,
      elevationDegrees: 30,
      scale: 30,
      origin: [150, 110]
    }
  });

  assert.deepEqual(graph.debug, {
    depthOverlay: true,
    surfaceMesh: true
  });
});

test("createAxis3DObject creates semantic axis objects", () => {
  const axis = createAxis3DObject({
    id: "saddle-orbit-z-axis",
    graphId: "saddle-orbit-graph",
    label: "z",
    orientation: "z",
    domain: [-2.5, 2.5],
    tickStep: 1
  });

  assert.deepEqual(axis, {
    id: "saddle-orbit-z-axis",
    type: "axis-3d",
    graphId: "saddle-orbit-graph",
    label: "z",
    orientation: "z",
    domain: [-2.5, 2.5],
    tickStep: 1
  });
});

test("createSaddleSurface3D creates the z = (x^2 - y^2) / 4 surface", () => {
  const surface = createSaddleSurface3D({
    id: "saddle-surface",
    graphId: "saddle-orbit-graph",
    xDomain: [-3, 3],
    yDomain: [-3, 3],
    xSampleCount: 13,
    ySampleCount: 13
  });
  const { expression, ...surfaceMetadata } = surface;

  assert.deepEqual(surfaceMetadata, {
    id: "saddle-surface",
    type: "surface-3d",
    graphId: "saddle-orbit-graph",
    label: "z = (x^2 - y^2) / 4",
    equation: "z = (x^2 - y^2) / 4",
    xDomain: [-3, 3],
    yDomain: [-3, 3],
    xSampleCount: 13,
    ySampleCount: 13
  });
  assert.equal(expressionToLatex(expression), "\\frac{x^{2} - y^{2}}{4}");
});

test("createTimeSpiralCurve3D creates a time-visible spiral curve", () => {
  const curve = createTimeSpiralCurve3D({
    id: "time-spiral-curve",
    graphId: "saddle-orbit-graph",
    tDomain: [0, Math.PI * 4],
    sampleCount: 145
  });
  const { expressions, ...curveMetadata } = curve;

  assert.deepEqual(curveMetadata, {
    id: "time-spiral-curve",
    type: "curve-3d",
    graphId: "saddle-orbit-graph",
    label: "time spiral",
    equation: {
      x: "2.2 cos(t)",
      y: "1.3 sin(t)",
      z: "0.18 (t - 2 pi)"
    },
    tDomain: [0, Math.PI * 4],
    sampleCount: 145
  });
  assert.equal(expressionToLatex(expressions.x), "2.2 \\cos\\left(t\\right)");
  assert.equal(expressionToLatex(expressions.y), "1.3 \\sin\\left(t\\right)");
  assert.equal(
    expressionToLatex(expressions.z),
    "0.18 \\left(t - 6.283185\\right)"
  );
});

test("createDefaultGraph3DScene creates graph, axes, and surface objects", () => {
  const scene = createDefaultGraph3DScene();

  assert.deepEqual(
    scene.map((object) => object.type),
    ["graph-3d", "axis-3d", "axis-3d", "axis-3d", "surface-3d"]
  );
  assert.equal(scene[0]?.id, "saddle-orbit-graph");
  assert.equal(scene[4]?.id, "saddle-surface");
  assert.equal(
    scene[0]?.type === "graph-3d"
      ? scene[0].occludedAxisLightness
      : undefined,
    44
  );
  assert.deepEqual(
    scene[0]?.type === "graph-3d" ? scene[0].debug : undefined,
    {
      depthOverlay: false,
      surfaceMesh: false
    }
  );
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

test("validateKpDocument reports 3D graph reference issues", () => {
  const document = createKpDocument({
    id: "bad-graph-3d-document",
    title: "Bad 3D graph",
    objects: [
      createGraph3DObject({
        id: "bad-graph-3d",
        label: "Bad 3D graph",
        xAxisId: "missing-x-axis",
        yAxisId: "missing-y-axis",
        zAxisId: "missing-z-axis",
        xDomain: [-3, 3],
        yDomain: [3, -3],
        zDomain: [-2.5, 2.5],
        width: 560,
        height: 420,
        camera: {
          azimuthDegrees: 35,
          elevationDegrees: 30,
          scale: 58,
          origin: [280, 244]
        }
      }),
      createTimeSpiralCurve3D({
        id: "orphan-curve-3d",
        graphId: "missing-graph",
        tDomain: [0, Math.PI * 2],
        sampleCount: 145
      }),
      createSaddleSurface3D({
        id: "bad-surface-3d",
        graphId: "missing-graph",
        xDomain: [-3, 3],
        yDomain: [-3, 3],
        xSampleCount: 1,
        ySampleCount: 13
      })
    ]
  });

  assert.deepEqual(validateKpDocument(document), [
    {
      path: "objects[0].yDomain",
      message: "Graph bad-graph-3d yDomain must increase from min to max."
    },
    {
      path: "objects[0].xAxisId",
      message: "Graph bad-graph-3d references missing x-axis missing-x-axis."
    },
    {
      path: "objects[0].yAxisId",
      message: "Graph bad-graph-3d references missing y-axis missing-y-axis."
    },
    {
      path: "objects[0].zAxisId",
      message: "Graph bad-graph-3d references missing z-axis missing-z-axis."
    },
    {
      path: "objects[1].graphId",
      message: "Curve orphan-curve-3d references missing graph missing-graph."
    },
    {
      path: "objects[2].graphId",
      message: "Surface bad-surface-3d references missing graph missing-graph."
    },
    {
      path: "objects[2].xSampleCount",
      message: "Surface bad-surface-3d xSampleCount must be an integer of at least 2."
    }
  ]);
});
