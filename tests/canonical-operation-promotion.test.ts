import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpCanonicalOperationPromotion,
  kpRequiredCanonicalOperationPromotionEvidence,
  type KpCanonicalOperationPromotionEvidence,
  type KpCanonicalOperationRegistration
} from "../src/semantic/canonical-operation-promotion.ts";
import { createKpCanonicalOperationSpec } from "../src/semantic/canonical-operation-spec.ts";
import { findKpCanonicalOperationCoreDescriptor } from "../src/semantic/canonical-operation.ts";

const trustedPrimitiveIds = new Set(["persist", "wrap"]);

test("proposed operations remain non-executable even when structurally valid", () => {
  assert.deepEqual(
    checkKpCanonicalOperationPromotion({
      registration: registration("proposed"),
      trustedPrimitiveIds
    }),
    {
      lawId: "canonical-operation.promotion",
      passed: true,
      executionAllowed: false,
      failures: []
    }
  );
});

test("experimental operations execute only through trusted primitives", () => {
  const trusted = checkKpCanonicalOperationPromotion({
    registration: registration("experimental"),
    trustedPrimitiveIds
  });
  const untrusted = checkKpCanonicalOperationPromotion({
    registration: {
      ...registration("experimental"),
      spec: {
        ...operationSpec(),
        motif: [
          ...operationSpec().motif,
          {
            id: "custom.teleport",
            primitiveId: "teleport",
            phaseId: "wrapper-enter",
            sourceRoleIds: ["content-before"],
            targetRoleIds: ["content-after"],
            summary: "An unreviewed primitive."
          }
        ]
      }
    },
    trustedPrimitiveIds
  });

  assert.equal(trusted.passed, true);
  assert.equal(trusted.executionAllowed, true);
  assert.equal(untrusted.passed, false);
  assert.equal(untrusted.executionAllowed, false);
  assert.deepEqual(untrusted.failures, [{
    path: "spec.motif",
    message:
      "Operation project.demo.wrap.v1 uses untrusted primitive teleport; it must remain proposal-only."
  }]);
});

test("promotion requires complete review and conformance evidence", () => {
  const incomplete = checkKpCanonicalOperationPromotion({
    registration: registration("promoted", evidence().slice(0, 2)),
    trustedPrimitiveIds
  });
  const complete = checkKpCanonicalOperationPromotion({
    registration: registration("promoted", evidence()),
    trustedPrimitiveIds
  });

  assert.equal(incomplete.executionAllowed, false);
  assert.deepEqual(
    incomplete.failures.map((failure) => failure.message),
    [
      "Promoted operation project.demo.wrap.v1 is missing continuity evidence.",
      "Promoted operation project.demo.wrap.v1 is missing rewind evidence.",
      "Promoted operation project.demo.wrap.v1 is missing accessibility evidence.",
      "Promoted operation project.demo.wrap.v1 is missing human-review evidence."
    ]
  );
  assert.deepEqual(complete, {
    lawId: "canonical-operation.promotion",
    passed: true,
    executionAllowed: true,
    failures: []
  });
});

function registration(
  status: KpCanonicalOperationRegistration["status"],
  promotionEvidence: readonly KpCanonicalOperationPromotionEvidence[] = []
): KpCanonicalOperationRegistration {
  return { spec: operationSpec(), status, evidence: promotionEvidence };
}

function evidence(): readonly KpCanonicalOperationPromotionEvidence[] {
  return kpRequiredCanonicalOperationPromotionEvidence.map((kind) => ({
    kind,
    sourceRef: `evidence/${kind}.json`,
    summary: `${kind} passed.`
  }));
}

function operationSpec() {
  const core = findKpCanonicalOperationCoreDescriptor("kp.core.wrap");
  const phases = ["content-persist", "wrapper-enter"];
  return createKpCanonicalOperationSpec({
    id: "project.demo.wrap.v1",
    pack: { packId: "project.demo", version: "0.1.0" },
    canonicalOperationId: core.id,
    title: "Demo wrap",
    summary: core.summary,
    roles: core.roles,
    sourcePattern: {
      id: "source",
      rootRoleId: "content-before",
      requiredRoleIds: ["content-before"],
      summary: "Unwrapped content."
    },
    targetPattern: {
      id: "target",
      rootRoleId: "content-after",
      requiredRoleIds: ["content-after", "wrapper"],
      summary: "Wrapped content."
    },
    invariants: [{
      id: "content-persists",
      kind: "preservation",
      roleIds: ["content-before", "content-after"],
      summary: "Content identity persists."
    }],
    lineage: [{
      id: "content-lineage",
      relation: "role-change",
      sourceRoleIds: ["content-before"],
      targetRoleIds: ["content-after"],
      summary: "Content becomes enclosed."
    }],
    motif: [
      {
        id: "content-persist",
        primitiveId: "persist",
        phaseId: phases[0]!,
        sourceRoleIds: ["content-before"],
        targetRoleIds: ["content-after"],
        summary: "Keep content visible."
      },
      {
        id: "wrapper-enter",
        primitiveId: "wrap",
        phaseId: phases[1]!,
        sourceRoleIds: [],
        targetRoleIds: ["wrapper"],
        summary: "Introduce wrapper."
      }
    ],
    examples: [
      {
        id: "positive",
        kind: "positive",
        roleBindings: {
          "content-before": "x",
          "content-after": "x",
          wrapper: "f"
        },
        expected: "accepted",
        summary: "Wrap x."
      },
      {
        id: "counterexample",
        kind: "counterexample",
        roleBindings: {
          "content-before": "x",
          "content-after": "y",
          wrapper: "f"
        },
        expected: "rejected",
        summary: "Replacement is not wrapping."
      }
    ],
    rewind: { operationId: "kp.core.unwrap", preservesPhaseIds: phases },
    accessibility: ["full-motion", "reduced-motion", "static", "narrated"].map((mode) => ({
      mode: mode as "full-motion" | "reduced-motion" | "static" | "narrated",
      preservesPhaseIds: phases,
      summary: `${mode} preserves phases.`
    }))
  });
}
