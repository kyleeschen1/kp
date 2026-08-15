import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentChoreography } from "../src/animation/log-exponent-choreography.ts";
import { kpCanonicalLogExponentInterpolationProgram } from "../src/animation/log-exponent-interpolation-obligations.ts";
import { validateKpChoreographyPlan } from "../src/animation/choreography-plan.ts";

test("canonical log-exponent operations use one valid five-phase envelope", () => {
  assert.equal(kpCanonicalLogExponentChoreography.length, 3);
  for (const choreography of kpCanonicalLogExponentChoreography) {
    assert.deepEqual(validateKpChoreographyPlan(choreography.plan), []);
    assert.deepEqual(choreography.plan.phases.map(({ id }) => id), [
      "orient",
      "reflow",
      "act",
      "settle",
      "release"
    ]);
    assert.equal(
      choreography.plan.timelineRefId,
      `timeline.${choreography.operationId}`
    );
  }
});

test("every typed interpolation obligation binds to one semantic activity", () => {
  for (const choreography of kpCanonicalLogExponentChoreography) {
    const expected = kpCanonicalLogExponentInterpolationProgram.obligations
      .filter(({ operationId }) => operationId === choreography.operationId)
      .map(({ id }) => id)
      .sort();
    const bound = choreography.obligationBindings
      .flatMap(({ obligationIds }) => obligationIds)
      .sort();
    assert.deepEqual(bound, expected);
    assert.equal(new Set(bound).size, bound.length);
  }
  const extraction = kpCanonicalLogExponentChoreography[1]!;
  const transfer = extraction.obligationBindings.find(
    ({ activityId }) => activityId.endsWith(".transfer")
  );
  assert.ok(transfer?.obligationIds.some((id) => id.endsWith("unknown-x")));
});

test("semantic envelope contains no renderer geometry or private clocks", () => {
  const serialized = JSON.stringify(kpCanonicalLogExponentChoreography);
  for (const forbidden of ["durationMs", "keyframes", "trajectory", "coordinates", "css", "svg", "dom"]) {
    assert.equal(serialized.includes(`\"${forbidden}\"`), false, forbidden);
  }
});
