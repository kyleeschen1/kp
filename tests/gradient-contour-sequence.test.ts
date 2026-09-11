import assert from "node:assert/strict";
import test from "node:test";
import { gradientContourBeats, gradientContourCheckpoints, sampleGradientContour } from "../src/tutorial/gradient-contour/gradient-contour-sequence.ts";
import { createKpSurfaceContourStageAuthority, projectKpSurfaceContourPoint } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";

test("six semantic stops and pure sampling preserve reverse and interrupted evidence", () => {
  assert.equal(gradientContourBeats.length, 6);
  for (const [index, progress] of gradientContourCheckpoints.entries()) {
    const expected = sampleGradientContour(progress);
    assert.equal(expected.position, index); assert.equal(expected.fraction, `${index + 1} / 6`);
    sampleGradientContour(.91); sampleGradientContour(.08);
    assert.deepEqual(sampleGradientContour(progress), expected);
  }
  assert.throws(() => sampleGradientContour(NaN), /finite/);
  assert.equal(sampleGradientContour(-1).position, 0); assert.equal(sampleGradientContour(2).position, 5);
});

test("curve travel stays level; tangent, downhill and uphill compare unit directions", () => {
  for (let index = 0; index <= 100; index++) {
    const state = sampleGradientContour(index / 100);
    assert.ok(Math.abs(state.height - 1.5) < 1e-12);
    assert.ok(Math.abs(Math.hypot(state.direction.x, state.direction.y) - 1) < 1e-12);
    assert.ok(Math.abs(state.slope) <= Math.sqrt(8) + 1e-12);
    assert.equal(state.stage.level, 1.5);
  }
  assert.equal(sampleGradientContour(.6).slope, 0);
  assert.ok(Math.abs(sampleGradientContour(.8).slope + Math.sqrt(8)) < 1e-12);
  assert.ok(Math.abs(sampleGradientContour(1).slope - Math.sqrt(8)) < 1e-12);
  assert.notDeepEqual(sampleGradientContour(.3).point, sampleGradientContour(.2).point);
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
