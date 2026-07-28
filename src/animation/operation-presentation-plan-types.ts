import type {
  KpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

declare const kpVerifiedOperationPresentationPlanAuthority: unique symbol;

interface KpOperationPresentationPlanDraftBase {
  readonly schemaVersion: "kp.verified-operation-presentation-plan.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly roles: KpOperationPresentationRoles;
}

export type KpInverseCancellationPresentationPlanDraft =
  KpOperationPresentationPlanDraftBase & {
  readonly kind: "inverse-cancellation";
  readonly contactGroupId: string;
  readonly inverseBundleIds: readonly [string, string];
};

/**
 * Every animated operation crosses one nominal, exhaustive boundary. Variants
 * describe semantic presentation structure; measured paths remain compositor
 * output and therefore cannot leak into authored or generated plans.
 */
export type KpOperationPresentationPlanDraft =
  | KpInverseCancellationPresentationPlanDraft
  | (KpOperationPresentationPlanDraftBase & {
      readonly kind: "successor-synthesis" | "factoring";
      readonly fusionGroupId: string;
      readonly resultBundleId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly kind: "synchronized-balanced-introduction" | "distribution";
      readonly branchGroupId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly kind: "fraction-material";
      readonly operation: "fission" | "fusion";
      readonly materialGroupId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly kind: "structural-succession";
      readonly sourceBundleId: string;
      readonly targetBundleId: string;
    });

/**
 * The private authority keeps semantic role assignment behind the trusted
 * planner instead of letting renderers bless convenient local selectors.
 */
export type KpVerifiedOperationPresentationPlan =
  KpOperationPresentationPlanDraft & {
    readonly [kpVerifiedOperationPresentationPlanAuthority]: true;
  };

export type KpVerifiedInverseCancellationPresentationPlan =
  KpInverseCancellationPresentationPlanDraft & {
    readonly [kpVerifiedOperationPresentationPlanAuthority]: true;
  };

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
