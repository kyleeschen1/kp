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

/** Renderer-neutral intent; physical pose evidence remains renderer-owned. */
export interface KpAdjacentPhaseEquivalentPoseSeamIntent {
  readonly schemaVersion: "kp.adjacent-phase-equivalent-pose-seam.v1";
  readonly id: string;
  readonly fromPhaseId: string;
  readonly toPhaseId: string;
  readonly topology: "paint-equivalent-pose";
  readonly identity: "semantic-leaf";
  readonly ownership: "exclusive";
}

export function createKpAdjacentPhaseEquivalentPoseSeamIntent(input: {
  readonly id: string;
  readonly fromPhaseId: string;
  readonly toPhaseId: string;
}): KpAdjacentPhaseEquivalentPoseSeamIntent {
  for (const [label, value] of Object.entries(input)) {
    if (value.trim() === "") {
      throw new Error(`Adjacent-phase seam ${label} must not be empty.`);
    }
  }
  if (input.fromPhaseId === input.toPhaseId) {
    throw new Error("Adjacent-phase seam must connect distinct phases.");
  }
  return Object.freeze({
    schemaVersion: "kp.adjacent-phase-equivalent-pose-seam.v1",
    ...input,
    topology: "paint-equivalent-pose",
    identity: "semantic-leaf",
    ownership: "exclusive"
  });
}
