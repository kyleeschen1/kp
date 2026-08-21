import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpAnimationDomainFrontendCandidates,
  createKpAnimationDomainFrontendCandidates,
  kpCodeFrontendProofObligations,
  type KpAnimationDomainFrontendCandidate
} from "../src/architecture/animation-domain-frontend-candidates.ts";
import { createKpAnimationDomainFrontendEvidence } from
  "../src/architecture/animation-domain-frontend-evidence.ts";
import { createKpAnimationCapabilityReadiness } from
  "../src/architecture/animation-capability-readiness.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";

test("TypeScript and Python are exact build-time candidates with full obligations", () => {
  const registry = createKpAnimationDomainFrontendCandidates();
  assert.deepEqual(registry.candidates.map((candidate) => ({
    status: candidate.status,
    authorityId: candidate.authorityId,
    capabilityId: candidate.capabilityId,
    language: candidate.language,
    entrypoint: candidate.buildTimeEntrypoint,
    runtimeBoundary: candidate.runtimeBoundary
  })), [{
    status: "candidate",
    authorityId: "frontend.code.typescript-compiler.v1",
    capabilityId: "capability.code.typescript-refactoring",
    language: "typescript",
    entrypoint: "scripts/typescript-refactor-frontend.ts",
    runtimeBoundary: "generated-plain-data-only"
  }, {
    status: "candidate",
    authorityId: "frontend.code.python-ast.v1",
    capabilityId: "capability.code.python-refactoring",
    language: "python",
    entrypoint: "scripts/python-refactor-frontend.ts",
    runtimeBoundary: "generated-plain-data-only"
  }]);
  registry.candidates.forEach((candidate) => {
    assert.deepEqual(candidate.proofObligations, kpCodeFrontendProofObligations);
    assert.equal(Object.isFrozen(candidate), true);
  });
});

test("candidate registration grants neither evidence nor readiness", () => {
  createKpAnimationDomainFrontendCandidates();
  const evidence = createKpAnimationDomainFrontendEvidence();
  const readiness = createKpAnimationCapabilityReadiness();

  for (const capabilityId of [
    "capability.code.typescript-refactoring",
    "capability.code.python-refactoring"
  ]) {
    assert.equal(
      evidence.requirements.find((entry) =>
        entry.capabilityId === capabilityId
      )?.status,
      "missing"
    );
    assert.equal(
      readiness.entries.find((entry) =>
        entry.capabilityId === capabilityId
      )?.status,
      "Exemplar"
    );
  }
});

test("candidate compiler rejects mismatched and incomplete declarations", () => {
  const [typescript] = createKpAnimationDomainFrontendCandidates().candidates;
  assert.ok(typescript);
  const mismatched = {
    ...typescript,
    authorityId: "frontend.code.python-ast.v1"
  } satisfies KpAnimationDomainFrontendCandidate;
  assert.throws(() => compileKpAnimationDomainFrontendCandidates({
    plan: kpAnimationCapabilityPlan,
    candidates: [mismatched]
  }), (error: unknown) => {
    assert.deepEqual(
      diagnostics(error),
      ["frontend-candidate.authority-mismatch"]
    );
    return true;
  });

  const incomplete = {
    ...typescript,
    proofObligations: kpCodeFrontendProofObligations.slice(0, -1)
  } satisfies KpAnimationDomainFrontendCandidate;
  assert.throws(() => compileKpAnimationDomainFrontendCandidates({
    plan: kpAnimationCapabilityPlan,
    candidates: [incomplete]
  }), (error: unknown) => {
    assert.deepEqual(
      diagnostics(error),
      ["frontend-candidate.proof-obligations-incomplete"]
    );
    return true;
  });
});

function diagnostics(error: unknown): readonly string[] {
  return typeof error === "object" && error !== null &&
    "diagnostics" in error && Array.isArray(error.diagnostics)
    ? error.diagnostics.map((diagnostic: any) => diagnostic.code)
    : [];
}

