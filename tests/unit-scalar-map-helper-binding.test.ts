import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  bindKpAuthoredUnitScalarMapDefinition,
  createKpAuthoredUnitScalarMapDefinition
} from "../src/math/authoring/unit-scalar-map.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../src/math/authoring/units.ts";

const radiusUnit = createKpUnitDescriptor({
  id: "fixture.unit.radius",
  symbol: "m"
});
const areaUnit = createKpUnitDescriptor({
  id: "fixture.unit.area",
  symbol: "m²"
});

test("binding wraps authored rules in differentiable and linear maps", () => {
  const binding = createBinding();
  const radius = createKpUnitValue(radiusUnit, 2);
  const change = createKpUnitValue(radiusUnit, 0.5);
  const derivative = binding.map.derivativeAt(radius);

  assert.equal(binding.kind, "authored-unit-scalar-map-binding");
  assert.equal(
    binding.map.id,
    "fixture.binding.functions.area-at-radius"
  );
  assert.equal(binding.map.domain, binding.definition.spaces.domain);
  assert.equal(binding.map.codomain, binding.definition.spaces.codomain);
  assert.deepEqual(binding.map.evaluate(radius), {
    magnitude: 4 * Math.PI,
    unitId: areaUnit.id
  });
  assert.equal(
    derivative.id,
    "fixture.binding.derivatives.area-at-radius"
  );
  assert.deepEqual(derivative.apply(change), {
    magnitude: 2 * Math.PI,
    unitId: areaUnit.id
  });
  assert.deepEqual(derivative.linearity, {
    kind: "tested",
    suiteId: "fixture.test.radial-derivative-linearity",
    equalityId: binding.definition.spaces.codomain.vectors.equality.id
  });
  assert.deepEqual(binding.map.sourceFunctionIds, [binding.map.id]);
  assert.deepEqual(derivative.sourceMapIds, [derivative.id]);
  assert.equal(Object.isFrozen(binding), true);
  assert.equal(Object.isFrozen(binding.map), true);
});

test("unit guards reject every same-shape forgery before authored rules", () => {
  let evaluations = 0;
  let derivatives = 0;
  const binding = createBinding({
    evaluateMagnitude: (radius) => {
      evaluations += 1;
      return Math.PI * radius ** 2;
    },
    derivativeMagnitudeAt: (radius, change) => {
      derivatives += 1;
      return 2 * Math.PI * radius * change;
    }
  });
  const forgedArea = createKpUnitValue(areaUnit, 2) as never;

  assert.throws(
    () => binding.map.evaluate(forgedArea),
    /Circle radius must use unit fixture.unit.radius; received fixture.unit.area\./
  );
  assert.throws(
    () => binding.map.derivativeAt(forgedArea),
    /Circle derivative point must use unit fixture.unit.radius; received fixture.unit.area\./
  );
  assert.throws(
    () => binding.map.derivativeAt(
      createKpUnitValue(radiusUnit, 2)
    ).apply(forgedArea),
    /Circle radius change must use unit fixture.unit.radius; received fixture.unit.area\./
  );
  assert.equal(evaluations, 0);
  assert.equal(derivatives, 0);
});

test("binding preserves finite-value and local-diagnostic failures", () => {
  const binding = createBinding({
    evaluateMagnitude: () => Number.POSITIVE_INFINITY,
    derivativeMagnitudeAt: () => Number.NaN
  });
  const radius = createKpUnitValue(radiusUnit, 2);

  assert.throws(
    () => binding.map.evaluate(radius),
    /Unit value fixture.unit.area magnitude must be finite/
  );
  assert.throws(
    () => binding.map.derivativeAt(radius).apply(radius),
    /Unit value fixture.unit.area magnitude must be finite/
  );
  assert.throws(
    () => bindKpAuthoredUnitScalarMapDefinition(
      createDefinition(),
      {
        diagnostics: {
          evaluationInput: " ",
          derivativePoint: "Circle derivative point",
          derivativeChange: "Circle radius change"
        },
        linearity: testedLinearity(createDefinition())
      }
    ),
    /Evaluation input diagnostic must be non-empty and trimmed/
  );
});

function createBinding(rules: Readonly<{
  evaluateMagnitude: (radius: number) => number;
  derivativeMagnitudeAt: (radius: number, change: number) => number;
}> = {
  evaluateMagnitude: (radius) => Math.PI * radius ** 2,
  derivativeMagnitudeAt: (radius, change) =>
    2 * Math.PI * radius * change
}) {
  const definition = createDefinition(rules);
  return bindKpAuthoredUnitScalarMapDefinition(definition, {
    diagnostics: {
      evaluationInput: "Circle radius",
      derivativePoint: "Circle derivative point",
      derivativeChange: "Circle radius change"
    },
    linearity: testedLinearity(definition)
  });
}

function createDefinition(rules: Readonly<{
  evaluateMagnitude: (radius: number) => number;
  derivativeMagnitudeAt: (radius: number, change: number) => number;
}> = {
  evaluateMagnitude: (radius) => Math.PI * radius ** 2,
  derivativeMagnitudeAt: (radius, change) =>
    2 * Math.PI * radius * change
}) {
  return createKpAuthoredUnitScalarMapDefinition(
    createKpStandardMathAuthoringContext({ namespace: "fixture.binding" }),
    {
      path: "area-at-radius",
      domain: { path: "radius", label: "Radius", unit: radiusUnit },
      codomain: { path: "area", label: "Area", unit: areaUnit },
      ...rules
    }
  );
}

function testedLinearity(definition: ReturnType<typeof createDefinition>) {
  return {
    kind: "tested" as const,
    suiteId: "fixture.test.radial-derivative-linearity",
    equalityId: definition.spaces.codomain.vectors.equality.id
  };
}
