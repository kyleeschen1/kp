import assert from "node:assert/strict";
import test from "node:test";
import { gradientContourBeats, gradientContourBrief, gradientContourCheckpoints, sampleGradientContour } from "../src/tutorial/gradient-contour/gradient-contour-sequence.ts";
import { createGradientContourModel, gradientDirectionComponents, gradientLocalHeight, gradientUnitDirection } from "../src/tutorial/gradient-contour/gradient-contour-model.ts";
import { createKpSurfaceContourStageAuthority, projectKpSurfaceContourPoint } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";

test("eight semantic stops and pure sampling preserve reverse and interrupted evidence", () => {
  assert.equal(gradientContourBeats.length, 8);
  for (const [index, progress] of gradientContourCheckpoints.entries()) {
    const expected = sampleGradientContour(progress);
    assert.equal(expected.position, index); assert.equal(expected.fraction, `${index + 1} / 8`);
    sampleGradientContour(.91); sampleGradientContour(.08);
    assert.deepEqual(sampleGradientContour(progress), expected);
  }
  assert.throws(() => sampleGradientContour(NaN), /finite/);
  assert.equal(sampleGradientContour(-1).position, 0); assert.equal(sampleGradientContour(2).position, 7);
});

test("curve travel stays level; decomposition preserves equal unit directions", () => {
  for (let index = 0; index <= 100; index++) {
    const state = sampleGradientContour(index / 100);
    assert.ok(Math.abs(state.height - 1.5) < 1e-12);
    assert.ok(Math.abs(Math.hypot(state.direction.x, state.direction.y) - 1) < 1e-12);
    assert.ok(Math.abs(state.slope) <= Math.sqrt(8) + 1e-12);
    assert.equal(state.stage.level, 1.5);
  }
  assert.equal(sampleGradientContour(3 / 7).slope, 0);
  assert.ok(Math.abs(sampleGradientContour(5 / 7).slope - 2) < 1e-12);
  assert.ok(Math.abs(sampleGradientContour(1).slope - Math.sqrt(8)) < 1e-12);
  assert.notDeepEqual(sampleGradientContour(1.5 / 7).point, sampleGradientContour(1 / 7).point);
});

test("local ramp has zero along-contour rise and the same differential as the surface", () => {
  const model = createGradientContourModel(), p = model.source.point;
  for (let i = 0; i < 50; i++) {
    const angle = i * Math.PI / 25, direction = gradientUnitDirection(Math.cos(angle), Math.sin(angle));
    const c = gradientDirectionComponents(model, direction); assert.equal(c.kind, "regular");
    if (c.kind !== "regular") throw new Error("regular primary");
    assert.ok(Math.abs(c.acrossVector.x + c.alongVector.x - direction.x) < 1e-12);
    assert.ok(Math.abs(c.acrossVector.y + c.alongVector.y - direction.y) < 1e-12);
    assert.ok(Math.abs(c.across ** 2 + c.along ** 2 - 1) < 1e-12);
    assert.ok(Math.abs(c.acrossRise + c.alongRise - c.totalRise) < 1e-12);
    const across = { x: p.x + c.acrossVector.x, y: p.y + c.acrossVector.y };
    const end = { x: p.x + direction.x, y: p.y + direction.y };
    assert.ok(Math.abs(gradientLocalHeight(model, across) - gradientLocalHeight(model, end)) < 1e-12);
    const h = .001, actual = model.height({ x: p.x + h * direction.x, y: p.y + h * direction.y });
    const local = gradientLocalHeight(model, { x: p.x + h * direction.x, y: p.y + h * direction.y });
    assert.ok(Math.abs(actual - local) <= 2.01 * h * h);
  }
  const stationary = createGradientContourModel({ ...model.source, point: { x: 0, y: 0 } });
  assert.deepEqual(gradientDirectionComponents(stationary, gradientUnitDirection(1, 0)), { kind: "stationary", totalRise: 0 });
  assert.throws(() => gradientLocalHeight(model, { x: NaN, y: 0 }), /finite/);
});

test("editorial evidence resolves to beats; ramp and components are distinct from the exact contour", () => {
  for (const slug of gradientContourBrief.evidenceBeats) assert.ok(gradientContourBeats.some(beat => beat.slug === slug));
  for (const value of Object.values(gradientContourBrief)) assert.ok(value.length > 0);
  assert.equal(sampleGradientContour(3 / 7).rampPresence, 0);
  assert.equal(sampleGradientContour(4 / 7).rampPresence, 1);
  assert.equal(sampleGradientContour(5 / 7).componentPresence, 1);
  assert.equal(sampleGradientContour(6 / 7).components.along, 0);
  assert.equal(sampleGradientContour(1).rampPresence, 0);
});

test("bounded overlay uses the canonical swept camera without nonfinite geometry", () => {
  const authority = createKpSurfaceContourStageAuthority();
  for (let index = 0; index <= 20; index++) {
    const state = sampleGradientContour(index / 20);
    const point = projectKpSurfaceContourPoint(authority, state.stage.viewProgress, { ...state.point, z: state.height * (1 - state.stage.viewProgress) });
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    assert.ok(point.x >= 0 && point.x <= 520 && point.y >= 0 && point.y <= 300);
  }
});
