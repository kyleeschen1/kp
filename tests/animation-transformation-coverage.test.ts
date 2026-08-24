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
import {
  kpEquationCoverageBaseline20260820,
  kpSymbolicCoverageMaturityDimensions,
  summarizeKpEquationCoverage
} from "../src/architecture/symbolic-mathematics-coverage-baseline.ts";

test("generated coverage is a fresh deterministic plan projection", () => {
  const coverage = createKpAnimationTransformationCoverage();
  assert.deepEqual(generatedCoverage, coverage);
  assert.equal(
    coverage.generatedFrom.caseCoverageSchemaVersion,
    "kp.symbolic-case-coverage.v1"
  );
  assert.equal(coverage.summary.total, kpAnimationCapabilityPlan.entries.length);
  assert.equal(coverage.symbolicMathematics.groups.length, 9);
  assert.equal(coverage.symbolicMathematics.maturityDimensions.length, 6);
  assert.deepEqual(
    coverage.symbolicMathematics.groups.flatMap(({ capabilityIds }) =>
      capabilityIds
    ).sort(),
    coverage.entries.filter(({ domain }) => domain === "equation")
      .map(({ capabilityId }) => capabilityId).sort()
  );
  assert.deepEqual(coverage.entries.map(({ capabilityId, order }) => ({
    capabilityId,
    order
  })), kpAnimationCapabilityPlan.entries.map(({ id, order }) => ({
    capabilityId: id,
    order
  })));
});

test("Calc BC planning starts from an exact equation coverage baseline", () => {
  assert.deepEqual(kpEquationCoverageBaseline20260820.byStatus, {
    Direct: 6,
    Registered: 4,
    Exemplar: 2,
    Missing: 7
  });
  assert.equal(
    Object.values(kpEquationCoverageBaseline20260820.byStatus)
      .reduce((sum, count) => sum + count, 0),
    kpEquationCoverageBaseline20260820.equationCapabilityCount
  );
  const live = summarizeKpEquationCoverage(
    createKpAnimationTransformationCoverage()
  );
  assert.ok(
    live.equationCapabilityCount >=
      kpEquationCoverageBaseline20260820.equationCapabilityCount
  );
  assert.deepEqual(live.byStatus, {
    Direct: 9,
    Registered: 3,
    Exemplar: 2,
    Missing: 15
  });
});

test("coverage maturity keeps paint meaning promotion and generation separate", () => {
  assert.deepEqual(kpSymbolicCoverageMaturityDimensions.map(({ id }) => id), [
    "notation-paintable",
    "semantic-representable",
    "operation-authoritative",
    "exemplar-executable",
    "family-promoted",
    "generation-governed"
  ]);
  assert.match(
    kpSymbolicCoverageMaturityDimensions[0]?.claim ?? "",
    /without asserting its meaning/u
  );
  assert.match(
    kpSymbolicCoverageMaturityDimensions[5]?.claim ?? "",
    /typed repair/u
  );
});

test("direct rows have exact authoring corpus compiler and exemplar evidence", () => {
  const direct = createKpAnimationTransformationCoverage().entries.filter(
    ({ status }) => status === "Direct"
  );
  assert.equal(direct.length, 11);
  for (const capabilityId of [
    "capability.equation.function-wrapping",
    "capability.equation.distribution",
    "capability.equation.additive-cancellation",
    "capability.equation.balanced-operations",
    "capability.equation.alternative-logarithm-bases"
  ]) {
    const entry = direct.find((candidate) =>
      candidate.capabilityId === capabilityId
    );
    assert.ok(entry, capabilityId);
    assert.deepEqual(entry.remainingRequirementIds, []);
    assert.equal(entry.exemplarLinks.length, 1);
    assert.deepEqual(entry.evidenceTensions, [
      "direct-deterministic-not-live-model-evidence"
    ]);
  }
  const homomorphism = direct.find(({ capabilityId }) => capabilityId ===
    "capability.equation.log-homomorphic-decomposition");
  assert.deepEqual(homomorphism?.remainingRequirementIds, [
    "requirement.equation.log-homomorphism.product-exemplar"
  ]);
  assert.deepEqual(homomorphism?.evidenceTensions, [
    "direct-deterministic-not-live-model-evidence"
  ]);
  const exponential = direct.find(({ capabilityId }) => capabilityId ===
    "capability.equation.exponential-homomorphism");
  assert.deepEqual(exponential?.remainingRequirementIds, []);
  assert.deepEqual(exponential?.exemplarLinks.map(({ assetId }) => assetId), [
    "animation.algebra.exponential-homomorphism.sum-to-product",
    "animation.algebra.exponential-homomorphism.difference-to-quotient"
  ]);
  assert.deepEqual(exponential?.evidenceTensions, [
    "direct-deterministic-not-live-model-evidence"
  ]);
  const roots = direct.find(({ capabilityId }) => capabilityId ===
    "capability.equation.radical-inversion");
  assert.deepEqual(roots?.remainingRequirementIds, []);
  assert.deepEqual(roots?.exemplarLinks.map(({ assetId }) => assetId), [
    "animation.algebra.radical.compound-carrier-normalization"
  ]);
  assert.equal(roots?.caseCoverage?.status, "tracked");
  if (roots?.caseCoverage?.status !== "tracked") {
    assert.fail("Root coverage must project the typed case ledger.");
  }
  assert.equal(roots.caseCoverage.caseCount, 10);
  assert.deepEqual(roots.caseCoverage.cases.map(({ operationClass }) =>
    operationClass), [
    "closed-evaluation",
    "inverse-normalization",
    "compound-carrier-normalization",
    "assumption-qualified-cancellation",
    "exponent-index-composition",
    "mixed-evaluation",
    "partial-extraction",
    "nested-root-composition",
    "blocked-rewrite",
    "composed-derivation"
  ]);
  assert.equal(roots.caseCoverage.cases.find(({ operationClass }) =>
    operationClass === "blocked-rewrite")?.outcome, "typed-gap");

  const finiteBinders = direct.find(({ capabilityId }) => capabilityId ===
    "capability.equation.finite-binder-expansion");
  assert.deepEqual(finiteBinders?.remainingRequirementIds, []);
  assert.deepEqual(finiteBinders?.exemplarLinks.map(({ assetId }) => assetId), [
    "animation.equation.finite-sum-expansion.v1",
    "animation.equation.finite-product-expansion.v1"
  ]);
  assert.equal(finiteBinders?.caseCoverage?.status, "tracked");
  if (finiteBinders?.caseCoverage?.status !== "tracked") {
    assert.fail("Finite binder coverage must project its typed case ledger.");
  }
  assert.equal(finiteBinders.caseCoverage.caseCount, 11);
  assert.equal(finiteBinders.caseCoverage.cases.find(({ operationClass }) =>
    operationClass === "singleton-sum")?.outcome, "semantic-only");
  assert.equal(finiteBinders.caseCoverage.cases.find(({ operationClass }) =>
    operationClass === "finite-product-pressure")?.maturity.find(
      ({ dimensionId }) => dimensionId === "exemplar-executable"
    )?.status, "satisfied");
});

test("every equation capability exposes its case-ledger promotion state", () => {
  const equationEntries = createKpAnimationTransformationCoverage().entries
    .filter(({ domain }) => domain === "equation");
  assert.ok(equationEntries.every(({ caseCoverage }) =>
    caseCoverage !== undefined));
  assert.ok(equationEntries.filter(({ status }) => status === "Direct")
    .every(({ caseCoverage }) =>
      caseCoverage?.status === "tracked" ||
      caseCoverage?.status === "legacy-untracked"));
});

test("balanced operation coverage promotes only the proved six-operation path", () => {
  const entry = createKpAnimationTransformationCoverage().entries.find(
    ({ capabilityId }) => capabilityId ===
      "capability.equation.balanced-operations"
  );
  assert.equal(entry?.status, "Direct");
  assert.deepEqual(entry?.remainingRequirementIds, []);
  assert.match(entry?.requirements.find(({ kind }) =>
    kind === "generation-corpus")?.summary ?? "", /apply-log/u);
  assert.doesNotMatch(entry?.requirements.find(({ kind }) =>
    kind === "generation-corpus")?.summary ?? "", /exponentiate|root/u);
});

test("alternative logarithm bases become direct only through governed authoring", () => {
  const entry = createKpAnimationTransformationCoverage().entries.find(
    ({ capabilityId }) => capabilityId ===
      "capability.equation.alternative-logarithm-bases"
  );
  assert.equal(entry?.status, "Direct");
  assert.deepEqual(entry?.remainingRequirementIds, []);
  assert.deepEqual(entry?.evidenceTensions, [
    "direct-deterministic-not-live-model-evidence"
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

test("cross-domain rows distinguish exact frontends from unproved gaps", () => {
  const coverage = createKpAnimationTransformationCoverage();
  const crossDomain = coverage.entries.filter(({ domain }) =>
    domain !== "equation"
  );
  assert.equal(crossDomain.length, 9);
  for (const entry of crossDomain.filter(({ capabilityId }) =>
    capabilityId !== "capability.code.typescript-refactoring" &&
    capabilityId !== "capability.code.python-refactoring" &&
    capabilityId !== "capability.graph-2d.function-transformations" &&
    capabilityId !== "capability.graph-3d.scene-transformations"
  )) {
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
  for (const capabilityId of [
    "capability.code.typescript-refactoring",
    "capability.code.python-refactoring"
  ]) {
    const entry = crossDomain.find((candidate) =>
      candidate.capabilityId === capabilityId
    );
    assert.equal(entry?.status, "Direct");
    assert.deepEqual(entry?.gaps, []);
    assert.deepEqual(entry?.remainingRequirementIds, []);
  }
  const graph2D = crossDomain.find(({ capabilityId }) =>
    capabilityId === "capability.graph-2d.function-transformations"
  );
  assert.equal(graph2D?.status, "Missing");
  assert.deepEqual(graph2D?.gaps, []);
  assert.deepEqual(graph2D?.remainingRequirementIds, [
    "requirement.graph-2d.function.operation",
    "requirement.graph-2d.function.recipe",
    "requirement.graph-2d.function.exemplar",
    "requirement.graph-2d.function.corpus"
  ]);
  const graph3D = crossDomain.find(({ capabilityId }) =>
    capabilityId === "capability.graph-3d.scene-transformations"
  );
  assert.equal(graph3D?.status, "Exemplar");
  assert.deepEqual(graph3D?.gaps, []);
  assert.deepEqual(graph3D?.remainingRequirementIds, [
    "requirement.graph-3d.scene.operation",
    "requirement.graph-3d.scene.recipe",
    "requirement.graph-3d.scene.renderer",
    "requirement.graph-3d.scene.corpus"
  ]);
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
