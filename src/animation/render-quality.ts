export const KP_RENDER_QUALITY_PREFERENCES = [
  "auto",
  "full",
  "balanced",
  "efficient"
] as const;

export type KpRenderQualityPreference =
  typeof KP_RENDER_QUALITY_PREFERENCES[number];

export type KpRenderQualityTier = Exclude<KpRenderQualityPreference, "auto">;

export interface KpRenderQualityCapabilities {
  readonly hardwareConcurrency?: number | undefined;
  readonly deviceMemoryGb?: number | undefined;
  readonly saveData?: boolean | undefined;
}

export interface KpRenderQualityProfile {
  readonly tier: KpRenderQualityTier;
  readonly shadowScale: number;
  readonly depthScale: number;
  readonly textureSubdivisionScale: number;
  readonly particleDensityScale: number;
  readonly microMotionScale: number;
  readonly semanticStepScale: 1;
  readonly witnessVisibility: "preserve";
  readonly durationScale: 1;
}

export interface KpRenderQualityState {
  readonly kind: "render-quality-state";
  readonly preference: KpRenderQualityPreference;
  readonly resolvedPreference: KpRenderQualityPreference;
  readonly profile: KpRenderQualityProfile;
  readonly frozen: boolean;
  readonly revision: number;
}

const profiles: Readonly<Record<KpRenderQualityTier, KpRenderQualityProfile>> = {
  full: profile("full", 1, 1, 1, 1, 1),
  balanced: profile("balanced", 0.65, 0.75, 0.65, 0.5, 0.65),
  efficient: profile("efficient", 0, 0.35, 0.35, 0, 0.25)
};

export function normalizeKpRenderQualityPreference(
  value: string | null | undefined
): KpRenderQualityPreference {
  return KP_RENDER_QUALITY_PREFERENCES.includes(
    value as KpRenderQualityPreference
  ) ? value as KpRenderQualityPreference : "auto";
}

export function resolveKpRenderQualityProfile(input: {
  readonly preference: KpRenderQualityPreference;
  readonly capabilities?: KpRenderQualityCapabilities | undefined;
}): KpRenderQualityProfile {
  if (input.preference !== "auto") return profiles[input.preference];

  const capabilities = input.capabilities ?? {};
  if (
    capabilities.saveData === true ||
    atMost(capabilities.deviceMemoryGb, 4) ||
    atMost(capabilities.hardwareConcurrency, 4)
  ) return profiles.efficient;
  if (
    atMost(capabilities.deviceMemoryGb, 8) ||
    atMost(capabilities.hardwareConcurrency, 8)
  ) return profiles.balanced;
  return profiles.full;
}

export function createKpRenderQualityState(input?: {
  readonly preference?: KpRenderQualityPreference | undefined;
  readonly capabilities?: KpRenderQualityCapabilities | undefined;
}): KpRenderQualityState {
  const preference = input?.preference ?? "auto";
  return {
    kind: "render-quality-state",
    preference,
    resolvedPreference: preference,
    profile: resolveKpRenderQualityProfile({
      preference,
      capabilities: input?.capabilities
    }),
    frozen: false,
    revision: 0
  };
}

export function selectKpRenderQualityPreference(input: {
  readonly state: KpRenderQualityState;
  readonly preference: KpRenderQualityPreference;
  readonly capabilities?: KpRenderQualityCapabilities | undefined;
}): KpRenderQualityState {
  if (input.preference === input.state.preference) return input.state;
  if (input.state.frozen) {
    // A running animation owns one immutable visual profile. The selected
    // preference is remembered now but cannot alter that profile mid-motion.
    return {
      ...input.state,
      preference: input.preference,
      revision: input.state.revision + 1
    };
  }
  return resolveState(input.state, input.preference, input.capabilities);
}

export function freezeKpRenderQualityState(input: {
  readonly state: KpRenderQualityState;
  readonly capabilities?: KpRenderQualityCapabilities | undefined;
}): KpRenderQualityState {
  const resolved = input.state.preference === input.state.resolvedPreference
    ? input.state
    : resolveState(
        input.state,
        input.state.preference,
        input.capabilities
      );
  return resolved.frozen ? resolved : {
    ...resolved,
    frozen: true,
    revision: resolved.revision + 1
  };
}

export function releaseKpRenderQualityState(input: {
  readonly state: KpRenderQualityState;
  readonly capabilities?: KpRenderQualityCapabilities | undefined;
}): KpRenderQualityState {
  const resolved = input.state.preference === input.state.resolvedPreference
    ? input.state
    : resolveState(
        input.state,
        input.state.preference,
        input.capabilities
      );
  return resolved.frozen ? {
    ...resolved,
    frozen: false,
    revision: resolved.revision + 1
  } : resolved;
}

export function kpRenderQualityPreferencePending(
  state: KpRenderQualityState
): boolean {
  return state.preference !== state.resolvedPreference;
}

function resolveState(
  previous: KpRenderQualityState,
  preference: KpRenderQualityPreference,
  capabilities: KpRenderQualityCapabilities | undefined
): KpRenderQualityState {
  return {
    ...previous,
    preference,
    resolvedPreference: preference,
    profile: resolveKpRenderQualityProfile({ preference, capabilities }),
    revision: previous.revision + 1
  };
}

function profile(
  tier: KpRenderQualityTier,
  shadowScale: number,
  depthScale: number,
  textureSubdivisionScale: number,
  particleDensityScale: number,
  microMotionScale: number
): KpRenderQualityProfile {
  return Object.freeze({
    tier,
    shadowScale,
    depthScale,
    textureSubdivisionScale,
    particleDensityScale,
    microMotionScale,
    semanticStepScale: 1,
    witnessVisibility: "preserve",
    durationScale: 1
  });
}

function atMost(value: number | undefined, ceiling: number): boolean {
  return value !== undefined && Number.isFinite(value) && value > 0 && value <= ceiling;
}
