import type {
  KpExplicitStaticCheckpointPlan,
  KpInverseCancellationPresentationPlanDraft,
  KpVerifiedOperationPresentationPlan
} from "../../src/animation/operation-presentation-plan-types.ts";
import type {
  KpOperationPresentationRoles
} from "../../src/animation/operation-presentation-roles.ts";

declare const roles: KpOperationPresentationRoles;

// @ts-expect-error Only the trusted planner can mint a verified plan.
const fabricated: KpVerifiedOperationPresentationPlan = {
  schemaVersion: "kp.verified-operation-presentation-plan.v1",
  id: "plan.fabricated",
  transformationId: "transform.fabricated",
  planKind: "inverse-cancellation",
  roles,
  contactGroupId: "group.contact",
  inverseBundleIds: ["bundle.left", "bundle.right"]
};

const incompleteCancellation: KpInverseCancellationPresentationPlanDraft = {
  schemaVersion: "kp.verified-operation-presentation-plan.v1",
  id: "plan.incomplete",
  transformationId: "transform.incomplete",
  planKind: "inverse-cancellation",
  roles,
  contactGroupId: "group.contact",
  // @ts-expect-error Cancellation always has exactly two inverse bundles.
  inverseBundleIds: ["bundle.only"]
};

declare const verified: KpVerifiedOperationPresentationPlan;

if (verified.planKind === "factoring") {
  verified.resultBundleId;
  // @ts-expect-error Factoring cannot be dispatched as a branch plan.
  verified.branchGroupId;
}

if (verified.planKind === "fraction-material") {
  verified.materialGroupId;
  // @ts-expect-error Fraction material is not structural succession.
  verified.sourceBundleId;
}

if (verified.planKind === "structural-succession") {
  verified.sourceBundleId;
  verified.targetBundleId;
  // @ts-expect-error Structural succession has no temporal material group.
  verified.materialGroupId;
}

declare const staticCheckpoint: KpExplicitStaticCheckpointPlan;

// @ts-expect-error An explicit static checkpoint is never an animated plan.
const promotedStatic: KpVerifiedOperationPresentationPlan = staticCheckpoint;

void [
  fabricated,
  incompleteCancellation,
  verified,
  promotedStatic
];
