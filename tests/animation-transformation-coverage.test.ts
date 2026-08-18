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
  assert.equal(direct.length, 4);
  for (const entry of direct.slice(0, 3)) {
    assert.deepEqual(entry.remainingRequirementIds, []);
    assert.equal(entry.exemplarLinks.length, 1);
    assert.deepEqual(entry.evidenceTensions, [
      "direct-deterministic-not-live-model-evidence"
    ]);
  }
  assert.deepEqual(direct[3]?.remainingRequirementIds, [
    "requirement.equation.log-homomorphism.product-exemplar"
  ]);
  assert.deepEqual(direct[3]?.evidenceTensions, [
    "direct-deterministic-not-live-model-evidence"
  ]);
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

test("direct homomorphic generation retains only the unreviewed product exemplar gap", () => {
  const entry = createKpAnimationTransformationCoverage().entries.find(
    ({ capabilityId }) => capabilityId ===
      "capability.equation.log-homomorphic-decomposition"
  );
  assert.equal(entry?.status, "Direct");
  assert.equal(entry?.exemplarLinks.length, 1);
  assert.deepEqual(entry?.remainingRequirementIds, [
    "requirement.equation.log-homomorphism.product-exemplar"
  ]);
  assert.deepEqual(entry?.evidenceTensions, [
    "direct-deterministic-not-live-model-evidence"
  ]);
});

test("cross-domain rows expose exact frontend-required gaps", () => {
  const coverage = createKpAnimationTransformationCoverage();
  const crossDomain = coverage.entries.filter(({ domain }) =>
    domain !== "equation"
  );
  assert.equal(crossDomain.length, 9);
  for (const entry of crossDomain) {
    assert.deepEqual(entry.gaps.filter(({ kind }) =>
      kind === "frontend-required"
    ), [{
      kind: "frontend-required",
      requirementId: entry.requirements.find(({ kind }) =>
        kind === "domain-frontend"
      )?.id,
      authorityId: entry.requirements.find(({ kind }) =>
        kind === "domain-frontend"
      )?.authorityId,
      repair: "Provide exact evidence from the declared domain-owned frontend."
    }]);
  }
  assert.ok(coverage.entries.filter(({ domain }) => domain === "equation")
    .every(({ gaps }) => gaps.length === 0));
  assert.equal(
    coverage.generatedFrom.frontendEvidenceSchemaVersion,
    "kp.animation-domain-frontend-evidence.v1"
  );
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
