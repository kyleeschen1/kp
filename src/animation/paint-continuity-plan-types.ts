import type {
  KpVerifiedOperationPresentationPlanId
} from "./operation-presentation-plan-authority.ts";

declare const kpVerifiedPaintContinuityPlanAuthority: unique symbol;

export type KpPaintContinuityTransferTopology =
  | "paint-equivalent-pose"
  | "bounded-semantic-contact-co-presence"
  | "shared-zero-area-junction";

export type KpNonEmptyPaintBundleIds =
  readonly [string, ...string[]];

export interface KpPaintContinuityCarrierDraft {
  readonly lineageId: string;
  readonly sourceBundleIds: KpNonEmptyPaintBundleIds;
  readonly targetBundleIds: KpNonEmptyPaintBundleIds;
  readonly transferTopology: KpPaintContinuityTransferTopology;
}

/**
 * This draft contains only semantic paint ownership. In particular, opacity,
 * paths, coordinates, keyframes, and transfer timing are absent so a caller
 * cannot recreate the binary handoff that caused endpoint flicker.
 */
export interface KpPaintContinuityPlanDraft {
  readonly schemaVersion: "kp.paint-continuity-plan.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly operationPresentationPlanId:
    KpVerifiedOperationPresentationPlanId;
  readonly ownership: "exclusive-continuous-carrier";
  readonly carriers: readonly KpPaintContinuityCarrierDraft[];
  readonly endpointSettlement: "native-source-and-target";
  readonly nonZeroPaint: "opaque";
}

/**
 * Only the continuity validator may mint this authority. Renderers can consume
 * it, but serialized plans and local exemplars cannot fabricate executable
 * paint ownership by structural typing.
 */
export type KpVerifiedPaintContinuityPlan =
  KpPaintContinuityPlanDraft & {
    readonly [kpVerifiedPaintContinuityPlanAuthority]: true;
  };
