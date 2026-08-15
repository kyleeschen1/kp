import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionRoleCohorts,
  isKpVerifiedSemanticMotionRoleCohorts,
  type KpSemanticMotionOperationStructureContract
} from "../src/domain-ir/public-api.ts";
import {
  createCancellationSemanticMotionFixture,
  createDistributionSemanticMotionFixture,
  createQuotientSemanticMotionFixture
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("quotient distribution and cancellation close roles cohorts and attachments without shared geometry", () => {
  const cases = [
    [createQuotientSemanticMotionFixture(), quotientContract()],
    [createDistributionSemanticMotionFixture(), distributionContract()],
    [createCancellationSemanticMotionFixture(), cancellationContract()]
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
  const contract = distributionContract();
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
  [
    "semantic-motion.structure.unknown-role",
    "semantic-motion.structure.role-cardinality",
    "semantic-motion.structure.duplicate-cohort",
    "semantic-motion.structure.cohort-closure",
    "semantic-motion.structure.attachment-closure"
  ].forEach((code) => assert.equal(codes.has(code), true, code));
});

test("structural copies cannot retain role and cohort authority", () => {
  const fixture = createQuotientSemanticMotionFixture();
  const result = compileKpSemanticMotionRoleCohorts({
    request: fixture.request,
    lifecycle: fixture.lifecycle,
    contract: quotientContract()
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(
    isKpVerifiedSemanticMotionRoleCohorts(structuredClone(result.structure)),
    false
  );
});

function quotientContract(): KpSemanticMotionOperationStructureContract {
  return {
    operationId: "kp.semantic-motion.quotient",
    roles: [
      role("source-operators", "one-or-more", "operator", "required"),
      role("source-arguments", "one-or-more", "material", "none"),
      role("target-operator", "exactly-one", "operator", "required"),
      role("target-arguments", "one-or-more", "material", "none")
    ],
    cohorts: [
      cohort("cohort.quotient.operator-fusion", ["source-operators", "target-operator"], "log-application-fusion"),
      cohort("cohort.quotient.arguments", ["source-arguments", "target-arguments"], "quotient-argument-role-change")
    ],
    attachments: [
      attachment("attachment.source-operators", "operator-argument", ["source-arguments"], ["source-operators"]),
      attachment("attachment.target-operator", "operator-argument", ["target-arguments"], ["target-operator"])
    ]
  };
}

function distributionContract(): KpSemanticMotionOperationStructureContract {
  return {
    operationId: "kp.semantic-motion.distribution",
    roles: [
      role("source-factor", "exactly-one", "material", "none"),
      role("factor-copies", "one-or-more", "material", "none"),
      role("source-addends", "one-or-more", "material", "none"),
      role("target-addends", "one-or-more", "material", "none"),
      role("connector", "one-or-more", "punctuation", "required")
    ],
    cohorts: [
      cohort("cohort.distribution.factors", ["source-factor", "factor-copies"], "ordered-factor-fan-out"),
      cohort("cohort.distribution.addends", ["source-addends", "target-addends"], "ordered-addend-continuity"),
      cohort("cohort.distribution.connector", ["connector"], "connector-axis-local")
    ],
    attachments: [
      attachment("attachment.distribution.connector", "connector-between", ["target-addends"], ["connector"])
    ]
  };
}

function cancellationContract(): KpSemanticMotionOperationStructureContract {
  return {
    operationId: "kp.semantic-motion.cancellation",
    roles: [
      role("inverse-pair", "one-or-more", "operator", "required"),
      role("source-survivors", "one-or-more", "material", "none"),
      role("target-survivors", "one-or-more", "material", "none")
    ],
    cohorts: [
      cohort("cohort.cancellation.inverse-pair", ["inverse-pair"], "inverse-shared-contact"),
      cohort("cohort.cancellation.survivors", ["source-survivors", "target-survivors"], "survivor-compaction-local")
    ],
    attachments: [
      attachment("attachment.cancellation.signs", "sign-term", ["source-survivors"], ["inverse-pair"])
    ]
  };
}

function role(
  id: string,
  cardinality: "exactly-one" | "one-or-more",
  participation: "material" | "operator" | "punctuation",
  attachmentValue: "required" | "none"
) {
  return { id, cardinality, participation, attachment: attachmentValue } as const;
}

function cohort(id: string, memberRoleIds: readonly string[], variantId: string) {
  return { id, memberRoleIds, cohesion: { scope: "family-local" as const, variantId } };
}

function attachment(
  id: string,
  kind: "operator-argument" | "connector-between" | "sign-term",
  anchorRoleIds: readonly string[],
  attachedRoleIds: readonly string[]
) {
  return { id, kind, anchorRoleIds, attachedRoleIds };
}
