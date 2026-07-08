import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGraph3DWebGLSceneModel,
  createGraph3DWebGLThreeScene,
  createGraph3DWebGLRendererDescriptor,
  GRAPH_3D_WEBGL_RENDERER_KIND
} from "../src/rendering/graph-webgl.ts";
import {
  createDefaultGraph3DScene,
  type Graph3DObject
} from "../src/semantic/graph.ts";

test("Three.js is available for the WebGL graph renderer", async () => {
  const three = await import("three");

  assert.equal(typeof three.Scene, "function");
  assert.equal(typeof three.WebGLRenderer, "function");
  assert.equal(typeof three.PerspectiveCamera, "function");
});

test("WebGL graph renderer exposes a stable renderer descriptor", () => {
  const descriptor = createGraph3DWebGLRendererDescriptor();

  assert.equal(GRAPH_3D_WEBGL_RENDERER_KIND, "graph-3d-webgl");
  assert.deepEqual(descriptor, {
    backend: "three",
    kind: "graph-3d-webgl",
    status: "available"
  });
});

test("WebGL scene model retains default graph axes and surface topology", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const model = createGraph3DWebGLSceneModel(scene, graph);
  const surface = model.surfaces[0];
  const firstQuad = surface?.quads[0];

  assert.equal(model.graph.id, "saddle-orbit-graph");
  assert.equal(model.camera.azimuthDegrees, 35);
  assert.equal(model.axes.length, 3);
  assert.deepEqual(
    model.axes.map((axis) => axis.orientation),
    ["x", "y", "z"]
  );
  assert.equal(model.surfaces.length, 1);
  assert.equal(surface?.id, "saddle-surface");
  assert.equal(surface?.grid.length, 13);
  assert.equal(surface?.grid[0]?.length, 13);
  assert.equal(surface?.quads.length, 144);
  assert.equal(firstQuad?.corners.length, 4);
  assert.deepEqual(firstQuad?.gridCell, {
    columnIndex: 0,
    rowIndex: 0
  });
});

test("WebGL Three scene builds retained geometry for surfaces, mesh lines, and axes", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const model = createGraph3DWebGLSceneModel(scene, graph);
  const threeScene = createGraph3DWebGLThreeScene(model);
  const surfaceMesh = threeScene.surfaceMeshes[0];
  const meshLines = threeScene.surfaceMeshLines[0];
  const surfacePositions = surfaceMesh?.geometry.getAttribute("position");
  const meshLinePositions = meshLines?.geometry.getAttribute("position");

  assert.equal(threeScene.scene.children.length, 1);
  assert.equal(threeScene.root.children.length, 5);
  assert.equal(threeScene.root.userData["kpObject"], "saddle-orbit-graph");
  assert.equal(threeScene.surfaceMeshes.length, 1);
  assert.equal(surfaceMesh?.userData["kpObject"], "saddle-surface");
  assert.equal(surfacePositions?.count, 576);
  assert.equal(surfaceMesh?.geometry.index?.count, 864);
  assert.equal(threeScene.surfaceMeshLines.length, 1);
  assert.equal(meshLinePositions?.count, 624);
  assert.equal(threeScene.axisLines.length, 3);
  assert.deepEqual(
    threeScene.axisLines.map((axisLine) => axisLine.userData["kpAxis"]),
    ["x", "y", "z"]
  );
  assert.equal(
    threeScene.axisLines[0]?.geometry.getAttribute("position").count,
    2
  );
});
