import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { projectGraphPoints3DToWebGLScreen } from "../src/rendering/graph-webgl.ts";
import { createKpSurfaceContourStageAuthority } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { createPositiveQuadraticField } from "../src/tutorial/kinetic-figure-surface-contour/quadratic-field.ts";

test("batched projection samples one camera basis and never retains it across calls", () => {
  const graph = createKpSurfaceContourStageAuthority().graph3d;
  let reads = 0, azimuth = 12;
  const camera = { ...graph.camera, get azimuthDegrees() { reads++; return azimuth; } };
  const points = Array.from({ length: 100 }, (_, i) => ({ x: i / 10, y: i % 3, z: i % 7 }));
  const first = projectGraphPoints3DToWebGLScreen(graph, points, camera);
  assert.equal(reads, 1);
  azimuth = 38;
  const next = projectGraphPoints3DToWebGLScreen(graph, points, camera);
  assert.equal(reads, 2);
  assert.notDeepEqual(first, next);
  assert.deepEqual(projectGraphPoints3DToWebGLScreen(graph, [], camera), []);
});

test("three fitted authority plans exactly preserve the pre-optimization results", () => {
  // Captured by measure:camera-fit before camera batching, including the safe
  // rectangle, both endpoint cameras, sweep bounds and repair status.
  for (const [a, b, expected] of [
    [1, 2, "0d86d08b213a1b7c81efbab1911a9231ecf6864c7c9292ffaaadb16cb152c150"],
    [.25, 4, "65a40941e9ef56e4d66dee8a2994f9ff6b3f875929fb1305495ed19d161d8bca"],
    [4, .25, "fde5a540e7d77e31a42cd19db3312b8a94de38f4646c9db06c5e8bc46176031d"]
  ] as const) {
    const plan = createKpSurfaceContourStageAuthority(createPositiveQuadraticField(a, b)).fitPlan;
    assert.equal(createHash("sha256").update(JSON.stringify(plan)).digest("hex"), expected);
  }
});
