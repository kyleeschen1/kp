import type {
  KpCanonicalOperationEvaluationTransformationKind
} from "./operation-evaluation-presentation-types.ts";

export const kpOperationEvaluationFamilyIds = [
  "punctuated-substitution",
  "result-reception",
  "contributor-fusion"
] as const;

export type KpOperationEvaluationFamilyId =
  (typeof kpOperationEvaluationFamilyIds)[number];

export type KpOperationEvaluationHandoffKind =
  | "discrete-cut"
  | "progressive-replacement"
  | "compressed-ink-handoff";

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
  KpContributorFusionEvaluationFamilyProfile;

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

const promotedProfiles: readonly KpOperationEvaluationFamilyProfile[] =
  Object.freeze([kpContributorFusionEvaluationFamilyProfile]);

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

export function isKpOperationEvaluationFamilyId(
  value: string
): value is KpOperationEvaluationFamilyId {
  return kpOperationEvaluationFamilyIds.some((family) => family === value);
}
