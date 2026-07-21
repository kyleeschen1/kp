export const kpReaderEquationDerivationModes = [
  "balanced-operation-v1",
  "certified-transfer-v1"
] as const;

export type KpReaderEquationDerivationMode =
  typeof kpReaderEquationDerivationModes[number];

export const kpReaderEquationIdentityModes = [
  "hold-until-settled-v1",
  "omit-transient-v1"
] as const;

export type KpReaderEquationIdentityMode =
  typeof kpReaderEquationIdentityModes[number];

export interface KpReaderEquationPresentationAxes {
  readonly derivation: KpReaderEquationDerivationMode;
  readonly identity: KpReaderEquationIdentityMode;
}

export const kpReaderEquationPresentationProfileIds = [
  "explain",
  "standard",
  "fluent"
] as const;

export type KpReaderEquationPresentationProfileId =
  typeof kpReaderEquationPresentationProfileIds[number];

export interface KpReaderEquationPresentationProfile
  extends KpReaderEquationPresentationAxes {
  readonly id: KpReaderEquationPresentationProfileId;
  readonly label: "Explain" | "Standard" | "Fluent";
}

export interface KpReaderEquationPresentationCapability {
  readonly defaultProfileId: KpReaderEquationPresentationProfileId;
  readonly profileIds: readonly KpReaderEquationPresentationProfileId[];
}

export const kpReaderDefaultEquationPresentationProfileId = "standard" as const;

export const kpReaderEquationPresentationProfiles = Object.freeze({
  explain: profile("explain", "Explain", {
    derivation: "balanced-operation-v1",
    identity: "hold-until-settled-v1"
  }),
  standard: profile("standard", "Standard", {
    derivation: "balanced-operation-v1",
    identity: "omit-transient-v1"
  }),
  fluent: profile("fluent", "Fluent", {
    derivation: "certified-transfer-v1",
    identity: "omit-transient-v1"
  })
} satisfies Record<
  KpReaderEquationPresentationProfileId,
  KpReaderEquationPresentationProfile
>);

export const kpReaderEquationPresentationCapability =
  defineKpReaderEquationPresentationCapability({
    defaultProfileId: kpReaderDefaultEquationPresentationProfileId,
    profileIds: kpReaderEquationPresentationProfileIds
  });

export function resolveKpReaderEquationPresentationProfile(
  id: string | null | undefined
): KpReaderEquationPresentationProfile {
  const resolvedId = id === null || id === undefined || id === ""
    ? kpReaderDefaultEquationPresentationProfileId
    : id;
  if (!kpReaderEquationPresentationProfileIds.includes(
    resolvedId as KpReaderEquationPresentationProfileId
  )) {
    throw new Error(`Unknown reader equation presentation profile ${resolvedId}.`);
  }
  return kpReaderEquationPresentationProfiles[
    resolvedId as KpReaderEquationPresentationProfileId
  ];
}

/**
 * Presentation axes may project a certified trace, but never author algebra,
 * correspondence, geometry, or timing. The shared contract lets compilation
 * advertise choices without granting runtime selectors semantic authority.
 */
export function defineKpReaderEquationPresentationAxes<
  const TAxes extends KpReaderEquationPresentationAxes
>(axes: TAxes): Readonly<TAxes> {
  assertMember("derivation", axes.derivation, kpReaderEquationDerivationModes);
  assertMember("identity", axes.identity, kpReaderEquationIdentityModes);
  return Object.freeze({ ...axes });
}

export function defineKpReaderEquationPresentationCapability<
  const TCapability extends KpReaderEquationPresentationCapability
>(capability: TCapability): Readonly<TCapability> {
  const profileIds = [...new Set(capability.profileIds.map((id) =>
    resolveKpReaderEquationPresentationProfile(id).id
  ))];
  if (profileIds.length === 0) {
    throw new Error("reader equation presentation capability requires a profile");
  }
  if (!profileIds.includes(capability.defaultProfileId)) {
    throw new Error(
      `reader equation default profile ${capability.defaultProfileId} is not available`
    );
  }
  return Object.freeze({
    ...capability,
    profileIds: Object.freeze(profileIds)
  });
}

function profile(
  id: KpReaderEquationPresentationProfileId,
  label: KpReaderEquationPresentationProfile["label"],
  axes: KpReaderEquationPresentationAxes
): KpReaderEquationPresentationProfile {
  return Object.freeze({ id, label, ...defineKpReaderEquationPresentationAxes(axes) });
}

function assertMember<const TValue extends string>(
  axis: string,
  value: string,
  allowed: readonly TValue[]
): asserts value is TValue {
  if (!allowed.includes(value as TValue)) {
    throw new Error(`Unknown reader equation ${axis} mode ${value}.`);
  }
}
