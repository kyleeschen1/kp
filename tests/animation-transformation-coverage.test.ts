import assert from "node:assert/strict";
import test from "node:test";

import generatedCoverage from
  "../src/architecture/animation-transformation-coverage.generated.json" with {
    type: "json"
  };
import {
  createKpAnimationTransformationCoverage
} from "../src/architecture/animation-transformation-coverage.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";

test("generated coverage is a fresh deterministic plan projection", () => {
  const coverage = createKpAnimationTransformationCoverage();
  assert.deepEqual(generatedCoverage, coverage);
  assert.equal(coverage.summary.total, kpAnimationCapabilityPlan.entries.length);
  assert.deepEqual(coverage.entries.map(({ capabilityId, order }) => ({
    capabilityId,
    order
  })), kpAnimationCapabilityPlan.entries.map(({ id, order }) => ({
    capabilityId: id,
    order
  })));
});

test("direct rows have exact authoring corpus compiler and exemplar evidence", () => {
  const direct = createKpAnimationTransformationCoverage().entries.filter(
    ({ status }) => status === "Direct"
  );
  assert.equal(direct.length, 3);
  for (const entry of direct) {
    assert.deepEqual(entry.remainingRequirementIds, []);
    assert.equal(entry.exemplarLinks.length, 1);
    assert.deepEqual(entry.evidenceTensions, [
      "direct-deterministic-not-live-model-evidence"
    ]);
  }
});

test("alternative logarithm bases expose every syntax and motif gap", () => {
  const entry = createKpAnimationTransformationCoverage().entries.find(
    ({ capabilityId }) => capabilityId ===
      "capability.equation.alternative-logarithm-bases"
  );
  assert.equal(entry?.status, "Missing");
  assert.deepEqual(entry?.remainingRequirementIds, [
    "requirement.equation.logarithm-base.normalizer",
    "requirement.equation.logarithm-base.operation",
    "requirement.equation.logarithm-base.recipe",
    "requirement.equation.logarithm-base.motif",
    "requirement.equation.logarithm-base.exemplar",
    "requirement.equation.logarithm-base.authoring",
    "requirement.equation.logarithm-base.corpus"
  ]);
});

test("working examples do not overstate general generation support", () => {
  const entry = createKpAnimationTransformationCoverage().entries.find(
    ({ capabilityId }) => capabilityId ===
      "capability.equation.log-homomorphic-decomposition"
  );
  assert.equal(entry?.status, "Exemplar");
  assert.equal(entry?.exemplarLinks.length, 1);
  assert.ok(entry?.remainingRequirementIds.includes(
    "requirement.equation.log-homomorphism.product-exemplar"
  ));
  assert.ok(entry?.remainingRequirementIds.includes(
    "requirement.equation.log-homomorphism.recipe"
  ));
  assert.deepEqual(entry?.evidenceTensions, [
    "playable-exemplar-without-general-generation"
  ]);
});

test("generated coverage contains no mutable roadmap or presentation state", () => {
  const serialized = JSON.stringify(createKpAnimationTransformationCoverage());
  for (const forbidden of [
    "roadmapStatus",
    "priority",
    "layout",
    "theme",
    "coordinates",
    "timing"
  ]) assert.equal(serialized.includes(`\"${forbidden}\"`), false);
});
