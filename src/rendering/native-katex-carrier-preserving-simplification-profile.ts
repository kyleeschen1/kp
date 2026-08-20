export interface KpNativeKatexCarrierPreservingSimplificationOpticalProfile {
  readonly schemaVersion:
    "kp.native-katex-carrier-preserving-simplification-optical-profile.v1";
  readonly id:
    "kp.rendering.native-katex.carrier-preserving-simplification.candidate-v1";
  readonly status: "provisional-human-checkpoint";
  readonly treatment: "identity-recognition";
  readonly removedSyntaxRecognition: {
    readonly start: number;
    readonly end: number;
    readonly disappearanceStart: number;
    readonly disappearanceEnd: number;
    readonly minimumScale: number;
    readonly kernelSpanInCarrierInkHeights: number;
  };
  readonly carrierTransit: {
    readonly start: number;
    readonly end: number;
  };
  readonly nativeSettlement: {
    readonly start: number;
    readonly end: number;
  };
}

export interface KpNativeKatexCarrierPreservingSimplificationOpticalSample {
  readonly progress: number;
  readonly phase:
    | "source"
    | "identity-recognition"
    | "carrier-transit"
    | "native-settlement"
    | "target";
  readonly carrier: {
    readonly paintPresence: 1;
    readonly transitProgress: number;
    readonly nativeSettlementProgress: number;
  };
  readonly removedSyntaxCohort: {
    readonly recognitionProgress: number;
    readonly disappearanceProgress: number;
    readonly paintPresence: number;
    readonly scale: number;
  };
}

/**
 * The candidate profile is the sole tuning surface for this Native KaTeX
 * treatment. Semantic callers name roles and lineage; they cannot tune time,
 * fading, compression, or retreat geometry independently.
 */
export const kpNativeKatexCarrierPreservingSimplificationOpticalProfile =
  deepFreeze({
    schemaVersion:
      "kp.native-katex-carrier-preserving-simplification-optical-profile.v1" as const,
    id:
      "kp.rendering.native-katex.carrier-preserving-simplification.candidate-v1" as const,
    status: "provisional-human-checkpoint" as const,
    treatment: "identity-recognition" as const,
    removedSyntaxRecognition: {
      start: 0.12,
      end: 0.44,
      disappearanceStart: 0.28,
      disappearanceEnd: 0.44,
      minimumScale: 0.36,
      kernelSpanInCarrierInkHeights: 0.18
    },
    carrierTransit: {
      start: 0.44,
      end: 0.88
    },
    nativeSettlement: {
      start: 0.88,
      end: 1
    }
  } satisfies KpNativeKatexCarrierPreservingSimplificationOpticalProfile);

/**
 * Sampling is pure and history-free so playback, direct seek, and rewind all
 * resolve the same optical state. The carrier never fades or scales; only the
 * syntax explicitly classified for removal yields.
 */
export function sampleKpNativeKatexCarrierPreservingSimplificationOptics(
  progress: number,
  profile = kpNativeKatexCarrierPreservingSimplificationOpticalProfile
): KpNativeKatexCarrierPreservingSimplificationOpticalSample {
  if (!Number.isFinite(progress)) {
    throw new Error("Carrier-preserving optical progress must be finite.");
  }
  assertValidProfile(profile);
  const bounded = clamp01(progress);
  const recognitionProgress = sampleInterval(
    bounded,
    profile.removedSyntaxRecognition.start,
    profile.removedSyntaxRecognition.end
  );
  const disappearanceProgress = sampleInterval(
    bounded,
    profile.removedSyntaxRecognition.disappearanceStart,
    profile.removedSyntaxRecognition.disappearanceEnd
  );
  const transitProgress = sampleInterval(
    bounded,
    profile.carrierTransit.start,
    profile.carrierTransit.end
  );
  const nativeSettlementProgress = sampleInterval(
    bounded,
    profile.nativeSettlement.start,
    profile.nativeSettlement.end
  );
  const recognitionScale = lerp(
    1,
    profile.removedSyntaxRecognition.minimumScale,
    recognitionProgress
  );

  return deepFreeze({
    progress: bounded,
    phase: phaseAt(bounded, profile),
    carrier: {
      paintPresence: 1 as const,
      transitProgress,
      nativeSettlementProgress
    },
    removedSyntaxCohort: {
      recognitionProgress,
      disappearanceProgress,
      paintPresence: 1 - disappearanceProgress,
      scale: recognitionScale
    }
  });
}

function phaseAt(
  progress: number,
  profile: KpNativeKatexCarrierPreservingSimplificationOpticalProfile
): KpNativeKatexCarrierPreservingSimplificationOpticalSample["phase"] {
  if (progress <= 0) return "source";
  if (progress < profile.carrierTransit.start) return "identity-recognition";
  if (progress < profile.nativeSettlement.start) return "carrier-transit";
  if (progress < 1) return "native-settlement";
  return "target";
}

function assertValidProfile(
  profile: KpNativeKatexCarrierPreservingSimplificationOpticalProfile
): void {
  const { removedSyntaxRecognition, carrierTransit, nativeSettlement } = profile;
  for (const [label, interval] of [
    ["removed syntax recognition", removedSyntaxRecognition],
    ["carrier transit", carrierTransit],
    ["native settlement", nativeSettlement]
  ] as const) {
    if (
      !Number.isFinite(interval.start) ||
      !Number.isFinite(interval.end) ||
      interval.start < 0 ||
      interval.end > 1 ||
      interval.start >= interval.end
    ) {
      throw new Error(`${label} must be a non-empty interval within [0, 1].`);
    }
  }
  if (
    removedSyntaxRecognition.minimumScale <= 0 ||
    removedSyntaxRecognition.minimumScale > 1 ||
    !Number.isFinite(
      removedSyntaxRecognition.kernelSpanInCarrierInkHeights
    ) ||
    removedSyntaxRecognition.kernelSpanInCarrierInkHeights <= 0 ||
    removedSyntaxRecognition.kernelSpanInCarrierInkHeights > 0.75
  ) {
    throw new Error("Identity-recognition geometry must remain bounded and positive.");
  }
  if (
    removedSyntaxRecognition.disappearanceStart <
      removedSyntaxRecognition.start ||
    removedSyntaxRecognition.disappearanceEnd <=
      removedSyntaxRecognition.disappearanceStart ||
    removedSyntaxRecognition.disappearanceEnd > carrierTransit.end ||
    removedSyntaxRecognition.end !== carrierTransit.start
  ) {
    throw new Error(
      "Identity recognition must gather before and yield during carrier transit."
    );
  }
  if (
    nativeSettlement.start !== carrierTransit.end ||
    nativeSettlement.end !== 1
  ) {
    throw new Error(
      "Native settlement must begin at transit completion and end at progress 1."
    );
  }
}

function sampleInterval(progress: number, start: number, end: number): number {
  const local = clamp01((progress - start) / (end - start));
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach((child) => deepFreeze(child));
  return Object.freeze(value);
}
