import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpUnitValue } from
  "../src/math/authoring/units.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import {
  createKpSemanticStateCircleFamilyFixture,
  kpCircleAreaUnit
} from "./fixtures/semantic-state-circle-family.ts";

const SOURCE = "tests/fixtures/semantic-state-circle-family.ts";

test("nonmonotonic exact seeks derive nonlinear circle values", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const evaluator = createEvaluator(fixture, 0);
  const order = [
    createKpSemanticProgress(0n),
    createKpSemanticProgress(3n, 4n),
    createKpSemanticProgress(1n, 4n),
    createKpSemanticProgress(1n),
    createKpSemanticProgress(1n, 2n)
  ];

  assert.deepEqual(order.map(progress => sampleCircle(
    fixture,
    evaluator,
    progress
  )), [
    circleValues(2),
    circleValues(3.5),
    circleValues(2.5),
    circleValues(4),
    circleValues(3)
  ]);
});

test("midpoint area is recomputed rather than linearly interpolated", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const evaluator = createEvaluator(fixture, 0);
  const before = sampleCircle(fixture, evaluator,
    createKpSemanticProgress(0n));
  const midpoint = sampleCircle(fixture, evaluator,
    createKpSemanticProgress(1n, 2n));
  const after = sampleCircle(fixture, evaluator,
    createKpSemanticProgress(1n));
  const linearlyInterpolatedArea =
    (before.area.magnitude + after.area.magnitude) / 2;

  assert.equal(midpoint.radius.magnitude, 3);
  assert.equal(midpoint.area.magnitude, 9 * Math.PI);
  assert.notEqual(midpoint.area.magnitude, linearlyInterpolatedArea);
  assert.equal(midpoint.response.magnitude, 3 * Math.PI);
});

test("equivalent progress, repeat, and rewind preserve one result", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const evaluator = createEvaluator(fixture, 2);
  const half = evaluator.at(createKpSemanticProgress(1n, 2n));
  const equivalentHalf = evaluator.at(createKpSemanticProgress(2n, 4n));
  const forward = [1n, 2n, 3n].map(numerator => sampleCircle(
    fixture,
    evaluator,
    createKpSemanticProgress(numerator, 4n)
  ));
  const rewind = [3n, 2n, 1n].map(numerator => sampleCircle(
    fixture,
    evaluator,
    createKpSemanticProgress(numerator, 4n)
  ));

  assert.equal(equivalentHalf, half);
  assert.deepEqual(rewind, [...forward].reverse());
  assert.equal(evaluator.inspect().capacity, 2);
  assert.equal(evaluator.inspect().entries, 2);
  assert.ok(evaluator.inspect().hits > 0);
});

test("sampling and cache lifecycle leave circle history unchanged", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const durableInventory = JSON.stringify({
    before: fixture.application.commit.before,
    after: fixture.application.commit.after,
    journal: fixture.application.commit.journal,
    parameters: fixture.application.parameters
  });
  const evaluator = createEvaluator(fixture, 2);

  evaluator.at(createKpSemanticProgress(1n, 4n));
  evaluator.at(createKpSemanticProgress(1n, 2n));
  evaluator.at(createKpSemanticProgress(3n, 4n));
  evaluator.reset();
  evaluator.at(createKpSemanticProgress(1n, 3n));
  evaluator.dispose();
  evaluator.dispose();

  assert.equal(JSON.stringify({
    before: fixture.application.commit.before,
    after: fixture.application.commit.after,
    journal: fixture.application.commit.journal,
    parameters: fixture.application.parameters
  }), durableInventory);
  assert.equal(evaluator.inspect().status, "disposed");
  assert.equal(evaluator.inspect().entries, 0);
});

test("runtime unit forgery fails before a circle branch can apply", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const forgedArea = createKpUnitValue(kpCircleAreaUnit, 6);

  assert.throws(() => Reflect.apply(
    fixture.family.reparameterize,
    fixture.family,
    [fixture.application, {
      applicationId: "wrong-area-unit",
      parameters: { finalRadius: forgedArea },
      sourceId: "lesson.circle-measurement.state-family.runtime-forgery"
    }]
  ), /Circle radius must use unit kp.unit.pressure.meter/);
});

test("the approximate numeric boundary never claims exact circle output", () => {
  const source = readFileSync(SOURCE, "utf8");
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const sampled = sampleCircle(
    fixture,
    createEvaluator(fixture, 0),
    createKpSemanticProgress(1n, 3n)
  );

  assert.match(source, /interpolateApproximateRadiusMagnitude/u);
  assert.match(source, /never labels its output exact/u);
  for (const value of [sampled.radius, sampled.area, sampled.response]) {
    assert.deepEqual(Object.keys(value).sort(), ["magnitude", "unitId"]);
    assert.equal("numerator" in value, false);
    assert.equal("denominator" in value, false);
  }
});

function createEvaluator(
  fixture: ReturnType<typeof createKpSemanticStateCircleFamilyFixture>,
  sampleCacheCapacity: number
) {
  return createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application,
    sampleCacheCapacity
  });
}

function sampleCircle(
  fixture: ReturnType<typeof createKpSemanticStateCircleFamilyFixture>,
  evaluator: ReturnType<typeof createEvaluator>,
  progress: ReturnType<typeof createKpSemanticProgress>
) {
  const sample = evaluator.at(progress);
  return {
    status: sample.sampleStatus,
    radius: sample.kind === "persistent-endpoint"
      ? sample.view.measurement.radius.read()
      : readSampledRadius(fixture, sample.source.drivers[0]?.value),
    area: evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      source: sample.source,
      target: fixture.handles.refs.measurement.area
    }),
    response: evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      source: sample.source,
      target: fixture.handles.refs.measurement.response
    })
  };
}

function readSampledRadius(
  fixture: ReturnType<typeof createKpSemanticStateCircleFamilyFixture>,
  value: unknown
) {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      !("magnitude" in value) || typeof value.magnitude !== "number" ||
      !("unitId" in value) ||
      value.unitId !== fixture.measurement.units.radius.id) {
    throw new Error("Expected one sampled circle radius value.");
  }
  return createKpUnitValue(
    fixture.measurement.units.radius,
    value.magnitude
  );
}

function circleValues(radius: number) {
  return {
    status: radius === 2
      ? "baseline"
      : radius === 4
        ? "target"
        : "intermediate",
    radius: { magnitude: radius, unitId: "kp.unit.pressure.meter" },
    area: {
      magnitude: Math.PI * radius ** 2,
      unitId: "kp.unit.pressure.square-meter"
    },
    response: {
      magnitude: Math.PI * radius,
      unitId: "kp.unit.pressure.square-meter"
    }
  };
}
