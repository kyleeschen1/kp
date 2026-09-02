import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCartesianSpace,
  createKpFiniteBasis,
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitTaggedScalarSpace
} from "../src/math/authoring/units.ts";

type Vec2 = readonly [number, number];

test("optional packs provide defaults and custom extensions without registration", () => {
  const author = createKpStandardMathAuthoringContext({
    namespace: "lesson.extension"
  });
  const plane = createKpCartesianSpace({
    id: "kp.space.extension.plane",
    dimension: 2,
    scalars: author.defaults.scalars
  });
  const customBasis = createKpFiniteBasis({
    id: "kp.basis.extension.custom",
    space: plane,
    vectors: [[1, 1] as Vec2, [1, -1] as Vec2] as const,
    coordinates: (value) => [
      (value[0]! + value[1]!) / 2,
      (value[0]! - value[1]!) / 2
    ] as const,
    fromCoordinates: (coordinates) => [
      coordinates[0]! + coordinates[1]!,
      coordinates[0]! - coordinates[1]!
    ] as const,
    coordinateIsomorphism: {
      kind: "tested",
      suiteId: "kp.test.extension.custom-basis",
      equalityId: plane.vectors.equality.id
    }
  });
  const widgets = createKpUnitDescriptor({
    id: "kp.unit.extension.widget",
    symbol: "widget"
  });
  const widgetSpace = createKpUnitTaggedScalarSpace({
    id: "kp.space.extension.widgets",
    unit: widgets,
    scalars: author.defaults.scalars
  });

  assert.equal(author.defaults.scalars?.equality.mode, "approximate");
  assert.deepEqual(customBasis.coordinates([5, 1]), [3, 2]);
  assert.equal(widgetSpace.space.id, "kp.space.extension.widgets");
  assert.equal(Object.isFrozen(customBasis), true);
});
