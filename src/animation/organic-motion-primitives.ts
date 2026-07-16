export interface KpOrganicMotionSignatureInput {
  readonly identityId: string;
  readonly lineageEdgeId?: string | undefined;
  readonly branchIndex?: number | undefined;
  readonly motifId: string;
  readonly motionFieldId: string;
}

export interface KpOrganicMotionSignature {
  readonly id: string;
  readonly phase: number;
  readonly frequency: number;
  readonly xBias: number;
  readonly yBias: number;
  readonly deformationBias: number;
  readonly groupCorrelation: number;
}

export interface KpOrganicMotionSample {
  readonly semanticProgress: number;
  readonly x: number;
  readonly y: number;
  readonly scaleAlong: number;
  readonly scaleAcross: number;
  readonly envelope: number;
}

export function deriveKpOrganicMotionSignature(
  input: KpOrganicMotionSignatureInput
): KpOrganicMotionSignature {
  const groupSeed = hashUnit(
    `${input.lineageEdgeId ?? input.identityId}|${input.motifId}|${input.motionFieldId}`
  );
  const identitySeed = hashUnit(
    `${input.identityId}|${input.branchIndex ?? -1}|${input.motifId}|${input.motionFieldId}`
  );
  const secondary = hashUnit(`${input.identityId}|organic-secondary`);
  return {
    id: `organic-signature.${hashString(JSON.stringify(input)).toString(16)}`,
    phase: round(groupSeed * Math.PI * 2),
    frequency: round(1 + secondary * 1.5),
    xBias: round(identitySeed * 2 - 1),
    yBias: round(secondary * 2 - 1),
    deformationBias: round(hashUnit(`${input.identityId}|deformation`) * 2 - 1),
    groupCorrelation: round(0.65 + groupSeed * 0.25)
  };
}

export function sampleKpOrganicMotion(input: {
  readonly signature: KpOrganicMotionSignature;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
  readonly microMotionAmplitude: number;
  readonly deformationCeiling: number;
}): KpOrganicMotionSample {
  const requested = clamp(input.progress);
  const semanticProgress =
    input.direction === "rewind" ? round(1 - requested) : requested;
  const amplitude = normalized(
    input.microMotionAmplitude,
    "micro-motion amplitude"
  );
  const deformationCeiling = normalized(
    input.deformationCeiling,
    "deformation ceiling"
  );
  const envelope = Math.sin(Math.PI * semanticProgress) ** 2;
  const wave =
    Math.sin(
      input.signature.phase +
        semanticProgress * Math.PI * 2 * input.signature.frequency
    ) * envelope;
  const companion =
    Math.cos(
      input.signature.phase * input.signature.groupCorrelation +
        semanticProgress * Math.PI * 2
    ) * envelope;
  const deformation =
    wave * input.signature.deformationBias * deformationCeiling;
  return {
    semanticProgress,
    x: round(
      amplitude *
        (wave * 0.72 + companion * 0.28) *
        input.signature.xBias
    ),
    y: round(
      amplitude *
        (companion * 0.68 + wave * 0.32) *
        input.signature.yBias
    ),
    scaleAlong: round(1 + deformation),
    scaleAcross: round(1 - deformation * 0.72),
    envelope: round(envelope)
  };
}

export function sampleKpOrganicProgress(input: {
  readonly progress: number;
  readonly character: "restrained" | "organic" | "editorial";
}): number {
  const p = clamp(input.progress);
  switch (input.character) {
    case "restrained":
      return round(p * p * (3 - 2 * p));
    case "editorial":
      return round(p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
    case "organic": {
      const smoother = p * p * p * (p * (p * 6 - 15) + 10);
      const breathing = Math.sin(Math.PI * p) * p * (1 - p) * 0.08;
      return round(clamp(smoother + breathing));
    }
  }
}

function hashUnit(value: string): number {
  return hashString(value) / 0xffffffff;
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function normalized(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be normalized between 0 and 1.`);
  }
  return value;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Organic motion progress must be finite.");
  }
  return Math.min(1, Math.max(0, value));
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
