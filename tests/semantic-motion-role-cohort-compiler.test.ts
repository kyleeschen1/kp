import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionRoleCohorts,
  isKpVerifiedSemanticMotionRoleCohorts
} from "../src/domain-ir/public-api.ts";
import {
  cancellationSemanticMotionStructureContract,
  createCancellationSemanticMotionFixture,
  createDistributionSemanticMotionFixture,
  createQuotientSemanticMotionFixture,
  distributionSemanticMotionStructureContract,
  quotientSemanticMotionStructureContract
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("quotient distribution and cancellation close roles cohorts and attachments without shared geometry", () => {
  const cases = [
    [createQuotientSemanticMotionFixture(), quotientSemanticMotionStructureContract()],
    [createDistributionSemanticMotionFixture(), distributionSemanticMotionStructureContract()],
    [createCancellationSemanticMotionFixture(), cancellationSemanticMotionStructureContract()]
  ] as const;
  const variants: string[] = [];
  for (const [fixture, contract] of cases) {
    const result = compileKpSemanticMotionRoleCohorts({
      request: fixture.request,
      lifecycle: fixture.lifecycle,
      contract
    });
    assert.equal(result.status, "verified", fixture.request.id);
    if (result.status !== "verified") continue;
    assert.equal(isKpVerifiedSemanticMotionRoleCohorts(result.structure), true);
    variants.push(...result.structure.cohorts.map(({ cohesion }) => cohesion.variantId));
  }
  assert.ok(new Set(variants).size >= 3);
});

test("missing attachments duplicate cohorts bad cardinality and foreign roles fail closed", () => {
  const fixture = createDistributionSemanticMotionFixture();
  const contract = distributionSemanticMotionStructureContract();
  const result = compileKpSemanticMotionRoleCohorts({
    request: {
      ...fixture.request,
      operation: {
        ...fixture.request.operation,
        roleBindings: {
          ...fixture.request.operation.roleBindings,
          "source-factor": [],
          foreign: ["entity.foreign"]
        }
      }
    },
    lifecycle: fixture.lifecycle,
    contract: {
      ...contract,
      cohorts: [...contract.cohorts, contract.cohorts[0]!],
      attachments: []
    }
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  const codes = new Set(result.issues.map(({ code }) => code));
  ([
    "semantic-motion.structure.unknown-role",
    "semantic-motion.structure.role-cardinality",
    "semantic-motion.structure.duplicate-cohort",
    "semantic-motion.structure.cohort-closure",
    "semantic-motion.structure.attachment-closure"
  ] as const).forEach((code) => assert.equal(codes.has(code), true, code));
});

test("structural copies cannot retain role and cohort authority", () => {
  const fixture = createQuotientSemanticMotionFixture();
  const result = compileKpSemanticMotionRoleCohorts({
    request: fixture.request,
    lifecycle: fixture.lifecycle,
    contract: quotientSemanticMotionStructureContract()
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(
    isKpVerifiedSemanticMotionRoleCohorts(structuredClone(result.structure)),
    false
  );
});
