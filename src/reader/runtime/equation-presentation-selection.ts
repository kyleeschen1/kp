import {
  resolveKpReaderEquationPresentationProfile,
  type KpReaderEquationPresentationCapability,
  type KpReaderEquationPresentationProfile
} from "../document/public-api.ts";

export type KpReaderEquationPresentationSelectionSource =
  | "default"
  | "url"
  | "provider";

export interface KpReaderEquationPresentationSelection {
  readonly profile: KpReaderEquationPresentationProfile;
  readonly source: KpReaderEquationPresentationSelectionSource;
}

/** A provider selects a named certified projection; it never supplies axes. */
export function selectKpReaderEquationPresentation(input: {
  readonly capability: KpReaderEquationPresentationCapability;
  readonly requestedProfileId?: string | null | undefined;
  readonly source?: Exclude<KpReaderEquationPresentationSelectionSource, "default"> | undefined;
}): KpReaderEquationPresentationSelection {
  const requested = input.requestedProfileId?.trim();
  const usesDefault = requested === undefined || requested === "";
  const profile = resolveKpReaderEquationPresentationProfile(
    usesDefault ? input.capability.defaultProfileId : requested
  );
  if (!input.capability.profileIds.includes(profile.id)) {
    throw new Error(`reader equation presentation profile ${profile.id} is unavailable`);
  }
  return Object.freeze({
    profile,
    source: usesDefault ? "default" : (input.source ?? "provider")
  });
}
