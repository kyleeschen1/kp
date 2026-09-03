import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpCircleMeasurement
} from "./fixtures/typed-circle-measurement.ts";
import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../src/math/authoring/units.ts";

const radiusUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.meter",
  symbol: "m"
});
const areaUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.square-meter",
  symbol: "m²"
});

function createCircle() {
  return createKpCircleMeasurement({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.circle-measurement"
    }),
    key: "garden",
    units: { radius: radiusUnit, area: areaUnit }
  });
}

test("circle area retains typed units and stable semantic identity", () => {
  const circle = createCircle();
  const radius = createKpUnitValue(radiusUnit, 2);

  assert.equal(circle.id, "lesson.circle-measurement.circles.garden");
  assert.equal(
    circle.areaAtRadius.id,
    "lesson.circle-measurement.circles.garden.functions.area-at-radius"
  );
  assert.deepEqual(circle.areaAtRadius.evaluate(radius), {
    magnitude: 4 * Math.PI,
    unitId: areaUnit.id
  });
  assert.equal(
    circle.derivativeUnitLatex,
    "\\frac{\\mathrm{m²}}{\\mathrm{m}}"
  );
  assert.equal(Object.isFrozen(circle), true);
  assert.equal(Object.isFrozen(circle.units), true);
  assert.equal(Object.isFrozen(circle.areaAtRadius), true);
});

test("the derivative is a point-dependent linear map over radius changes", () => {
  const circle = createCircle();
  const change = createKpUnitValue(radiusUnit, 0.5);
  const atTwo = circle.areaAtRadius.derivativeAt(
    createKpUnitValue(radiusUnit, 2)
  );
  const atThree = circle.areaAtRadius.derivativeAt(
    createKpUnitValue(radiusUnit, 3)
  );

  assert.deepEqual(atTwo.apply(change), {
    magnitude: 2 * Math.PI,
    unitId: areaUnit.id
  });
  assert.deepEqual(atThree.apply(change), {
    magnitude: 3 * Math.PI,
    unitId: areaUnit.id
  });
  assert.equal(atTwo.id, atThree.id);
  assert.deepEqual(atTwo.sourceMapIds, [circle.areaAtRadius.id]);
  assert.deepEqual(atTwo.linearity, {
    kind: "tested",
    suiteId: "kp.test.typed-circle-measurement.derivative-linearity",
    equalityId: circle.spaces.area.vectors.equality.id
  });
});

test("the algebraic map preserves its signed vector-space extension", () => {
  const circle = createCircle();
  const radius = createKpUnitValue(radiusUnit, -2);
  const change = createKpUnitValue(radiusUnit, 0.5);

  assert.deepEqual(circle.areaAtRadius.evaluate(radius), {
    magnitude: 4 * Math.PI,
    unitId: areaUnit.id
  });
  assert.deepEqual(circle.areaAtRadius.derivativeAt(radius).apply(change), {
    magnitude: -2 * Math.PI,
    unitId: areaUnit.id
  });
});

test("circle evaluation and differentiation reject runtime unit forgery", () => {
  const circle = createCircle();
  const forgedArea = createKpUnitValue(areaUnit, 2) as never;

  assert.throws(
    () => circle.areaAtRadius.evaluate(forgedArea),
    /Circle radius must use unit kp.unit.pressure.meter/
  );
  assert.throws(
    () => circle.areaAtRadius.derivativeAt(forgedArea),
    /Circle derivative point must use unit kp.unit.pressure.meter/
  );
  assert.throws(
    () => circle.areaAtRadius.derivativeAt(
      createKpUnitValue(radiusUnit, 2)
    ).apply(forgedArea),
    /Circle radius change must use unit kp.unit.pressure.meter/
  );
});

test("the circle pressure caller remains renderer and publication neutral", async () => {
  const source = await readFile(new URL(
    "./fixtures/typed-circle-measurement.ts",
    import.meta.url
  ), "utf8");
  const imports = [...source.matchAll(/from "([^"]+)"/g)]
    .map((match) => match[1]);

  assert.ok(imports.length > 0);
  assert.equal(
    imports.every((specifier) => specifier?.startsWith("../../src/math/")),
    true
  );
  assert.doesNotMatch(source, /Article|Graph2D|renderer|animation/i);
});
