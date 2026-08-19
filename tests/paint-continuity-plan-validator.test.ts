import assert from "node:assert/strict";
import test from "node:test";

import {
  operationPresentationPlanAuthorityId,
  type KpVerifiedOperationPresentationPlan
} from "../src/animation/operation-presentation-plan-types.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "../src/animation/operation-presentation-plan-validator.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "../src/animation/operation-presentation-roles.ts";
import {
  createKpAdjacentPhaseEquivalentPoseSeamIntent,
  type KpPaintContinuityPlanDraft
} from "../src/animation/paint-continuity-plan-types.ts";
import {
  validateAndMintKpPaintContinuityPlan
} from "../src/animation/paint-continuity-plan-validator.ts";

test("adjacent-phase seam intent is renderer-neutral and immutable", () => {
  const intent = createKpAdjacentPhaseEquivalentPoseSeamIntent({
    id: "seam.stage-to-join",
    fromPhaseId: "phase.stage-unit-factor",
    toPhaseId: "phase.join-equivalent-fraction"
  });
  assert.equal(intent.topology, "paint-equivalent-pose");
  assert.equal(intent.identity, "semantic-leaf");
  assert.equal(intent.ownership, "exclusive");
  assert.equal(Object.isFrozen(intent), true);
  assert.deepEqual(Object.keys(intent).sort(), [
    "fromPhaseId",
    "id",
    "identity",
    "ownership",
    "schemaVersion",
    "toPhaseId",
    "topology"
  ]);
});

function operationPlan(): KpVerifiedOperationPresentationPlan {
  const left = createKpOperationPresentationBundle({
    id: "bundle.left",
    role: "source-material",
    semanticEntityIds: ["selector.left"]
  });
  const operator = createKpOperationPresentationBundle({
    id: "bundle.operator",
    role: "catalyst",
    semanticEntityIds: ["selector.operator"]
  });
  const right = createKpOperationPresentationBundle({
    id: "bundle.right",
    role: "source-material",
    semanticEntityIds: ["selector.right"]
  });
  const target = createKpOperationPresentationBundle({
    id: "bundle.target",
    role: "target-material",
    semanticEntityIds: ["selector.target"]
  });
  const fusion = createKpOperationPresentationGroup({
    id: "group.fusion",
    groupKind: "fusion",
    bundleIds: [left.id, right.id, target.id]
  });
  const result = validateAndMintKpOperationPresentationPlan({
    draft: {
      schemaVersion: "kp.verified-operation-presentation-plan.v1",
      id: "plan.sum",
      transformationId: "transform.sum",
      planKind: "successor-synthesis",
      roles: createKpOperationPresentationRoles({
        bundles: [left, operator, right, target],
        groups: [fusion]
      }),
      fusionGroupId: fusion.id,
      resultBundleId: target.id
    },
    expectedSelectorIds: [
      "selector.left",
      "selector.operator",
      "selector.right",
      "selector.target"
    ]
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") {
    throw new Error("Fixture operation plan did not verify.");
  }
  return result.plan;
}

function draft(
  plan: KpVerifiedOperationPresentationPlan
): KpPaintContinuityPlanDraft {
  return {
    schemaVersion: "kp.paint-continuity-plan.v1",
    id: "paint-continuity.sum",
    transformationId: plan.transformationId,
    operationPresentationPlanId: operationPresentationPlanAuthorityId(plan),
    ownership: "exclusive-continuous-carrier",
    carriers: [{
      lineageId: "lineage.sum",
      sourceBundleIds: ["bundle.left", "bundle.right"],
      targetBundleIds: ["bundle.target"],
      transferTopology: "shared-zero-area-junction"
    }],
    endpointSettlement: "native-source-and-target",
    nonZeroPaint: "opaque"
  };
}

test("trusted continuity validator mints immutable total ownership", () => {
  const plan = operationPlan();
  const result = validateAndMintKpPaintContinuityPlan({
    draft: draft(plan),
    operationPlan: plan
  });

  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(result.plan.ownership, "exclusive-continuous-carrier");
  assert.equal(Object.isFrozen(result.plan), true);
  assert.equal(Object.isFrozen(result.plan.carriers), true);
  assert.equal(Object.isFrozen(result.plan.carriers[0]!.sourceBundleIds), true);
});

test("continuity mint rejects hard swaps even after an unsafe cast", () => {
  const plan = operationPlan();
  const unsafe = {
    ...draft(plan),
    carriers: [{
      ...draft(plan).carriers[0]!,
      transferTopology: "binary-paint-swap"
    }]
  } as unknown as KpPaintContinuityPlanDraft;
  const result = validateAndMintKpPaintContinuityPlan({
    draft: unsafe,
    operationPlan: plan
  });

  assert.equal(result.status, "invalid");
  if (result.status === "invalid") {
    assert.ok(result.issues.some(({ code }) =>
      code === "carrier.invalid-topology"
    ));
  }
});

test("continuity mint rejects missing duplicated foreign and catalyst material", () => {
  const plan = operationPlan();
  const baseline = draft(plan);
  const result = validateAndMintKpPaintContinuityPlan({
    draft: {
      ...baseline,
      carriers: [
        {
          lineageId: "lineage.one",
          sourceBundleIds: ["bundle.left", "bundle.operator"],
          targetBundleIds: ["bundle.target"],
          transferTopology: "shared-zero-area-junction"
        },
        {
          lineageId: "lineage.two",
          sourceBundleIds: ["bundle.left", "bundle.foreign"],
          targetBundleIds: ["bundle.target"],
          transferTopology: "shared-zero-area-junction"
        }
      ]
    },
    operationPlan: plan
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  const codes = new Set(result.issues.map(({ code }) => code));
  assert.ok(codes.has("carrier.catalyst-contribution"));
  assert.ok(codes.has("carrier.foreign-bundle"));
  assert.ok(codes.has("carrier.ambiguous-bundle"));
  assert.ok(codes.has("carrier.missing-material"));
});

test("equivalent-pose transfer is one-to-one and authority must match", () => {
  const plan = operationPlan();
  const baseline = draft(plan);
  const result = validateAndMintKpPaintContinuityPlan({
    draft: {
      ...baseline,
      transformationId: "transform.foreign",
      carriers: [{
        ...baseline.carriers[0]!,
        transferTopology: "paint-equivalent-pose"
      }]
    },
    operationPlan: plan
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.ok(result.issues.some(({ code }) =>
    code === "plan.authority-mismatch"
  ));
  assert.ok(result.issues.some(({ code }) =>
    code === "carrier.invalid-topology"
  ));
});
