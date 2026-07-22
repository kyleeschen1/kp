import assert from "node:assert/strict";
import test from "node:test";

import {
  attentionPhaseAt,
  createKpDistributionAreaAttentionPlan
} from "../src/animation/distribution-area-exemplar-attention.ts";
import { createKpDistributionAreaExemplarCrossSurfaceModel } from "../src/semantic/distribution-area-exemplar-cross-surface.ts";

test("attention cycles orient act settle inspect without gaps", () => {
  const plan = createKpDistributionAreaAttentionPlan();
  assert.deepEqual(plan.phases.map(({ kind }) => kind), [
    "orient", "act", "settle", "inspect", "orient", "act", "settle", "inspect"
  ]);
  let cursor = 0;
  for (const phase of plan.phases) {
    assert.equal(phase.startPermille, cursor, phase.id);
    assert.ok(phase.endPermille > phase.startPermille, phase.id);
    cursor = phase.endPermille;
  }
  assert.equal(cursor, 1000);
});

test("motion never competes with prose for primary attention", () => {
  const plan = createKpDistributionAreaAttentionPlan();
  for (const phase of plan.phases.filter(({ kind }) => kind === "act" || kind === "settle")) {
    assert.equal(phase.proseDimmed, true, phase.id);
    assert.notEqual(phase.primarySurface, "prose", phase.id);
  }
  for (const phase of plan.phases.filter(({ kind }) => kind === "orient")) {
    assert.equal(phase.primarySurface, "prose", phase.id);
    assert.equal(phase.proseDimmed, false, phase.id);
  }
});

test("every attention concept resolves across the exemplar model", () => {
  const conceptIds = new Set(
    createKpDistributionAreaExemplarCrossSurfaceModel().links.map(({ conceptId }) => conceptId)
  );
  for (const phase of createKpDistributionAreaAttentionPlan().phases) {
    assert.ok(phase.conceptIds.length > 0, phase.id);
    assert.ok(phase.conceptIds.every((conceptId) => conceptIds.has(conceptId)), phase.id);
  }
});

test("attention lookup has deterministic boundary ownership", () => {
  const plan = createKpDistributionAreaAttentionPlan();
  assert.equal(attentionPhaseAt(plan, 79).id, "distribute.orient");
  assert.equal(attentionPhaseAt(plan, 80).id, "distribute.act");
  assert.equal(attentionPhaseAt(plan, 1000).id, "evaluate.inspect");
});
