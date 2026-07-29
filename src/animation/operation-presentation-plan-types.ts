import type {
  KpOperationPresentationRoles
} from "./operation-presentation-roles.ts";
import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import type {
  KpVerifiedOperationPresentationPlanId
} from "./operation-presentation-plan-authority.ts";
export type {
  KpVerifiedOperationPresentationPlanId
} from "./operation-presentation-plan-authority.ts";

declare const kpVerifiedOperationPresentationPlanAuthority: unique symbol;
const registeredOperationPlans =
  new WeakMap<object, KpVerifiedOperationPresentationPlan>();

interface KpOperationPresentationPlanDraftBase {
  readonly schemaVersion: "kp.verified-operation-presentation-plan.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly roles: KpOperationPresentationRoles;
}

export type KpInverseCancellationPresentationPlanDraft =
  KpOperationPresentationPlanDraftBase & {
  readonly planKind: "inverse-cancellation";
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
      readonly planKind: "successor-synthesis";
      readonly fusionGroupId: string;
      readonly resultBundleId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly planKind: "factoring";
      readonly fusionGroupId: string;
      readonly resultBundleId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly planKind: "synchronized-balanced-introduction";
      readonly branchGroupId: string;
    })
  // Keep structurally similar variants separate: planKind must narrow the
  // verified authority before a renderer can execute family-specific roles.
  | (KpOperationPresentationPlanDraftBase & {
      readonly planKind: "distribution";
      readonly branchGroupId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly planKind: "fraction-material";
      readonly operation: "fission" | "fusion";
      readonly materialGroupId: string;
    })
  | (KpOperationPresentationPlanDraftBase & {
      readonly planKind: "structural-succession";
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

export type KpVerifiedDistributionPresentationPlan =
  KpVerifiedOperationPresentationPlan & {
    readonly planKind: "distribution";
  };

export type KpVerifiedFactoringPresentationPlan =
  KpVerifiedOperationPresentationPlan & {
    readonly planKind: "factoring";
  };

/**
 * Trusted projection registers a verified plan once per transformation
 * identity. A private weak map avoids recompilation without serializing
 * executable presentation authority into the semantic transformation.
 */
export function registerKpOperationPresentationPlan(
  transformation: KpSemanticTransformation,
  plan: KpVerifiedOperationPresentationPlan
): void {
  if (plan.transformationId !== transformation.id) {
    throw new Error(
      `Operation plan ${plan.id} does not authorize ${transformation.id}.`
    );
  }
  registeredOperationPlans.set(transformation, plan);
}

export function findKpRegisteredOperationPresentationPlan(
  transformation: KpSemanticTransformation
): KpVerifiedOperationPresentationPlan | undefined {
  return registeredOperationPlans.get(transformation);
}

export function operationPresentationPlanAuthorityId(
  plan: KpVerifiedOperationPresentationPlan
): KpVerifiedOperationPresentationPlanId {
  // The cast is safe only because the input already carries the validator's
  // private plan authority; raw ids never cross this function's boundary.
  return plan.id as KpVerifiedOperationPresentationPlanId;
}

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

export type KpAnimatedPresentationCoverage =
  | "verified-animated"
  | "contains-explicit-static"
  | "incomplete";

export function createKpExplicitStaticCheckpointPlan(input: {
  readonly transformationId: string;
  readonly reason: KpExplicitStaticCheckpointReason;
  readonly summary: string;
}): KpExplicitStaticCheckpointPlan {
  if (
    input.transformationId.trim().length === 0 ||
    input.summary.trim().length === 0
  ) {
    throw new Error(
      "Explicit static checkpoint requires a transformation id and summary."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.explicit-static-checkpoint-plan.v1",
    kind: "explicit-static-checkpoint",
    id: `static-checkpoint.${input.transformationId}`,
    transformationId: input.transformationId,
    reason: input.reason,
    summary: input.summary
  });
}
