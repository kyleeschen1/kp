import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpMathAuthoringContext
} from "../src/math/authoring/context.ts";
import {
  createKpAuthoredUnitScalarMapDefinition
} from "../src/math/authoring/unit-scalar-map.ts";
import {
  createKpUnitDescriptor
} from "../src/math/authoring/units.ts";

const meters = createKpUnitDescriptor({
  id: "fixture.unit.meter",
  symbol: "m"
});
const squareMeters = createKpUnitDescriptor({
  id: "fixture.unit.square-meter",
  symbol: "m²"
});

test("unit-scalar definition derives deterministic spaces and IDs", () => {
  const first = createDefinition();
  const second = createDefinition();

  assert.equal(first.kind, "authored-unit-scalar-map-definition");
  assert.deepEqual(first.ids, {
    map: "fixture.circle.functions.area-at-radius",
    derivative: "fixture.circle.derivatives.radial-area-change"
  });
  assert.deepEqual(describeSpace(first.spaces.domain), {
    id: "fixture.circle.spaces.radius.vector-space",
    semanticId: "fixture.circle.spaces.radius",
    label: "Radius",
    unitId: meters.id
  });
  assert.deepEqual(describeSpace(first.spaces.codomain), {
    id: "fixture.circle.spaces.area.vector-space",
    semanticId: "fixture.circle.spaces.area",
    label: "Area",
    unitId: squareMeters.id
  });
  assert.deepEqual(describeDefinition(first), describeDefinition(second));
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.ids), true);
  assert.equal(Object.isFrozen(first.spaces), true);
  assert.equal(Object.isFrozen(first.rules), true);
});

test("custom units and caller-authored nonlinear rules remain explicit", () => {
  const definition = createDefinition();

  assert.equal(definition.units.domain, meters);
  assert.equal(definition.units.codomain, squareMeters);
  assert.equal(definition.rules.evaluateMagnitude(3), 9 * Math.PI);
  assert.equal(
    definition.rules.derivativeMagnitudeAt(3, 0.5),
    3 * Math.PI
  );
  assert.equal(
    definition.rules.derivativeMagnitudeAt(-3, 0.5),
    -3 * Math.PI
  );
});

test("explicit compatible spaces are reused without a cache or registry", () => {
  const first = createDefinition();
  const second = createKpAuthoredUnitScalarMapDefinition(
    createKpStandardMathAuthoringContext({ namespace: "fixture.circle" }),
    { ...definitionInput(), spaces: first.spaces }
  );

  assert.equal(second.spaces.domain, first.spaces.domain);
  assert.equal(second.spaces.codomain, first.spaces.codomain);
  assert.throws(
    () => createKpAuthoredUnitScalarMapDefinition(
      createKpStandardMathAuthoringContext({ namespace: "fixture.other" }),
      { ...definitionInput(), spaces: first.spaces }
    ),
    /Unit-scalar domain space must use semantic path fixture.other.spaces.radius/
  );
});

test("the core rejects absent scalar defaults and invalid authored paths", () => {
  assert.throws(
    () => createKpAuthoredUnitScalarMapDefinition(
      createKpMathAuthoringContext({ namespace: "fixture.no-scalars" }),
      definitionInput()
    ),
    /Unit-scalar map authoring requires numeric scalar defaults/
  );
  assert.throws(
    () => createKpAuthoredUnitScalarMapDefinition(
      createKpStandardMathAuthoringContext({ namespace: "fixture.invalid" }),
      { ...definitionInput(), path: "" }
    ),
    /semantic path segment 1 must be non-empty/
  );
});

function createDefinition() {
  return createKpAuthoredUnitScalarMapDefinition(
    createKpStandardMathAuthoringContext({ namespace: "fixture.circle" }),
    definitionInput()
  );
}

function definitionInput() {
  return {
    path: "area-at-radius",
    derivativePath: "radial-area-change",
    domain: {
      path: "radius",
      label: "Radius",
      unit: meters
    },
    codomain: {
      path: "area",
      label: "Area",
      unit: squareMeters
    },
    evaluateMagnitude: (radius: number) => Math.PI * radius ** 2,
    derivativeMagnitudeAt: (radius: number, change: number) =>
      2 * Math.PI * radius * change
  };
}

function describeSpace(space: {
  readonly id: string;
  readonly space: Readonly<{ id: string; label: string }>;
  readonly vectors: Readonly<{ zero: Readonly<{ unitId: string }> }>;
}) {
  return {
    id: space.id,
    semanticId: space.space.id,
    label: space.space.label,
    unitId: space.vectors.zero.unitId
  };
}

function describeDefinition(definition: ReturnType<typeof createDefinition>) {
  return {
    ids: definition.ids,
    domain: describeSpace(definition.spaces.domain),
    codomain: describeSpace(definition.spaces.codomain),
    atTwo: definition.rules.evaluateMagnitude(2),
    derivativeAtTwo: definition.rules.derivativeMagnitudeAt(2, 0.5)
  };
}
