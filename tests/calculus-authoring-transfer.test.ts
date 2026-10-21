import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileChangeSource, projectChange } from "../src/tutorial/change-propagation/model.ts";

const source = (name: string) => readFileSync(`content/authoring/transfer/${name}.json`, "utf8");
function checked(name: string) {
  const result = compileChangeSource(source(name));
  assert.equal(result.status, "checked");
  if (result.status !== "checked") throw new Error(`${result.path}: ${result.message}`);
  return result.model;
}
function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`);
}

test("stationary source separates zero first-order change from finite curvature", () => {
  const model = checked("stationary-change");
  assert.equal(model.source.x, 0);
  for (const x of [-2, -1, 0, 1, 2]) for (const h of [-.5, -.1, 0, .1, .5]) {
    const sample = model.sample(x, h);
    near(sample.derivative, 6 * x);
    near(sample.deltaY, 6 * x * h + 3 * h * h);
    near(sample.error, 3 * h * h);
    if (h === 0) assert.equal(sample.errorPerH, null);
    else near(sample.errorPerH!, 3 * h);
    if (x === 0 && h !== 0) {
      near(sample.dy, 0);
      assert.ok(sample.deltaY > 0);
    }
  }
});

test("two-reversal source uses the intermediate point and signed derivative product", () => {
  const model = checked("two-reversals");
  const initial = model.sample(model.source.x, model.source.h);
  assert.equal(initial.firstScale, -2);
  assert.equal(initial.secondScale, -2);
  assert.equal(initial.derivative, 4);
  assert.ok(initial.deltaU < 0 && initial.deltaY > 0);
  for (const x of [-2, -1, 0, 1, 2]) for (const h of [-.5, -.1, 0, .1, .5]) {
    const sample = model.sample(x, h);
    near(sample.derivative, 4 * x ** 3);
    near(sample.deltaY, (x + h) ** 4 - x ** 4);
    near(sample.error, 6 * x * x * h * h + 4 * x * h ** 3 + h ** 4);
  }
});

test("both authored cases retain deterministic travel and reject unlicensed meanings", () => {
  for (const name of ["stationary-change", "two-reversals"]) {
    const model = checked(name);
    const before = projectChange(model, model.source.x, model.source.h, 3.5);
    projectChange(model, model.source.x, model.source.h, 4);
    projectChange(model, model.source.x, model.source.h, 0);
    assert.deepEqual(projectChange(model, model.source.x, model.source.h, 3.5), before);
    for (const inner of ["x/x", "0*z", "\\ln(x)"]) {
      const result = compileChangeSource(JSON.stringify({ ...JSON.parse(source(name)), inner }));
      assert.equal(result.status, "repair-gap");
      if (result.status === "repair-gap") assert.equal(result.path, "inner");
    }
  }
});
