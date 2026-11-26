import assert from "node:assert/strict";
import test from "node:test";
import { compileExpression, compileGradient } from "../src/math/expression.ts";
import { createSaddleSurfaceExpression } from "../src/math/surface-examples.ts";
import { projectGraphPoints3DToWebGLScreen } from "../src/rendering/graph-webgl.ts";
import { createGridGeometry, createPilotGraph, createPilotObjects, createPilotProjection, createSaddleGeometry, INITIAL_VIEW, validateView } from "../src/experiments/direct-webgl-graph/model.ts";

test("retained heights and gradients agree with the canonical saddle throughout the parameter range", () => {
  const geometry = createSaddleGeometry(17);
  for (const denominator of [4, 4.7, 6, 7.35, 8]) {
    const expression = createSaddleSurfaceExpression(denominator);
    const evaluate = compileExpression(expression), gradients = compileGradient(expression, ["x", "y"]);
    for (let offset = 0; offset < geometry.vertices.length; offset += 5) {
      const [x, y, z, dx, dy] = geometry.vertices.slice(offset, offset + 5);
      const scope = { x: x!, y: y! }, scale = 4 / denominator;
      assert.ok(Math.abs(z! * scale - evaluate(scope)) < 1e-6);
      assert.ok(Math.abs(dx! * scale - gradients[0]!(scope)) < 1e-6);
      assert.ok(Math.abs(dy! * scale - gradients[1]!(scope)) < 1e-6);
      const length = Math.hypot(dx! * scale, dy! * scale, 1);
      assert.ok(Number.isFinite(length) && length >= 1);
    }
  }
});

test("the shared-vertex mesh has consistent winding, bounded indices and no degenerate triangles", () => {
  const { vertices, indices, vertexCount } = createSaddleGeometry();
  assert.equal(vertexCount, 97 * 97);
  assert.equal(indices.length / 3, 96 * 96 * 2);
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]!, b = indices[index + 1]!, c = indices[index + 2]!;
    assert.ok(a < vertexCount && b < vertexCount && c < vertexCount);
    const cross = (vertices[b * 5]! - vertices[a * 5]!) * (vertices[c * 5 + 1]! - vertices[a * 5 + 1]!) -
      (vertices[b * 5 + 1]! - vertices[a * 5 + 1]!) * (vertices[c * 5]! - vertices[a * 5]!);
    assert.ok(cross > 0);
  }
});

test("GPU matrix and existing projection agree across rotations and responsive viewports", () => {
  const points = [{ x: -3, y: 3, z: 0 }, { x: 2, y: 0, z: 1 }, { x: -1, y: 2, z: -.75 }];
  for (const [width, height] of [[390, 320], [1024, 560], [450, 700]]) {
    for (const azimuth of [0, 48, 135, 270, 359]) for (const elevation of [-75, 0, 28, 75]) {
      const view = { ...INITIAL_VIEW, azimuth, elevation };
      const { graph, matrix, eye } = createPilotProjection(view, width!, height!);
      assert.ok(Math.abs(Math.hypot(...eye) - 1) < 1e-6);
      const native = projectGraphPoints3DToWebGLScreen(graph, points);
      points.forEach((point, index) => {
        const x = matrix[0]! * point.x + matrix[4]! * point.y + matrix[8]! * point.z + matrix[12]!;
        const y = matrix[1]! * point.x + matrix[5]! * point.y + matrix[9]! * point.z + matrix[13]!;
        const depth = matrix[2]! * point.x + matrix[6]! * point.y + matrix[10]! * point.z + matrix[14]!;
        assert.ok(Math.abs((x + 1) * width! / 2 - native[index]!.x) < 1e-4);
        assert.ok(Math.abs((1 - y) * height! / 2 - native[index]!.y) < 1e-4);
        assert.ok(Math.abs(-depth * 40 - native[index]!.depth) < 1e-5);
      });
    }
  }
});

test("reference objects use the same domain source and retain identities across samples", () => {
  const a = createPilotObjects(INITIAL_VIEW, 800, 560);
  const b = createPilotObjects({ ...INITIAL_VIEW, denominator: 8 }, 800, 560);
  assert.deepEqual(a.map((object) => object.id), b.map((object) => object.id));
  const surface = b.find((object) => object.type === "surface-3d");
  assert.equal(surface?.parameterization?.denominator, 8);
  assert.equal(createPilotObjects({ ...INITIAL_VIEW, example: "grid" }, 800, 560).length, 4);
});

test("coordinate planes do not double-paint axes or duplicate grid segments", () => {
  const grid = createGridGeometry();
  const lines: string[] = [];
  for (let i = 0; i < grid.length; i += 7) lines.push([...grid.slice(i, i + 6)].join(","));
  assert.equal(lines.length, new Set(lines).size);
  assert.equal(grid.length / 7, 39);
});

test("invalid geometry, view and viewport inputs fail at the experiment boundary", () => {
  for (const samples of [0, 2, 3.5, 130, NaN, Infinity]) assert.throws(() => createSaddleGeometry(samples));
  for (const denominator of [0, 3, 9, NaN, Infinity]) assert.throws(() => validateView({ ...INITIAL_VIEW, denominator }));
  assert.throws(() => validateView({ ...INITIAL_VIEW, elevation: 90 }));
  assert.throws(() => validateView({ ...INITIAL_VIEW, azimuth: NaN }));
  for (const width of [0, -1, Infinity, NaN, 8193]) assert.throws(() => createPilotGraph(INITIAL_VIEW, width, 400));
});
