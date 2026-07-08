import { strict as assert } from "node:assert";
import test from "node:test";

import {
  graphCameraDirection,
  projectGraphLine3D,
  projectGraphPoint3D
} from "../src/rendering/projection.ts";
import {
  DEFAULT_GRAPH_3D_LIGHT_SETTINGS,
  type Graph3DObject
} from "../src/semantic/graph.ts";

const graph: Graph3DObject = {
  id: "projection-test-graph",
  type: "graph-3d",
  label: "projection test graph",
  xAxisId: "x-axis",
  yAxisId: "y-axis",
  zAxisId: "z-axis",
  xDomain: [-1, 1],
  yDomain: [-1, 1],
  zDomain: [-1, 1],
  width: 200,
  height: 160,
  occludedAxisLightness: 44,
  debug: {
    depthOverlay: false,
    surfaceMesh: false
  },
  light: DEFAULT_GRAPH_3D_LIGHT_SETTINGS,
  camera: {
    azimuthDegrees: 0,
    elevationDegrees: 0,
    scale: 10,
    origin: [100, 100]
  }
};

test("projectGraphPoint3D maps graph coordinates into screen coordinates with depth", () => {
  assert.deepEqual(projectGraphPoint3D(graph, { x: 1, y: 2, z: 3 }), {
    x: 110,
    y: 70,
    depth: 2
  });
});

test("projectGraphLine3D returns projected endpoints and average depth", () => {
  assert.deepEqual(
    projectGraphLine3D(graph, {
      from: { x: 0, y: 0, z: 0 },
      to: { x: 0, y: 4, z: 0 }
    }),
    {
      from: { x: 100, y: 100, depth: 0 },
      to: { x: 100, y: 100, depth: 4 },
      averageDepth: 2
    }
  );
});

test("graphCameraDirection returns a normalized graph-space view direction", () => {
  assert.deepEqual(graphCameraDirection(graph), {
    x: 0,
    y: 1,
    z: 0
  });
});
