import type { KpMaterialJunctionRect } from "./material-junction.ts";
import {
  deriveKpCancellationWitness,
  type KpCancellationWitness
} from "../semantic/cancellation-witness.ts";
import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";

export interface KpWitnessedAnnihilationBinding {
  readonly kind: "witnessed-annihilation-binding";
  readonly id: string;
  readonly relationRecordId: string;
  readonly witness: KpCancellationWitness;
  readonly sources: readonly KpWitnessedAnnihilationSource[];
  readonly survivorRecordIds: readonly string[];
}

export interface KpWitnessedAnnihilationSource {
  readonly id: string;
  readonly selectorIds: readonly string[];
  readonly semanticRole: string;
  readonly semanticRank: number;
}

export interface KpWitnessedAnnihilationMotionProfileV1 {
  readonly schemaVersion: "kp.witnessed-annihilation-motion-profile.v1";
  readonly id: string;
  readonly timing: {
    readonly contactStart: number;
    readonly contactEnd: number;
    readonly compressionEnd: number;
    readonly witnessBirthStart: number;
    readonly witnessReadableAt: number;
    readonly witnessDwellEnd: number;
    readonly sourceAbsorptionEnd: number;
    readonly witnessAbsorptionEnd: number;
    readonly compactionStart: number;
    readonly compactionEnd: number;
    readonly compressionLead: number;
    readonly sourceAbsorptionDelay: number;
    readonly inwardPulseLead: number;
    readonly inwardPulseTail: number;
  };
  readonly geometry: {
    readonly defaultCompressedScale: number;
    readonly minimumSourceCount: number;
    readonly binarySourceCount: number;
    readonly minimumPairContactGapPx: number;
    readonly multiSourceConvergenceRatio: number;
    readonly alternatingArcHeightPx: number;
    readonly alternatingVerticalNudgePx: number;
    readonly witnessInitialScale: number;
    readonly witnessScaleGrowth: number;
    readonly witnessLiftPx: number;
  };
}

/**
 * Perceptual values belong to the motif, not to individual callers. Keeping
 * them in one typed profile makes tuning explicit and lets tests sample named
 * phase boundaries instead of copying anonymous decimals.
 */
export const kpWitnessedAnnihilationMotionProfileV1 = deepFreeze({
  schemaVersion: "kp.witnessed-annihilation-motion-profile.v1",
  id: "motion-profile.witnessed-annihilation.organic-subtle.v1",
  timing: {
    contactStart: 0.16,
    contactEnd: 0.46,
    compressionEnd: 0.58,
    witnessBirthStart: 0.54,
    witnessReadableAt: 0.64,
    witnessDwellEnd: 0.78,
    sourceAbsorptionEnd: 0.84,
    witnessAbsorptionEnd: 0.9,
    compactionStart: 0.9,
    compactionEnd: 0.98,
    compressionLead: 0.08,
    sourceAbsorptionDelay: 0.04,
    inwardPulseLead: 0.04,
    inwardPulseTail: 0.03
  },
  geometry: {
    defaultCompressedScale: 0.72,
    minimumSourceCount: 2,
    binarySourceCount: 2,
    minimumPairContactGapPx: 16,
    multiSourceConvergenceRatio: 0.48,
    alternatingArcHeightPx: 7,
    alternatingVerticalNudgePx: 1,
    witnessInitialScale: 0.68,
    witnessScaleGrowth: 0.32,
    witnessLiftPx: 2
  }
} satisfies KpWitnessedAnnihilationMotionProfileV1);

export function createKpWitnessedAnnihilationBinding(input: {
  readonly operationId: string;
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
  readonly cancellationRecordId: string;
  readonly slotId?: string | undefined;
}): KpWitnessedAnnihilationBinding {
  const records = input.transformation.correspondenceMap?.records ?? [];
  const cancellation = records.find((record) =>
    record.id === input.cancellationRecordId
  );
  if (cancellation?.relation !== "cancelation") {
    throw new Error(`Missing cancellation record ${input.cancellationRecordId}.`);
  }
  const survivors = records.filter((record) =>
    record.relation === "identity" || record.relation === "role-change"
  );
  const survivorAnchorSelectorIds = survivors.flatMap((record) =>
    record.sourceSelectorIds
  );
  const witness = deriveKpCancellationWitness({
    operationId: input.operationId,
    transformation: input.transformation,
    bundle: input.bundle,
    cancellationRecordId: cancellation.id,
    slotId: input.slotId ?? `slot.${input.transformation.id}.${cancellation.id}`,
    survivorAnchorSelectorIds
  });
  const selectors = new Map(input.bundle.objects.flatMap((object) =>
    object.selectors.map((selector) => [selector.id, selector] as const)
  ));
  return {
    kind: "witnessed-annihilation-binding",
    id: `annihilation.${input.transformation.id}.${cancellation.id}`,
    relationRecordId: cancellation.id,
    witness,
    sources: cancellation.sourceSelectorIds.map((selectorId, semanticRank) => ({
      id: selectorId,
      selectorIds: [selectorId],
      semanticRole: selectors.get(selectorId)?.kind ?? "canceled-material",
      semanticRank
    })),
    survivorRecordIds: survivors.map((record) => record.id)
  };
}

export interface KpWitnessedAnnihilationSurvivor {
  readonly id: string;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly sourceRect: KpMaterialJunctionRect;
  readonly targetRect: KpMaterialJunctionRect;
}

export interface KpWitnessedAnnihilationPlan {
  readonly kind: "witnessed-annihilation-plan";
  readonly id: string;
  readonly styleId: "gestalt.organic-subtle.annihilation-v0";
  readonly witness: KpCancellationWitness;
  readonly sources: readonly (KpWitnessedAnnihilationSource & {
    readonly rect: KpMaterialJunctionRect;
  })[];
  readonly survivors: readonly KpWitnessedAnnihilationSurvivor[];
  readonly contactPoint: { readonly x: number; readonly y: number };
  readonly contactStart: number;
  readonly contactEnd: number;
  readonly compressionEnd: number;
  readonly witnessBirthStart: number;
  readonly witnessReadableAt: number;
  readonly witnessDwellEnd: number;
  readonly sourceAbsorptionEnd: number;
  readonly witnessAbsorptionEnd: number;
  readonly compactionStart: number;
  readonly compactionEnd: number;
  readonly compressedScale: number;
  readonly motionProfile: KpWitnessedAnnihilationMotionProfileV1;
}

export interface KpWitnessedAnnihilationPose {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
}

export interface KpWitnessedAnnihilationFrame {
  readonly kind: "witnessed-annihilation-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phase:
    | "orient"
    | "contact"
    | "compress"
    | "witness-dwell"
    | "absorb"
    | "compact"
    | "settled";
  readonly contactProgress: number;
  readonly compressionProgress: number;
  readonly inwardPulse: number;
  readonly witnessReadable: boolean;
  readonly witnessDwellProgress: number;
  readonly witnessAbsorptionProgress: number;
  readonly survivorCompactionProgress: number;
  readonly sources: readonly {
    readonly id: string;
    readonly pose: KpWitnessedAnnihilationPose;
  }[];
  readonly witness: {
    readonly descriptorId: KpCancellationWitness["descriptorId"];
    readonly latex: "0" | "1";
    readonly slotId: string;
    readonly pose: KpWitnessedAnnihilationPose;
  };
  readonly survivors: readonly {
    readonly id: string;
    readonly pose: KpWitnessedAnnihilationPose;
    readonly nativeOpacity: number;
  }[];
}

export function createKpWitnessedAnnihilationPlan(input: {
  readonly id: string;
  readonly witness: KpCancellationWitness;
  readonly sources: readonly KpWitnessedAnnihilationSource[];
  readonly measurements: Readonly<Record<string, KpMaterialJunctionRect>>;
  readonly survivors: readonly KpWitnessedAnnihilationSurvivor[];
  readonly compressedScale?: number | undefined;
  readonly motionProfile?: KpWitnessedAnnihilationMotionProfileV1 | undefined;
}): KpWitnessedAnnihilationPlan {
  const motionProfile = input.motionProfile ??
    kpWitnessedAnnihilationMotionProfileV1;
  if (input.sources.length < motionProfile.geometry.minimumSourceCount) {
    throw new Error("Witnessed annihilation requires at least two canceling sources.");
  }
  const witnessSources = new Set(input.witness.slot.sourceSelectorIds);
  const coveredSelectors = new Set(input.sources.flatMap((source) => source.selectorIds));
  if (
    witnessSources.size !== coveredSelectors.size ||
    [...witnessSources].some((id) => !coveredSelectors.has(id))
  ) {
    throw new Error("Annihilation sources must exactly cover the witness-owned cancellation slot.");
  }
  const ids = new Set<string>();
  const sources = input.sources.map((source) => {
    if (ids.has(source.id)) throw new Error(`Duplicate annihilation source ${source.id}.`);
    ids.add(source.id);
    if (!Number.isInteger(source.semanticRank) || source.semanticRank < 0) {
      throw new Error(`Annihilation source ${source.id} requires a nonnegative semantic rank.`);
    }
    const rect = input.measurements[source.id];
    if (rect === undefined) throw new Error(`Annihilation source ${source.id} lacks measured geometry.`);
    validateRect(rect, source.id);
    return { ...source, selectorIds: [...source.selectorIds], rect: { ...rect } };
  });
  input.survivors.forEach((survivor) => {
    validateRect(survivor.sourceRect, `${survivor.id}.sourceRect`);
    validateRect(survivor.targetRect, `${survivor.id}.targetRect`);
  });
  const compressedScale = input.compressedScale ??
    motionProfile.geometry.defaultCompressedScale;
  if (!Number.isFinite(compressedScale) || compressedScale <= 0 || compressedScale > 1) {
    throw new Error("compressedScale must preserve visible material at or below native size.");
  }
  const bounds = unionRect(sources.map((source) => source.rect));
  return {
    kind: "witnessed-annihilation-plan",
    id: input.id,
    styleId: "gestalt.organic-subtle.annihilation-v0",
    witness: input.witness,
    sources,
    survivors: input.survivors.map((survivor) => ({
      ...survivor,
      sourceSelectorIds: [...survivor.sourceSelectorIds],
      targetSelectorIds: [...survivor.targetSelectorIds],
      sourceRect: { ...survivor.sourceRect },
      targetRect: { ...survivor.targetRect }
    })),
    contactPoint: center(bounds),
    ...motionProfile.timing,
    compressedScale,
    motionProfile
  };
}

export function sampleKpWitnessedAnnihilation(input: {
  readonly plan: KpWitnessedAnnihilationPlan;
  readonly progress: number;
}): KpWitnessedAnnihilationFrame {
  const p = clamp01(input.progress);
  const contactProgress = easeInOut(interval(
    p,
    input.plan.contactStart,
    input.plan.contactEnd
  ));
  const compressionProgress = easeInOut(interval(
    p,
    input.plan.contactEnd - input.plan.motionProfile.timing.compressionLead,
    input.plan.compressionEnd
  ));
  const witnessBirth = easeOut(interval(
    p,
    input.plan.witnessBirthStart,
    input.plan.witnessReadableAt
  ));
  const witnessReadable = p >= input.plan.witnessReadableAt;
  const witnessDwellProgress = interval(
    p,
    input.plan.witnessReadableAt,
    input.plan.witnessDwellEnd
  );
  const sourceAbsorption = easeInOut(interval(
    p,
    input.plan.witnessBirthStart +
      input.plan.motionProfile.timing.sourceAbsorptionDelay,
    input.plan.sourceAbsorptionEnd
  ));
  const witnessAbsorptionProgress = easeInOut(interval(
    p,
    input.plan.witnessDwellEnd,
    input.plan.witnessAbsorptionEnd
  ));
  const survivorCompactionProgress = easeInOut(interval(
    p,
    input.plan.compactionStart,
    input.plan.compactionEnd
  ));
  const inwardPulse = Math.sin(
    Math.PI * interval(
      p,
      input.plan.contactEnd - input.plan.motionProfile.timing.inwardPulseLead,
      input.plan.witnessReadableAt +
        input.plan.motionProfile.timing.inwardPulseTail
    )
  );
  const orderedSources = [...input.plan.sources].sort(
    (left, right) => left.semanticRank - right.semanticRank || left.id.localeCompare(right.id)
  );
  const geometryProfile = input.plan.motionProfile.geometry;
  const pairContactSpacing =
    orderedSources.length === geometryProfile.binarySourceCount
    ? Math.max(
        geometryProfile.minimumPairContactGapPx,
        orderedSources.reduce((sum, source) => sum + source.rect.width, 0) *
          input.plan.compressedScale / geometryProfile.binarySourceCount +
          geometryProfile.minimumPairContactGapPx
      )
    : 0;
  const sources = orderedSources.map((source, index) => {
    const origin = center(source.rect);
    const centeredIndex = index - (orderedSources.length - 1) / 2;
    // Binary inverses flank the witness; multi-token factors retain enough of
    // their internal topology to remain recognizable while compressing.
    const contactSlot =
      orderedSources.length === geometryProfile.binarySourceCount
      ? {
          x: input.plan.contactPoint.x + centeredIndex * pairContactSpacing,
          y: input.plan.contactPoint.y +
            (index % 2 === 0 ? -1 : 1) *
              geometryProfile.alternatingVerticalNudgePx
        }
      : {
          x: input.plan.contactPoint.x +
            (origin.x - input.plan.contactPoint.x) *
              geometryProfile.multiSourceConvergenceRatio,
          y: input.plan.contactPoint.y +
            (origin.y - input.plan.contactPoint.y) *
              geometryProfile.multiSourceConvergenceRatio
        };
    const arc = index % 2 === 0 ? -1 : 1;
    return {
      id: source.id,
      pose: {
        x: (contactSlot.x - origin.x) * contactProgress,
        y:
          (contactSlot.y - origin.y) * contactProgress +
          arc * geometryProfile.alternatingArcHeightPx *
            Math.sin(Math.PI * contactProgress),
        scale: mix(1, input.plan.compressedScale, compressionProgress),
        opacity: 1 - sourceAbsorption
      }
    };
  });
  const witnessScale = geometryProfile.witnessInitialScale +
    geometryProfile.witnessScaleGrowth * witnessBirth;
  const witnessOpacity = witnessBirth * (1 - witnessAbsorptionProgress);
  const survivors = input.plan.survivors.map((survivor) => ({
    id: survivor.id,
    pose: {
      x: (center(survivor.targetRect).x - center(survivor.sourceRect).x) * survivorCompactionProgress,
      y: (center(survivor.targetRect).y - center(survivor.sourceRect).y) * survivorCompactionProgress,
      scale: mix(1, averageScale(survivor), survivorCompactionProgress),
      opacity: survivorCompactionProgress >= 1 ? 0 : 1
    },
    nativeOpacity: survivorCompactionProgress >= 1 ? 1 : 0
  }));
  return {
    kind: "witnessed-annihilation-frame",
    planId: input.plan.id,
    progress: p,
    phase: p >= 1
      ? "settled"
      : survivorCompactionProgress > 0
        ? "compact"
        : witnessAbsorptionProgress > 0
          ? "absorb"
          : witnessReadable
            ? "witness-dwell"
            : compressionProgress > 0
              ? "compress"
              : contactProgress > 0
                ? "contact"
                : "orient",
    contactProgress,
    compressionProgress,
    inwardPulse,
    witnessReadable,
    witnessDwellProgress,
    witnessAbsorptionProgress,
    survivorCompactionProgress,
    sources,
    witness: {
      descriptorId: input.plan.witness.descriptorId,
      latex: input.plan.witness.semanticValue.latex,
      slotId: input.plan.witness.slot.id,
      pose: {
        x: 0,
        y: -geometryProfile.witnessLiftPx *
          Math.sin(Math.PI * witnessBirth),
        scale: witnessScale,
        opacity: witnessOpacity
      }
    },
    survivors
  };
}

function unionRect(rects: readonly KpMaterialJunctionRect[]): KpMaterialJunctionRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: KpMaterialJunctionRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function averageScale(survivor: KpWitnessedAnnihilationSurvivor): number {
  return (
    survivor.targetRect.width / survivor.sourceRect.width +
    survivor.targetRect.height / survivor.sourceRect.height
  ) / 2;
}

function validateRect(rect: KpMaterialJunctionRect, path: string): void {
  if (
    !Number.isFinite(rect.left) || !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) || !Number.isFinite(rect.height) ||
    rect.width <= 0 || rect.height <= 0
  ) throw new Error(`${path} requires positive finite geometry.`);
}

function interval(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 3;
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach((child) => deepFreeze(child));
  return Object.freeze(value);
}
