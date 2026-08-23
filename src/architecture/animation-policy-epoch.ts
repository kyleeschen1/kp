import type {
  KpAnimationGovernanceDomain
} from "./animation-governance-inventory.ts";
import type {
  KpAnimationPrincipleContractId,
  KpAnimationPrincipleId
} from "./animation-principle-ledger.ts";

export type KpAnimationPolicyEpochId =
  | "policy.animation.legacy.v1"
  | "policy.animation.governance-v2.preview.1";

export interface KpAnimationPolicyEpoch {
  readonly schemaVersion: "kp.animation-policy-epoch.v1";
  readonly id: KpAnimationPolicyEpochId;
  readonly status: "frozen" | "preview";
  readonly requiredPrincipleIds: readonly KpAnimationPrincipleId[];
  readonly principleContractIds:
    readonly KpAnimationPrincipleContractId[];
  readonly implicitProfilePolicy: "preserve-legacy" | "reject";
  readonly legacyEquationProfileId?: string | undefined;
}

export interface KpResolvedAnimationProfileProvenance {
  readonly schemaVersion: "kp.resolved-animation-profile-provenance.v1";
  readonly domain: KpAnimationGovernanceDomain;
  readonly epochId: KpAnimationPolicyEpochId;
  readonly source:
    | "asset-declared"
    | "legacy-policy-default"
    | "not-applicable";
  readonly profileId: string;
  readonly profileSchemaVersion?: string | undefined;
  readonly profileFingerprint: string;
}

export const kpAnimationPolicyEpochs = Object.freeze([
  createEpoch({
    schemaVersion: "kp.animation-policy-epoch.v1" as const,
    id: "policy.animation.legacy.v1" as const,
    status: "frozen" as const,
    requiredPrincipleIds: [
      "principle.animation.semantic-lineage-authority",
      "principle.animation.deterministic-single-clock"
    ],
    principleContractIds: [
      "contract.animation.semantic-lineage.v1",
      "contract.animation.deterministic-clock.v1"
    ],
    implicitProfilePolicy: "preserve-legacy" as const,
    legacyEquationProfileId: "profile.equation.legacy-implicit.v1"
  }),
  createEpoch({
    schemaVersion: "kp.animation-policy-epoch.v1" as const,
    id: "policy.animation.governance-v2.preview.1" as const,
    status: "preview" as const,
    requiredPrincipleIds: [
      "principle.animation.semantic-lineage-authority",
      "principle.animation.deterministic-single-clock"
    ],
    principleContractIds: [
      "contract.animation.semantic-lineage.v1",
      "contract.animation.deterministic-clock.v1"
    ],
    implicitProfilePolicy: "reject" as const
  })
]);

function createEpoch(input: KpAnimationPolicyEpoch): KpAnimationPolicyEpoch {
  return Object.freeze({
    ...input,
    requiredPrincipleIds: Object.freeze([...input.requiredPrincipleIds]),
    principleContractIds: Object.freeze([...input.principleContractIds])
  });
}

export function resolveKpAnimationPolicyEpoch(
  epochId: KpAnimationPolicyEpochId
): KpAnimationPolicyEpoch {
  const epoch = kpAnimationPolicyEpochs.find(({ id }) => id === epochId);
  if (epoch === undefined) {
    throw new Error(`Unknown animation policy epoch ${String(epochId)}.`);
  }
  return epoch;
}

/**
 * The epoch owns fallback behavior. Resolution therefore remains reproducible
 * when a newer policy changes defaults or begins rejecting implicit profiles.
 */
export function resolveKpAnimationProfileProvenance(input: {
  readonly epochId: KpAnimationPolicyEpochId;
  readonly domain: KpAnimationGovernanceDomain;
  readonly declaredProfile?: {
    readonly schemaVersion: string;
    readonly domain: string;
    readonly payload: unknown;
  } | undefined;
}): KpResolvedAnimationProfileProvenance {
  const epoch = resolveKpAnimationPolicyEpoch(input.epochId);
  if (input.declaredProfile !== undefined) {
    if (input.declaredProfile.domain !== input.domain) {
      throw new Error(
        `Declared ${input.declaredProfile.domain} profile cannot resolve ${input.domain}.`
      );
    }
    const fingerprint = fingerprintProfile(input.declaredProfile);
    return Object.freeze({
      schemaVersion: "kp.resolved-animation-profile-provenance.v1" as const,
      domain: input.domain,
      epochId: input.epochId,
      source: "asset-declared" as const,
      profileId:
        `profile.${input.domain}.declared.${input.declaredProfile.schemaVersion}.${fingerprint}`,
      profileSchemaVersion: input.declaredProfile.schemaVersion,
      profileFingerprint: fingerprint
    });
  }
  if (input.domain !== "equation") {
    return Object.freeze({
      schemaVersion: "kp.resolved-animation-profile-provenance.v1" as const,
      domain: input.domain,
      epochId: input.epochId,
      source: "not-applicable" as const,
      profileId: `profile.${input.domain}.renderer-domain`,
      profileFingerprint: fingerprintProfile({
        epochId: input.epochId,
        domain: input.domain,
        profile: "renderer-domain"
      })
    });
  }
  if (
    epoch.implicitProfilePolicy === "preserve-legacy" &&
    epoch.legacyEquationProfileId !== undefined
  ) {
    return Object.freeze({
      schemaVersion: "kp.resolved-animation-profile-provenance.v1" as const,
      domain: input.domain,
      epochId: input.epochId,
      source: "legacy-policy-default" as const,
      profileId: epoch.legacyEquationProfileId,
      profileFingerprint: fingerprintProfile({
        epochId: epoch.id,
        profileId: epoch.legacyEquationProfileId
      })
    });
  }
  throw new Error(
    `Policy epoch ${epoch.id} rejects an implicit equation presentation profile.`
  );
}

function fingerprintProfile(value: unknown): string {
  const input = stableStringify(value);
  let hash = 2_166_136_261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `kp-profile-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}
