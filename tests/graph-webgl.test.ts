import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createGraph3DWebGLSceneModel,
  createGraph3DWebGLRendererDescriptor,
  GRAPH_3D_WEBGL_RENDERER_KIND
} from "../src/rendering/graph-webgl.ts";
import {
  createGraph3DWebGLCamera,
  createGraph3DWebGLThreeScene
} from "../src/rendering/graph-webgl-three.ts";
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

test("WebGL shell renderer does not import Three.js directly", () => {
  const source = readFileSync(
    new URL("../src/rendering/graph-webgl.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from "three"/);
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

test("WebGL scene model mirrors generated donut and hyperplane surface modes", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const donutGraph: Graph3DObject = {
    ...graph,
    surfaceMode: "donut"
  };
  const hyperplaneGraph: Graph3DObject = {
    ...graph,
    surfaceMode: "hyperplanes"
  };
  const donutModel = createGraph3DWebGLSceneModel(scene, donutGraph);
  const hyperplaneModel = createGraph3DWebGLSceneModel(scene, hyperplaneGraph);
  const donutSurface = donutModel.surfaces[0];
  const hyperplaneScene = createGraph3DWebGLThreeScene(hyperplaneModel);

  assert.equal(donutModel.surfaceMode, "donut");
  assert.equal(donutModel.surfaces.length, 1);
  assert.equal(donutSurface?.id, "saddle-orbit-graph-donut");
  assert.equal(donutSurface?.grid.length, 13);
  assert.equal(donutSurface?.grid[0]?.length, 25);
  assert.equal(donutSurface?.quads.length, 288);

  assert.equal(hyperplaneModel.surfaceMode, "hyperplanes");
  assert.equal(hyperplaneModel.surfaces.length, 2);
  assert.deepEqual(
    hyperplaneModel.surfaces.map((surface) => surface.id),
    [
      "saddle-orbit-graph-hyperplane-positive",
      "saddle-orbit-graph-hyperplane-negative"
    ]
  );
  assert.equal(hyperplaneModel.surfaces[0]?.grid.length, 13);
  assert.equal(hyperplaneModel.surfaces[0]?.grid[0]?.length, 13);
  assert.equal(hyperplaneModel.surfaces[0]?.quads.length, 144);
  assert.equal(hyperplaneScene.surfaceMeshes.length, 2);
  assert.equal(hyperplaneScene.surfaceMeshLines.length, 2);
  assert.equal(hyperplaneScene.root.children.length, 7);
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

test("WebGL camera derives an orthographic view from graph dimensions and camera settings", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const camera = createGraph3DWebGLCamera(graph);

  assert.equal(camera.type, "OrthographicCamera");
  assert.equal(camera.left, -graph.width / (2 * graph.camera.scale));
  assert.equal(camera.right, graph.width / (2 * graph.camera.scale));
  assert.equal(camera.top, graph.height / (2 * graph.camera.scale));
  assert.equal(camera.bottom, -graph.height / (2 * graph.camera.scale));
  assert.ok(camera.position.length() > 0);
});
