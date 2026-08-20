import {
  kpGeneratedAddZeroAnimationId
} from "../semantic/generated-add-zero-carrier-preserving-simplification.ts";
import {
  kpTwoTimesOneCarrierAnimationId
} from "../animation/operation-evaluation-adapter.ts";
import {
  kpCarrierPreservingSimplificationEvaluationFamilyProfile
} from "../animation/operation-evaluation-family-profile.ts";
import {
  kpNativeKatexCarrierPreservingSimplificationOpticalProfile
} from "../rendering/native-katex-carrier-preserving-simplification-profile.ts";

export const kpCarrierPreservingSimplificationReleasedAnimationIds =
  Object.freeze([
    kpTwoTimesOneCarrierAnimationId,
    kpGeneratedAddZeroAnimationId
  ] as const);

export interface KpVerifiedCarrierPreservingSimplificationReleaseApproval {
  readonly schemaVersion:
    "kp.verified-carrier-preserving-simplification-release-approval.v1";
  readonly animationIds:
    typeof kpCarrierPreservingSimplificationReleasedAnimationIds;
  readonly familyProfileId:
    typeof kpCarrierPreservingSimplificationEvaluationFamilyProfile.id;
  readonly rendererProfileId:
    typeof kpNativeKatexCarrierPreservingSimplificationOpticalProfile.id;
  readonly approvedTransformationKinds: readonly [
    "simplifyMultiplicativeIdentity",
    "simplify-additive-identity"
  ];
  readonly catalogueDisposition: "keep";
  readonly reviewDecision: "approved-after-two-caller-and-ink-conformance";
  readonly releaseDecision: "passed";
  readonly evidenceSourceIds: readonly [
    "docs/project/reviews/2026-08-19-carrier-preserving-simplification-human-checkpoint.md",
    "run-contract.kp.native-katex-compositor-conformance-v2",
    "tests/carrier-preserving-simplification.browser.spec.ts",
    "package-script.visual:carrier-preserving-simplification:checkpoint"
  ];
}

/**
 * Promotion is nominal and cohort-bounded: copied booleans cannot release a
 * third identity operation or another family/handoff combination.
 */
export const kpVerifiedCarrierPreservingSimplificationReleaseApproval =
  Object.freeze({
    schemaVersion:
      "kp.verified-carrier-preserving-simplification-release-approval.v1" as const,
    animationIds: kpCarrierPreservingSimplificationReleasedAnimationIds,
    familyProfileId:
      kpCarrierPreservingSimplificationEvaluationFamilyProfile.id,
    rendererProfileId:
      kpNativeKatexCarrierPreservingSimplificationOpticalProfile.id,
    approvedTransformationKinds: Object.freeze([
      "simplifyMultiplicativeIdentity",
      "simplify-additive-identity"
    ] as const),
    catalogueDisposition: "keep" as const,
    reviewDecision: "approved-after-two-caller-and-ink-conformance" as const,
    releaseDecision: "passed" as const,
    evidenceSourceIds: Object.freeze([
      "docs/project/reviews/2026-08-19-carrier-preserving-simplification-human-checkpoint.md",
      "run-contract.kp.native-katex-compositor-conformance-v2",
      "tests/carrier-preserving-simplification.browser.spec.ts",
      "package-script.visual:carrier-preserving-simplification:checkpoint"
    ] as const)
  }) satisfies KpVerifiedCarrierPreservingSimplificationReleaseApproval;

export function isKpVerifiedCarrierPreservingSimplificationReleaseApproval(
  value: unknown
): value is KpVerifiedCarrierPreservingSimplificationReleaseApproval {
  return value === kpVerifiedCarrierPreservingSimplificationReleaseApproval;
}
