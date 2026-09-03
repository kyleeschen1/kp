import {
  createKpStandardMathAuthoringContext
} from "../../src/math/authoring/algebra.ts";
import {
  createKpAuthoredUnitScalarMapDefinition,
  type KpAuthoredUnitScalarMapDefinition
} from "../../src/math/authoring/unit-scalar-map.ts";
import {
  createKpUnitDescriptor
} from "../../src/math/authoring/units.ts";

const meters = createKpUnitDescriptor({ id: "fixture.unit.m", symbol: "m" });
const squareMeters = createKpUnitDescriptor({
  id: "fixture.unit.m2",
  symbol: "m²"
});
const definition = createKpAuthoredUnitScalarMapDefinition(
  createKpStandardMathAuthoringContext({ namespace: "fixture.circle" }),
  {
    path: "area-at-radius",
    domain: { path: "radius", label: "Radius", unit: meters },
    codomain: { path: "area", label: "Area", unit: squareMeters },
    evaluateMagnitude: (radius) => Math.PI * radius ** 2,
    derivativeMagnitudeAt: (radius, change) =>
      2 * Math.PI * radius * change
  }
);

const exact: KpAuthoredUnitScalarMapDefinition<
  "fixture.unit.m",
  "fixture.unit.m2"
> = definition;
void exact;

// @ts-expect-error Domain and codomain unit identity is not interchangeable.
const reversed: KpAuthoredUnitScalarMapDefinition<
  "fixture.unit.m2",
  "fixture.unit.m"
> = definition;
void reversed;

createKpAuthoredUnitScalarMapDefinition(
  createKpStandardMathAuthoringContext({ namespace: "fixture.invalid-rule" }),
  {
    path: "bad",
    domain: { path: "radius", label: "Radius", unit: meters },
    codomain: { path: "area", label: "Area", unit: squareMeters },
    // @ts-expect-error Scalar map rules consume numeric magnitudes.
    evaluateMagnitude: (radius: string) => radius.length,
    derivativeMagnitudeAt: (radius, change) => radius + change
  }
);
