import { strict as assert } from "node:assert";
import test from "node:test";

test("Three.js is available for the WebGL graph renderer", async () => {
  const three = await import("three");

  assert.equal(typeof three.Scene, "function");
  assert.equal(typeof three.WebGLRenderer, "function");
  assert.equal(typeof three.PerspectiveCamera, "function");
});
