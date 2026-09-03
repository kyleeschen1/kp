import {
  createKpCircleMeasurement
} from "../fixtures/typed-circle-measurement.ts";
import {
  createKpStandardMathAuthoringContext
} from "../../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../../src/math/authoring/units.ts";

const radiusUnit = createKpUnitDescriptor({ id: "fixture.unit.m", symbol: "m" });
const areaUnit = createKpUnitDescriptor({ id: "fixture.unit.m2", symbol: "m²" });
const circle = createKpCircleMeasurement({
  author: createKpStandardMathAuthoringContext({ namespace: "fixture.circle" }),
  key: "garden",
  units: { radius: radiusUnit, area: areaUnit }
});

const area = circle.areaAtRadius.evaluate(createKpUnitValue(radiusUnit, 2));
const exactAreaUnit: "fixture.unit.m2" = area.unitId;
void exactAreaUnit;

// @ts-expect-error An area cannot be supplied where a radius is required.
circle.areaAtRadius.evaluate(createKpUnitValue(areaUnit, 2));

const derivative = circle.areaAtRadius.derivativeAt(
  createKpUnitValue(radiusUnit, 2)
);

// @ts-expect-error The derivative consumes a radius change, not an area.
derivative.apply(createKpUnitValue(areaUnit, 1));
