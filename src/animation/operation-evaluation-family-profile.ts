import type {
  KpCanonicalOperationEvaluationTransformationKind
} from "./operation-evaluation-presentation-types.ts";
import {
  isKpVerifiedCarrierPreservingSimplificationEvidence,
  type KpVerifiedCarrierPreservingSimplificationEvidence
} from "../semantic/carrier-preserving-simplification-evidence.ts";

export const kpOperationEvaluationFamilyIds = [
  "punctuated-substitution",
  "result-reception",
  "contributor-fusion",
  "carrier-preserving-simplification"
] as const;

export type KpOperationEvaluationFamilyId =
  (typeof kpOperationEvaluationFamilyIds)[number];

export type KpOperationEvaluationHandoffKind =
  | "discrete-cut"
  | "progressive-replacement"
  | "compressed-ink-handoff"
  | "persistent-carrier-transfer";

export interface KpCarrierPreservingSimplificationEvaluationFamilyProfile {
  readonly schemaVersion: "kp.operation-evaluation-family-profile.v1";
  readonly id: "kp.evaluation-family.carrier-preserving-simplification.v1";
  readonly status: "promoted";
  readonly family: "carrier-preserving-simplification";
  readonly handoff: "persistent-carrier-transfer";
  readonly rendererProfileId:
    "kp.rendering.native-katex.carrier-preserving-simplification.v1";
  readonly requiredEvidenceSchemaVersion:
    "kp.carrier-preserving-simplification-evidence.v1";
  readonly supportedTransformationKinds:
    readonly [
      "simplifyMultiplicativeIdentity",
      "simplify-additive-identity"
    ];
}

export interface KpContributorFusionEvaluationFamilyProfile {
  readonly schemaVersion: "kp.operation-evaluation-family-profile.v1";
  readonly id: "kp.evaluation-family.contributor-fusion.v1";
  readonly status: "promoted";
  readonly family: "contributor-fusion";
  readonly handoff: "compressed-ink-handoff";
  readonly synthesisSampling: "canonical-successor";
  readonly rendererProfileId:
    "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1";
  readonly supportedTransformationKinds:
    readonly KpCanonicalOperationEvaluationTransformationKind[];
}

export type KpOperationEvaluationFamilyProfile =
  | KpContributorFusionEvaluationFamilyProfile
  | KpCarrierPreservingSimplificationEvaluationFamilyProfile;

export type KpOperationEvaluationFamilyProfileResolution =
  | {
      readonly status: "resolved";
      readonly profile: KpOperationEvaluationFamilyProfile;
    }
  | {
      readonly status: "unsupported-family" | "incompatible-handoff";
      readonly family: string;
      readonly handoff: string;
      readonly message: string;
    };

export type KpOperationEvaluationFamilyCandidateResolution =
  | {
      readonly status: "candidate-resolved";
      readonly profile: KpCarrierPreservingSimplificationEvaluationFamilyProfile;
      readonly evidence: KpVerifiedCarrierPreservingSimplificationEvidence;
    }
  | {
      readonly status:
        | "unsupported-family"
        | "incompatible-handoff"
        | "unsupported-operation"
        | "missing-carrier-evidence";
      readonly family: string;
      readonly handoff: string;
      readonly transformationKind: string;
      readonly message: string;
    };

export const kpContributorFusionEvaluationFamilyProfile = Object.freeze({
  schemaVersion: "kp.operation-evaluation-family-profile.v1" as const,
  id: "kp.evaluation-family.contributor-fusion.v1" as const,
  status: "promoted" as const,
  family: "contributor-fusion" as const,
  handoff: "compressed-ink-handoff" as const,
  synthesisSampling: "canonical-successor" as const,
  rendererProfileId:
    "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1" as const,
  supportedTransformationKinds: Object.freeze([
    "simplifyConstantProduct",
    "simplifyConstantQuotient",
    "simplifyConstantSum"
  ] as const)
} satisfies KpContributorFusionEvaluationFamilyProfile);

export const kpCarrierPreservingSimplificationEvaluationFamilyProfile =
Object.freeze({
  schemaVersion: "kp.operation-evaluation-family-profile.v1" as const,
  id:
    "kp.evaluation-family.carrier-preserving-simplification.v1" as const,
  status: "promoted" as const,
  family: "carrier-preserving-simplification" as const,
  handoff: "persistent-carrier-transfer" as const,
  rendererProfileId:
    "kp.rendering.native-katex.carrier-preserving-simplification.v1" as const,
  requiredEvidenceSchemaVersion:
    "kp.carrier-preserving-simplification-evidence.v1" as const,
  supportedTransformationKinds: Object.freeze([
    "simplifyMultiplicativeIdentity",
    "simplify-additive-identity"
  ] as const)
} satisfies KpCarrierPreservingSimplificationEvaluationFamilyProfile);

export const kpOperationEvaluationFamilyCandidateProfiles:
readonly KpCarrierPreservingSimplificationEvaluationFamilyProfile[] =
Object.freeze([
  kpCarrierPreservingSimplificationEvaluationFamilyProfile
]);

const promotedProfiles: readonly KpOperationEvaluationFamilyProfile[] =
  Object.freeze([
    kpContributorFusionEvaluationFamilyProfile,
    kpCarrierPreservingSimplificationEvaluationFamilyProfile
  ]);

/**
 * Family and paint handoff are independent authoring choices. Resolution
 * closes their compatibility before any renderer is selected, so callers
 * cannot obtain a plausible-looking but uncertified pair.
 */
export function resolveKpOperationEvaluationFamilyProfile(input: {
  readonly family: string;
  readonly handoff: string;
}): KpOperationEvaluationFamilyProfileResolution {
  const familyProfiles = promotedProfiles.filter(
    ({ family }) => family === input.family
  );
  if (familyProfiles.length === 0) {
    return Object.freeze({
      status: "unsupported-family" as const,
      family: input.family,
      handoff: input.handoff,
      message: `Operation-evaluation family ${input.family} is not promoted.`
    });
  }
  const profile = familyProfiles.find(
    ({ handoff }) => handoff === input.handoff
  );
  if (profile === undefined) {
    return Object.freeze({
      status: "incompatible-handoff" as const,
      family: input.family,
      handoff: input.handoff,
      message:
        `Operation-evaluation family ${input.family} is incompatible with ` +
        `handoff ${input.handoff}.`
    });
  }
  return Object.freeze({ status: "resolved" as const, profile });
}

export function resolveKpDefaultOperationEvaluationFamilyProfile(
  transformationKind: string
): KpOperationEvaluationFamilyProfile | undefined {
  return promotedProfiles.find(({ supportedTransformationKinds }) =>
    supportedTransformationKinds.some((kind) => kind === transformationKind)
  );
}

export function resolveKpOperationEvaluationFamilyCandidate(input: {
  readonly family: string;
  readonly handoff: string;
  readonly transformationKind: string;
  readonly evidence?: unknown;
}): KpOperationEvaluationFamilyCandidateResolution {
  const profile = kpOperationEvaluationFamilyCandidateProfiles.find(
    ({ family }) => family === input.family
  );
  const gap = (status: Exclude<
    KpOperationEvaluationFamilyCandidateResolution["status"],
    "candidate-resolved"
  >, message: string): KpOperationEvaluationFamilyCandidateResolution =>
    Object.freeze({
      status,
      family: input.family,
      handoff: input.handoff,
      transformationKind: input.transformationKind,
      message
    });
  if (profile === undefined) {
    return gap("unsupported-family",
      `Unknown candidate operation-evaluation family ${input.family}.`);
  }
  if (profile.handoff !== input.handoff) {
    return gap("incompatible-handoff",
      `Family ${input.family} requires handoff ${profile.handoff}.`);
  }
  if (!profile.supportedTransformationKinds.some(
    (kind) => kind === input.transformationKind)) {
    return gap("unsupported-operation",
      `Family ${input.family} does not support ${input.transformationKind}.`);
  }
  if (!isKpVerifiedCarrierPreservingSimplificationEvidence(input.evidence)) {
    return gap("missing-carrier-evidence",
      `Family ${input.family} requires verified carrier evidence.`);
  }
  return Object.freeze({
    status: "candidate-resolved" as const,
    profile,
    evidence: input.evidence
  });
}

export function isKpOperationEvaluationFamilyId(
  value: string
): value is KpOperationEvaluationFamilyId {
  return kpOperationEvaluationFamilyIds.some((family) => family === value);
}
