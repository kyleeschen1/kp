import type {
  KpExplicitStaticCheckpointPlan,
  KpVerifiedInverseCancellationPresentationPlan,
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
  kind: "inverse-cancellation",
  roles,
  contactGroupId: "group.contact",
  inverseBundleIds: ["bundle.left", "bundle.right"]
};

const incompleteCancellation: KpVerifiedInverseCancellationPresentationPlan = {
  schemaVersion: "kp.verified-operation-presentation-plan.v1",
  id: "plan.incomplete",
  transformationId: "transform.incomplete",
  kind: "inverse-cancellation",
  roles,
  contactGroupId: "group.contact",
  // @ts-expect-error Cancellation always has exactly two inverse bundles.
  inverseBundleIds: ["bundle.only"]
};

declare const verified: KpVerifiedOperationPresentationPlan;

if (verified.kind === "factoring") {
  verified.resultBundleId;
  // @ts-expect-error Factoring cannot be dispatched as a branch plan.
  verified.branchGroupId;
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
