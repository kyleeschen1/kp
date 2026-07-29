import type {
  KpPaintContinuityPlanDraft,
  KpVerifiedPaintContinuityPlan
} from "../../src/animation/paint-continuity-plan-types.ts";
import type {
  KpVerifiedOperationPresentationPlanId
} from "../../src/animation/operation-presentation-plan-authority.ts";

declare const operationPlanId: KpVerifiedOperationPresentationPlanId;

const legalDraft: KpPaintContinuityPlanDraft = {
  schemaVersion: "kp.paint-continuity-plan.v1",
  id: "paint-continuity.legal",
  transformationId: "transform.legal",
  operationPresentationPlanId: operationPlanId,
  ownership: "exclusive-continuous-carrier",
  carriers: [{
    lineageId: "lineage.material",
    sourceBundleIds: ["bundle.source"],
    targetBundleIds: ["bundle.target"],
    transferTopology: "shared-zero-area-junction"
  }],
  endpointSettlement: "native-source-and-target",
  nonZeroPaint: "opaque"
};

// @ts-expect-error Only the trusted validator can mint executable authority.
const fabricated: KpVerifiedPaintContinuityPlan = legalDraft;

const hardSwap: KpPaintContinuityPlanDraft = {
  ...legalDraft,
  carriers: [{
    ...legalDraft.carriers[0]!,
    // @ts-expect-error A binary paint swap is not a legal ownership topology.
    transferTopology: "binary-paint-swap"
  }]
};

const callerOpacity: KpPaintContinuityPlanDraft = {
  ...legalDraft,
  // @ts-expect-error Callers cannot author opacity policy.
  opacity: 0
};

const callerPath: KpPaintContinuityPlanDraft = {
  ...legalDraft,
  // @ts-expect-error Callers cannot author measured path policy.
  pathFamily: "arc-below"
};

declare const verified: KpVerifiedPaintContinuityPlan;

// @ts-expect-error Renderers cannot recover a caller-authored handoff instant.
verified.handoffProgress;

void [
  legalDraft,
  fabricated,
  hardSwap,
  callerOpacity,
  callerPath,
  verified
];
