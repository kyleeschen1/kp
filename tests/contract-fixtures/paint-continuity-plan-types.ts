import type {
  KpPaintContinuityPlanDraft,
  KpVerifiedPaintContinuityPlan
} from "../../src/animation/paint-continuity-plan-types.ts";
import type {
  KpVerifiedOperationPresentationPlanId
} from "../../src/animation/operation-presentation-plan-authority.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "../../src/animation/operation-presentation-plan-types.ts";
import type {
  KpRegisteredSuccessorSynthesisBinding
} from "../../src/animation/successor-synthesis-presentation-plan.ts";
import type {
  KpSuccessorSynthesisBinding
} from "../../src/animation/successor-synthesis.ts";
import type {
  KpNativeKatexSuccessorSynthesisIntent
} from "../../src/rendering/native-katex-successor-synthesis.ts";

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
declare const rawBinding: KpSuccessorSynthesisBinding;
declare const operationPlan: KpVerifiedOperationPresentationPlan;

// @ts-expect-error Renderers cannot recover a caller-authored handoff instant.
verified.handoffProgress;

// @ts-expect-error A registered successor cannot omit continuity authority.
const operationOnlyBinding: KpRegisteredSuccessorSynthesisBinding = {
  ...rawBinding,
  operationPresentationPlan: operationPlan
};

const fabricatedLegacyIntent: KpNativeKatexSuccessorSynthesisIntent = {
  // @ts-expect-error Only the branded exact-fraction compatibility compiler
  // may use the temporary legacy route before its scheduled removal.
  binding: rawBinding,
  direction: "forward",
  motion: "full",
  legacyContinuityAuthority: "exact-fraction-quantity-v0"
};

void [
  legalDraft,
  fabricated,
  hardSwap,
  callerOpacity,
  callerPath,
  verified,
  operationOnlyBinding,
  fabricatedLegacyIntent
];
