import type {
  KpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

declare const kpVerifiedOperationPresentationPlanAuthority: unique symbol;

interface KpVerifiedOperationPresentationPlanBase {
  readonly schemaVersion: "kp.verified-operation-presentation-plan.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly roles: KpOperationPresentationRoles;
  /**
   * The private authority keeps semantic role assignment behind the trusted
   * planner instead of letting renderers bless convenient local selectors.
   */
  readonly [kpVerifiedOperationPresentationPlanAuthority]: true;
}

export type KpVerifiedInverseCancellationPresentationPlan =
  KpVerifiedOperationPresentationPlanBase & {
  readonly kind: "inverse-cancellation";
  readonly contactGroupId: string;
  readonly inverseBundleIds: readonly [string, string];
};

/**
 * Every animated operation crosses one nominal, exhaustive boundary. Variants
 * describe semantic presentation structure; measured paths remain compositor
 * output and therefore cannot leak into authored or generated plans.
 */
export type KpVerifiedOperationPresentationPlan =
  | KpVerifiedInverseCancellationPresentationPlan
  | (KpVerifiedOperationPresentationPlanBase & {
      readonly kind: "successor-synthesis" | "factoring";
      readonly fusionGroupId: string;
      readonly resultBundleId: string;
    })
  | (KpVerifiedOperationPresentationPlanBase & {
      readonly kind: "synchronized-balanced-introduction" | "distribution";
      readonly branchGroupId: string;
    })
  | (KpVerifiedOperationPresentationPlanBase & {
      readonly kind: "fraction-material";
      readonly operation: "fission" | "fusion";
      readonly materialGroupId: string;
    })
  | (KpVerifiedOperationPresentationPlanBase & {
      readonly kind: "structural-succession";
      readonly sourceBundleId: string;
      readonly targetBundleId: string;
    });

export type KpExplicitStaticCheckpointReason =
  | "intentional-static"
  | "unsupported-presentation"
  | "missing-verified-plan";

/**
 * Static is an explicit, inspectable outcome rather than a weak animated plan.
 * It is deliberately not part of KpVerifiedOperationPresentationPlan, so
 * promotion and compositor APIs cannot confuse fallback with conformance.
 */
export interface KpExplicitStaticCheckpointPlan {
  readonly schemaVersion: "kp.explicit-static-checkpoint-plan.v1";
  readonly kind: "explicit-static-checkpoint";
  readonly id: string;
  readonly transformationId: string;
  readonly reason: KpExplicitStaticCheckpointReason;
  readonly summary: string;
}

export type KpOperationPresentationDecision =
  | KpVerifiedOperationPresentationPlan
  | KpExplicitStaticCheckpointPlan;
