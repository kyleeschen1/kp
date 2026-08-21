export interface KpNativeKatexInkKnotOpticalProfile {
  readonly schemaVersion: "kp.native-katex-ink-knot-optical-profile.v1";
  readonly id: "kp.rendering.native-katex.ink-knot.canonical.v1";
  readonly kernelAreaRatio: number;
  readonly minimumKernelScale: number;
  readonly maximumKernelScale: number;
}

/**
 * Shared optical law for compressed-but-unreadable KaTeX material. Semantic
 * evaluation families still own which contributors enter the knot.
 */
export const kpNativeKatexInkKnotOpticalProfile = Object.freeze({
  schemaVersion: "kp.native-katex-ink-knot-optical-profile.v1" as const,
  id: "kp.rendering.native-katex.ink-knot.canonical.v1" as const,
  kernelAreaRatio: 0.1,
  minimumKernelScale: 0.24,
  maximumKernelScale: 0.52
} satisfies KpNativeKatexInkKnotOpticalProfile);

export function compileKpNativeKatexInkKnotMetrics(input: {
  readonly sourceArea: number;
  readonly targetArea: number;
  readonly profile?: KpNativeKatexInkKnotOpticalProfile | undefined;
}) {
  const profile = input.profile ?? kpNativeKatexInkKnotOpticalProfile;
  if (
    !Number.isFinite(input.sourceArea) || input.sourceArea <= 0 ||
    !Number.isFinite(input.targetArea) || input.targetArea <= 0
  ) {
    throw new Error("Ink-knot geometry requires positive finite ink areas.");
  }
  const kernelArea = profile.kernelAreaRatio *
    Math.sqrt(input.sourceArea * input.targetArea);
  return Object.freeze({
    kernelArea,
    kernelSpan: Math.sqrt(kernelArea),
    sourceKernelScale: boundedKernelScale(
      Math.sqrt(kernelArea / input.sourceArea),
      profile
    ),
    targetKernelScale: boundedKernelScale(
      Math.sqrt(kernelArea / input.targetArea),
      profile
    )
  });
}

function boundedKernelScale(
  scale: number,
  profile: KpNativeKatexInkKnotOpticalProfile
): number {
  return Math.max(
    profile.minimumKernelScale,
    Math.min(profile.maximumKernelScale, scale)
  );
}
