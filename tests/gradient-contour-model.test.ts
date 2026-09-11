import assert from "node:assert/strict";
import test from "node:test";
import { checkGradientContourSource, createGradientContourModel, gradientContourPoint, gradientContourPrimary, gradientStraightStep, gradientUnitDirection } from "../src/tutorial/gradient-contour/gradient-contour-model.ts";

test("one bounded expression owns height and nonradial greatest first-order increase", () => {
  const model = createGradientContourModel();
  assert.equal(model.level, 1.5);
  assert.deepEqual(model.atPoint.gradient, { x: 2, y: 2 });
  assert.equal(model.atPoint.kind, "regular");
  if (model.atPoint.kind !== "regular") return;
  assert.ok(model.derivative(gradientUnitDirection(1, .5)) < model.atPoint.magnitude);
  assert.ok(Math.abs(model.derivative(model.atPoint.tangent)) < 1e-12);
  for (let i = 0; i < 100; i++) {
    const angle = i / 100 * Math.PI * 2;
    assert.ok(model.derivative(gradientUnitDirection(Math.cos(angle), Math.sin(angle))) <= model.atPoint.magnitude + 1e-12);
    assert.ok(Math.abs(model.height(gradientContourPoint(model, angle)) - model.level) < 1e-12);
  }
});
test("a straight tangent is flat to first order, not constant over a finite step", () => {
  const model = createGradientContourModel();
  if (model.atPoint.kind !== "regular") throw new Error("regular primary");
  const step = gradientStraightStep(model, model.atPoint.tangent, .4);
  assert.equal(step.firstOrderChange, 0);
  assert.ok(step.actualChange > 0);
  const half = gradientStraightStep(model, model.atPoint.tangent, .2);
  assert.ok(Math.abs(step.actualChange - 4 * half.actualChange) < 1e-12);
  // @ts-expect-error raw vectors cannot enter a unit-direction comparison
  assert.throws(() => model.derivative({ x: 2, y: 2 }), /normalized/);
});
test("zero gradient has no fabricated unique uphill or tangent direction", () => {
  const model = createGradientContourModel({ ...gradientContourPrimary, point: { x: 0, y: 0 } });
  assert.equal(model.atPoint.kind, "stationary");
  assert.equal("uphill" in model.atPoint, false);
  assert.equal(model.derivative(gradientUnitDirection(1, 0)), 0);
  assert.throws(() => gradientUnitDirection(0, 0));
  assert.throws(() => gradientUnitDirection(Infinity, 1));
});
test("untrusted quadratic inputs fail with located repairs and preserve copied source", () => {
  for (const [patch, path] of [[{ a: 0 }, "$.a"], [{ b: Infinity }, "$.b"], [{ point: { x: NaN, y: 1 } }, "$.point.x"], [{ point: { x: 1, y: 2 } }, "$.point.y"], [{ arbitraryField: "sin(x)" }, "$"]] as const) {
    const result = checkGradientContourSource({ ...gradientContourPrimary, ...patch });
    assert.equal(result.status, "repair");
    if (result.status === "repair") assert.equal(result.path, path);
  }
  const source = { ...gradientContourPrimary, point: { x: 1, y: .5 } };
  const model = createGradientContourModel(source);
  source.point.x = 0;
  assert.equal(model.source.point.x, 1);
  assert.equal(model.height(model.source.point), model.level);
});
