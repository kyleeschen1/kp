import type {
  KpCanonicalOperationEvaluationTransformationKind
} from "./operation-evaluation-presentation-types.ts";
import {
  isKpVerifiedCarrierPreservingSimplificationEvidence,
  type KpVerifiedCarrierPreservingSimplificationEvidence
} from "../semantic/carrier-preserving-simplification-evidence.ts";
import {
  isKpVerifiedEvaluationTopologyCertificate,
  type KpEvaluationTopologyKind,
  type KpVerifiedEvaluationTopologyCertificate
} from "../semantic/evaluation-topology-certificate.ts";

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

export type KpOperationEvaluationFamilyProfileId =
  KpOperationEvaluationFamilyProfile["id"];

export const kpOperationEvaluationReleaseMaturities = [
  "review-stage",
  "promoted"
] as const;

export type KpOperationEvaluationReleaseMaturity =
  (typeof kpOperationEvaluationReleaseMaturities)[number];

export interface KpOperationEvaluationFamilyReleaseRegistration {
  readonly schemaVersion: "kp.operation-evaluation-family-release.v1";
  readonly transformationKind: string;
  readonly familyProfileId: KpOperationEvaluationFamilyProfileId;
  /** Release maturity belongs to this use, not to semantic applicability. */
  readonly maturity: KpOperationEvaluationReleaseMaturity;
}

export type KpOperationEvaluationFamilyApplicabilityResolution =
  | {
      readonly status: "applicable";
      readonly profile: KpOperationEvaluationFamilyProfile;
      readonly topologyCertificate: KpVerifiedEvaluationTopologyCertificate;
    }
  | {
      readonly status:
        | "unsupported-family-profile"
        | "unverified-topology"
        | "incompatible-topology";
      readonly familyProfileId: string;
      readonly requiredTopology?: KpEvaluationTopologyKind | undefined;
      readonly actualTopology?: KpEvaluationTopologyKind | undefined;
      readonly message: string;
    };

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

export const kpOperationEvaluationFamilyReleaseRegistrations:
readonly KpOperationEvaluationFamilyReleaseRegistration[] = Object.freeze([
  ...kpContributorFusionEvaluationFamilyProfile.supportedTransformationKinds
    .map((transformationKind) => Object.freeze({
      schemaVersion: "kp.operation-evaluation-family-release.v1" as const,
      transformationKind,
      familyProfileId: kpContributorFusionEvaluationFamilyProfile.id,
      maturity: "promoted" as const
    })),
  Object.freeze({
    schemaVersion: "kp.operation-evaluation-family-release.v1" as const,
    transformationKind: "simplifyConstantDifference",
    familyProfileId: kpContributorFusionEvaluationFamilyProfile.id,
    maturity: "review-stage" as const
  }),
  Object.freeze({
    schemaVersion: "kp.operation-evaluation-family-release.v1" as const,
    transformationKind: "simplifyAntiderivativePowerRule",
    familyProfileId: kpContributorFusionEvaluationFamilyProfile.id,
    maturity: "review-stage" as const
  }),
  ...kpCarrierPreservingSimplificationEvaluationFamilyProfile
    .supportedTransformationKinds.map((transformationKind) => Object.freeze({
      schemaVersion: "kp.operation-evaluation-family-release.v1" as const,
      transformationKind,
      familyProfileId:
        kpCarrierPreservingSimplificationEvaluationFamilyProfile.id,
      maturity: "promoted" as const
    }))
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
  const release = kpOperationEvaluationFamilyReleaseRegistrations.find(
    (candidate) => candidate.transformationKind === transformationKind &&
      candidate.maturity === "promoted"
  );
  return release === undefined
    ? undefined
    : promotedProfiles.find(({ id }) => id === release.familyProfileId);
}

export function resolveKpOperationEvaluationFamilyReleaseRegistration(
  transformationKind: string
): KpOperationEvaluationFamilyReleaseRegistration | undefined {
  return kpOperationEvaluationFamilyReleaseRegistrations.find(
    (candidate) => candidate.transformationKind === transformationKind
  );
}

/**
 * Applicability is proved by semantic topology. It intentionally does not
 * inspect a transformation-kind release allowlist.
 */
export function resolveKpOperationEvaluationFamilyApplicability(input: {
  readonly familyProfileId: string;
  readonly topologyCertificate: unknown;
}): KpOperationEvaluationFamilyApplicabilityResolution {
  const profile = promotedProfiles.find(({ id }) =>
    id === input.familyProfileId
  );
  if (profile === undefined) {
    return Object.freeze({
      status: "unsupported-family-profile" as const,
      familyProfileId: input.familyProfileId,
      message: `Unknown operation-evaluation family profile ${input.familyProfileId}.`
    });
  }

  const requiredTopology: KpEvaluationTopologyKind =
    profile.family === "contributor-fusion"
      ? "contributors-create-result"
      : "carrier-survives";
  if (!isKpVerifiedEvaluationTopologyCertificate(input.topologyCertificate)) {
    return Object.freeze({
      status: "unverified-topology" as const,
      familyProfileId: input.familyProfileId,
      requiredTopology,
      message:
        `Family profile ${input.familyProfileId} requires a compiler-minted ${requiredTopology} topology certificate.`
    });
  }
  if (input.topologyCertificate.topology !== requiredTopology) {
    return Object.freeze({
      status: "incompatible-topology" as const,
      familyProfileId: input.familyProfileId,
      requiredTopology,
      actualTopology: input.topologyCertificate.topology,
      message:
        `Family profile ${input.familyProfileId} requires ${requiredTopology}, not ${input.topologyCertificate.topology}.`
    });
  }

  return Object.freeze({
    status: "applicable" as const,
    profile,
    topologyCertificate: input.topologyCertificate
  });
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
