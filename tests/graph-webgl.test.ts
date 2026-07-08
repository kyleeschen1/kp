import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGraph3DWebGLRendererDescriptor,
  GRAPH_3D_WEBGL_RENDERER_KIND
} from "../src/rendering/graph-webgl.ts";

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
