import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationCapabilityAssetEvidence } from
  "../src/architecture/animation-capability-asset-evidence.ts";
import { createKpAnimationCapabilityCompilerEvidence } from
  "../src/architecture/animation-capability-compiler-evidence.ts";
import {
  compileKpAnimationCapabilityReadiness,
  createKpAnimationCapabilityDirectIntentEvidence,
  createKpAnimationCapabilityReadiness
} from "../src/architecture/animation-capability-readiness.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";
import { createKpAnimationDomainFrontendEvidence } from
  "../src/architecture/animation-domain-frontend-evidence.ts";

test("readiness derives the eleven exact direct generation capabilities", () => {
  const readiness = createKpAnimationCapabilityReadiness();
  const direct = readiness.entries.filter(({ status }) => status === "Direct");
  assert.deepEqual(direct.map(({ capabilityId }) => capabilityId), [
    "capability.equation.function-wrapping",
    "capability.equation.distribution",
    "capability.equation.additive-cancellation",
    "capability.equation.log-homomorphic-decomposition",
    "capability.equation.balanced-operations",
    "capability.equation.alternative-logarithm-bases",
    "capability.equation.exponential-homomorphism",
    "capability.equation.radical-inversion",
    "capability.equation.finite-binder-expansion",
    "capability.code.typescript-refactoring",
    "capability.code.python-refactoring"
  ]);
  assert.ok(direct.every(({ evidence }) =>
    evidence.gate === "direct-intent-and-registered-authority"));
});

test("registered exemplar and missing statuses retain distinct gates", () => {
  const readiness = createKpAnimationCapabilityReadiness();
  assert.equal(status(readiness,
    "capability.equation.fraction-factor-cancellation"), "Registered");
  assert.equal(status(readiness,
    "capability.equation.log-homomorphic-decomposition"), "Direct");
  assert.equal(status(readiness,
    "capability.equation.alternative-logarithm-bases"), "Direct");
  assert.equal(status(readiness,
    "capability.equation.integration-transformations"), "Exemplar");
});

test("denominator operations derive registered status without visual parity", () => {
  const readiness = createKpAnimationCapabilityReadiness();
  for (const capabilityId of [
    "capability.equation.common-denominator-construction",
    "capability.equation.fraction-arithmetic"
  ]) {
    const entry = readiness.entries.find((candidate) =>
      candidate.capabilityId === capabilityId
    );
    assert.equal(entry?.status, "Registered");
    assert.equal(entry?.evidence.gate, "registered-compiler-authority");
  }
  assert.equal(readiness.directIntentEvidence.some(({ operationId }) =>
    operationId === "operation.equation.common-denominator-alignment.v1" ||
    operationId === "operation.equation.like-denominator-combination.v1"
  ), false);
});

test("balanced operations require the governed corpus-backed series path", () => {
  const direct = createKpAnimationCapabilityDirectIntentEvidence().find(
    ({ operationId }) => operationId ===
      "operation.equation.apply-both-sides.v1"
  );
  assert.deepEqual(direct, {
    animationId: "animation.algebra.log-exponent.solve-two-power-x",
    operationId: "operation.equation.apply-both-sides.v1",
    authoringAuthorityId: "authoring.equation.balanced-operation.v1",
    planKind: "equation-transform-series-runtime",
    resolvedAuthorityIds: [
      "operation.equation.apply-both-sides.v1",
      "recipe.equation.balanced-operation.v1"
    ],
    generationCorpusAuthorityIds: [
      "corpus.equation.balanced-operation.v1"
    ],
    sourcePath: "src/authoring/compile-equation-transform-series.ts"
  });
});

test("alternative bases require corpus-backed transform-series authoring", () => {
  const direct = createKpAnimationCapabilityDirectIntentEvidence().find(
    ({ operationId }) => operationId ===
      "operation.equation.change-logarithm-base.v1"
  );
  assert.deepEqual(direct, {
    animationId: "animation.equation.logarithm-change-of-base.v1",
    operationId: "operation.equation.change-logarithm-base.v1",
    authoringAuthorityId: "authoring.equation.logarithm-base.v1",
    planKind: "equation-transform-series-runtime",
    resolvedAuthorityIds: [
      "operation.equation.change-logarithm-base.v1",
      "recipe.equation.change-logarithm-base.v1",
      "motif.equation.logarithm-base-handoff.v1",
      "normalizer.equation.logarithm-base-syntax.v1"
    ],
    generationCorpusAuthorityIds: [
      "corpus.equation.logarithm-base.v1"
    ],
    sourcePath: "src/authoring/compile-equation-transform-series.ts"
  });
});

test("root inversion is direct only through the exact pressure corpus", () => {
  const direct = createKpAnimationCapabilityDirectIntentEvidence().find(
    ({ operationId }) => operationId ===
      "compiler.equation.root-rewrite-plan.v1"
  );
  assert.deepEqual(direct, {
    animationId:
      "animation.algebra.radical.compound-carrier-normalization",
    operationId: "compiler.equation.root-rewrite-plan.v1",
    authoringAuthorityId: "authoring.equation.radical-inversion.v1",
    planKind: "root-rewrite-plan",
    resolvedAuthorityIds: [
      "compiler.equation.root-rewrite-plan.v1",
      "recipe.equation.radical-inversion.v1"
    ],
    generationCorpusAuthorityIds: [
      "corpus.equation.radical-inversion.v1"
    ],
    sourcePath: "src/authoring/root-rewrite-authoring-corpus.ts"
  });
});

test("finite binders are direct only through both callers and governed corpus", () => {
  const direct = createKpAnimationCapabilityDirectIntentEvidence().find(
    ({ operationId }) => operationId ===
      "semantic-operation.finite-binder-expansion-kernel.v1"
  );
  assert.deepEqual(direct, {
    animationId: "animation.equation.finite-sum-expansion.v1",
    operationId: "semantic-operation.finite-binder-expansion-kernel.v1",
    authoringAuthorityId:
      "compiler.authoring.finite-binder-expansion.v1",
    planKind: "finite-binder-authoring-artifact",
    resolvedAuthorityIds: [
      "normalizer.equation.finite-binder-expansion.v1",
      "normalizer.equation.finite-product-pressure.v1",
      "semantic-operation.finite-binder-expansion-kernel.v1",
      "operation.equation.finite-binder-expand.v1",
      "operation.equation.finite-product-expand.v1",
      "recipe.equation.finite-binder-expansion.v1",
      "corpus.equation.finite-binder-expansion.v1"
    ],
    generationCorpusAuthorityIds: [
      "corpus.equation.finite-binder-expansion.v1"
    ],
    requiredCompilerAuthorityIds: [
      "normalizer.equation.finite-binder-expansion.v1",
      "normalizer.equation.finite-product-pressure.v1",
      "semantic-operation.finite-binder-expansion-kernel.v1",
      "operation.equation.finite-binder-expand.v1",
      "operation.equation.finite-product-expand.v1",
      "recipe.equation.finite-binder-expansion.v1",
      "corpus.equation.finite-binder-expansion.v1"
    ],
    sourcePath: "src/authoring/finite-binder-authoring-api.ts"
  });
});

test("direct exposure cannot silently upgrade without exact authority overlap", () => {
  const direct = createKpAnimationCapabilityDirectIntentEvidence().map(
    (evidence) => ({
      ...evidence,
      resolvedAuthorityIds: ["authority.unrelated.v1"]
    })
  );
  const readiness = compileKpAnimationCapabilityReadiness({
    plan: kpAnimationCapabilityPlan,
    assetEvidence: createKpAnimationCapabilityAssetEvidence(),
    compilerEvidence: createKpAnimationCapabilityCompilerEvidence(),
    frontendEvidence: createKpAnimationDomainFrontendEvidence(),
    directIntentEvidence: direct
  });
  assert.equal(readiness.entries.some(({ capabilityId, status: value }) =>
    capabilityId.startsWith("capability.equation.") && value === "Direct"),
  false);
  assert.equal(status(readiness,
    "capability.equation.function-wrapping"), "Registered");
});

test("a concrete asset alone never upgrades beyond exemplar", () => {
  const compilerEvidence = createKpAnimationCapabilityCompilerEvidence();
  const readiness = compileKpAnimationCapabilityReadiness({
    plan: kpAnimationCapabilityPlan,
    assetEvidence: createKpAnimationCapabilityAssetEvidence(),
    compilerEvidence: {
      ...compilerEvidence,
      requirements: compilerEvidence.requirements.map((requirement) =>
        requirement.status === "matched"
          ? {
              capabilityId: requirement.capabilityId,
              requirementId: requirement.requirementId,
              authorityId: requirement.authorityId,
              kind: requirement.kind,
              status: "missing" as const,
              reason: "no-exact-compiler-authority" as const
            }
          : requirement
      )
    },
    frontendEvidence: createKpAnimationDomainFrontendEvidence(),
    directIntentEvidence: createKpAnimationCapabilityDirectIntentEvidence()
  });
  assert.equal(status(readiness,
    "capability.equation.function-wrapping"), "Exemplar");
});

test("readiness is immutable and never mutates authored plan data", () => {
  const before = JSON.stringify(kpAnimationCapabilityPlan);
  const readiness = createKpAnimationCapabilityReadiness();
  assert.equal(JSON.stringify(kpAnimationCapabilityPlan), before);
  assert.equal(Object.isFrozen(readiness), true);
  assert.equal(Object.isFrozen(readiness.entries), true);
  assert.equal("status" in kpAnimationCapabilityPlan.entries[0]!, false);
});

function status(
  readiness: ReturnType<typeof createKpAnimationCapabilityReadiness>,
  capabilityId: string
): string | undefined {
  return readiness.entries.find((entry) =>
    entry.capabilityId === capabilityId)?.status;
}
