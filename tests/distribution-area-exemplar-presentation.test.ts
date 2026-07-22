import assert from "node:assert/strict";
import test from "node:test";

import "../src/animation/fission-fusion-register.ts";

import {
  compileKpDistributionAreaExemplarPresentationPlan
} from "../src/animation/distribution-area-exemplar-presentation.ts";
import { kpDistributionChoreographyPhaseIds } from "../src/animation/distribution-choreography.ts";
import { kpFactoringChoreographyPhaseIds } from "../src/animation/factoring-choreography.ts";

test("area presentation reuses promoted distribution and factoring choreography", () => {
  const plan = compileKpDistributionAreaExemplarPresentationPlan();
  const [distribute] = plan.forward;
  const [, factor] = plan.reverse;

  assert.equal(distribute.kind, "distribution-choreography-plan");
  assert.deepEqual(distribute.phaseIds, kpDistributionChoreographyPhaseIds);
  assert.equal(factor.kind, "factoring-choreography-plan");
  assert.deepEqual(factor.phaseIds, kpFactoringChoreographyPhaseIds);
  assert.deepEqual(distribute.factorCopyIds, factor.factorCopyIds);
  assert.equal(distribute.sourceFactorId, factor.commonFactorId);
});

test("constant product intent is an exact lockstep inverse pair", () => {
  const plan = compileKpDistributionAreaExemplarPresentationPlan();
  const [, evaluate] = plan.forward;
  const [decompose] = plan.reverse;

  assert.deepEqual(evaluate.sourceSelectorIds, decompose.targetSelectorIds);
  assert.deepEqual(evaluate.targetSelectorIds, decompose.sourceSelectorIds);
  assert.equal(evaluate.surfaceCoordination, "lockstep");
  assert.equal(decompose.surfaceCoordination, "lockstep");
  assert.deepEqual(
    [evaluate.geometryAction, decompose.geometryAction],
    ["settle-region-label", "reveal-region-factors"]
  );
});

test("presentation intent carries no layout timing or typography authority", () => {
  const serialized = JSON.stringify(
    compileKpDistributionAreaExemplarPresentationPlan()
  );

  for (const forbidden of ["durationMs", "coordinates", "fontSize", "viewBox", "pathData"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
