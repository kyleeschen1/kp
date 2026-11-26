import assert from "node:assert/strict";
import test from "node:test";
import { compileExpression, compileGradient } from "../src/math/expression.ts";
import { createSaddleSurfaceExpression } from "../src/math/surface-examples.ts";
import { projectGraphPoints3DToWebGLScreen } from "../src/rendering/graph-webgl.ts";
import { createGridGeometry, createPilotGraph, createPilotObjects, createPilotProjection, createSaddleGeometry, INITIAL_VIEW, validateView } from "../src/experiments/direct-webgl-graph/model.ts";
import { createSectionGeometry, INITIAL_SECTION, resolveSectionFrame, SECTION_ATTENTION, SECTION_IDS, SECTION_ROLE, SECTION_SCENE, sectionHeight, validateSection } from "../src/experiments/direct-webgl-graph/section.ts";
import { validateKpAnimationSaliencePlan } from "../src/animation/salience-plan.ts";

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

test("retained section vertices lie on both the canonical saddle and the plane for every sampled parameter", () => {
  const geometry = createSectionGeometry();
  for (const y of [-3, -2.37, -1, 0, 1.65, 3]) for (const denominator of [4, 4.25, 6.7, 8]) {
    const evaluate = compileExpression(createSaddleSurfaceExpression(denominator));
    const section = resolveSectionFrame({ y, inspection: 0 }, INITIAL_VIEW);
    let count = 0;
    for (let i = 0; i < geometry.length; i += 7) {
      if (geometry[i + 6] !== SECTION_ROLE.curve) continue;
      count += 1;
      for (const offset of [0, 3]) {
        const x = geometry[i + offset]!;
        const shaderHeight = (geometry[i + offset + 2]! + section.heightOffset) * 4 / denominator;
        assert.ok(Math.abs(shaderHeight - evaluate({ x, y })) < 1e-6);
        assert.ok(Math.abs(sectionHeight(x, y, denominator) - evaluate({ x, y })) < 1e-12);
      }
    }
    assert.equal(count, 96);
    assert.ok(Math.abs(sectionHeight(0, y, denominator) + y * y / denominator) < 1e-12);
  }
});

test("inspection is a reversible camera projection with exact x/z coordinates and unchanged source", () => {
  for (const azimuth of [-720, 0, 48, 270, 359, 850]) for (const elevation of [-75, 0, 28, 75]) {
    const view = { ...INITIAL_VIEW, example: "section" as const, azimuth, elevation };
    const saved = createPilotProjection(view, 800, 560);
    const source = createPilotObjects(view, 800, 560).find((object) => object.type === "surface-3d");
    for (const inspection of [0, .7, .2, 1, .45, 0]) {
      const frame = resolveSectionFrame({ ...INITIAL_SECTION, inspection }, view);
      assert.deepEqual(frame.entities.map((entity) => entity.id).sort(), Object.values(SECTION_IDS).sort());
      assert.equal(frame.entities.find((entity) => entity.id === SECTION_IDS.curve)!.present, true);
      assert.equal(frame.entities.find((entity) => entity.id === SECTION_IDS.surface)!.present,
        frame.surface.kind === "slab");
      const current = { ...view, section: { y: 1, inspection } };
      assert.deepEqual(createPilotObjects(current, 800, 560).find((object) => object.type === "surface-3d"), source);
      if (inspection === 0) {
        assert.equal(frame.camera, view);
        assert.deepEqual(createPilotProjection(current, 800, 560).matrix, saved.matrix);
      }
      if (inspection === 1) {
        assert.deepEqual(frame.camera, { azimuth: 90, elevation: 0 });
        const graph = createPilotGraph(current, 800, 560);
        const [origin, right, up, otherPlane] = projectGraphPoints3DToWebGLScreen(graph, [
          { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 1 }, { x: 0, y: -2, z: 0 }
        ]);
        assert.ok(right!.x > origin!.x && up!.y < origin!.y);
        assert.ok(Math.abs(origin!.x - otherPlane!.x) < 1e-10 && Math.abs(origin!.y - otherPlane!.y) < 1e-10);
        assert.ok(Math.abs((right!.x - origin!.x) - (origin!.y - up!.y)) < 1e-10);
      }
    }
  }
  assert.deepEqual(validateKpAnimationSaliencePlan(SECTION_ATTENTION, [SECTION_SCENE]), []);
});

test("clipping restricts both sides toward the section without losing it, including edge sections and reverse", () => {
  for (const y of [-3, -2.37, 0, 1.5, 3]) {
    const frames = Array.from({ length: 101 }, (_, index) =>
      resolveSectionFrame({ y, inspection: index / 100 }, INITIAL_VIEW));
    assert.deepEqual(frames[0]!.surface, { kind: "slab", lower: -3, upper: 3 });
    assert.deepEqual(frames.at(-1)!.surface, { kind: "absent" });
    let lower = -3, upper = 3, absent = false;
    for (const frame of frames) {
      if (frame.surface.kind === "absent") absent = true;
      else {
        assert.equal(absent, false, "a narrowing surface cannot reappear before reversal");
        assert.ok(frame.surface.lower >= lower && frame.surface.lower <= y);
        assert.ok(frame.surface.upper <= upper && frame.surface.upper >= y);
        lower = frame.surface.lower; upper = frame.surface.upper;
        if (y === -3) assert.equal(lower, -3);
        if (y === 3) assert.equal(upper, 3);
      }
      for (const entity of frame.entities) {
        if (entity.id !== SECTION_IDS.surface) assert.equal(entity.present, true);
      }
    }
    assert.ok(upper - lower < .2, "both boundaries approach the section before head-on removal");
    for (const index of [100, 66, 45, 0, 23, 80, 45, 100, 0]) {
      assert.deepEqual(resolveSectionFrame({ y, inspection: index / 100 }, INITIAL_VIEW), frames[index]);
    }
  }
  assert.deepEqual(resolveSectionFrame({ y: 1.5, inspection: .5 }, INITIAL_VIEW).surface,
    { kind: "slab", lower: -.75, upper: 2.25 });
});

test("a front-facing camera omits the entire saddle independently of inspection progress", () => {
  for (const azimuth of [90, 270, 450, -90, 810]) for (const elevation of [-1, -.5, 0, .5, 1]) {
    const frame = resolveSectionFrame({ y: 1.5, inspection: 0 }, { azimuth, elevation });
    assert.deepEqual(frame.surface, { kind: "absent" });
    assert.equal(frame.entities.find((entity) => entity.id === SECTION_IDS.surface)!.present, false);
    for (const id of [SECTION_IDS.curve, SECTION_IDS.basis, SECTION_IDS.plane]) {
      assert.equal(frame.entities.find((entity) => entity.id === id)!.present, true);
    }
  }
  for (const camera of [{ azimuth: 84, elevation: 0 }, { azimuth: 96, elevation: 0 },
    { azimuth: 90, elevation: 5 }, { azimuth: 90, elevation: -5 }]) {
    assert.deepEqual(resolveSectionFrame(INITIAL_SECTION, camera).surface, { kind: "slab", lower: -3, upper: 3 });
    assert.deepEqual(resolveSectionFrame({ y: 1, inspection: 1 }, camera).surface, { kind: "absent" });
  }
});

test("section boundaries reject invalid samples instead of producing undefined shader or camera state", () => {
  for (const y of [-3.1, 3.1, NaN, Infinity]) assert.throws(() => validateSection({ y, inspection: 0 }));
  for (const inspection of [-.1, 1.1, NaN, Infinity]) assert.throws(() => validateSection({ y: 0, inspection }));
  for (const x of [-4, 4, NaN, Infinity]) assert.throws(() => sectionHeight(x, 0, 4));
  for (const denominator of [0, 3.9, 8.1, NaN]) assert.throws(() => sectionHeight(0, 0, denominator));
  assert.throws(() => resolveSectionFrame(INITIAL_SECTION, { azimuth: 0, elevation: 90 }));
});
