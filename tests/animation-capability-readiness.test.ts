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

test("readiness derives the four exact direct generation capabilities", () => {
  const readiness = createKpAnimationCapabilityReadiness();
  const direct = readiness.entries.filter(({ status }) => status === "Direct");
  assert.deepEqual(direct.map(({ capabilityId }) => capabilityId), [
    "capability.equation.function-wrapping",
    "capability.equation.distribution",
    "capability.equation.additive-cancellation",
    "capability.equation.log-homomorphic-decomposition"
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
    "capability.equation.alternative-logarithm-bases"), "Missing");
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
    directIntentEvidence: direct
  });
  assert.equal(readiness.entries.some(({ status: value }) =>
    value === "Direct"), false);
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
