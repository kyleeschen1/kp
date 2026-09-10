import {
  createKpNativeKatexHandoffTelemetry,
  measureKpStageRelativeRectDelta as rectDelta,
  type KpNativeKatexHandoffPaintObservation,
  type KpNativeKatexHandoffTelemetry,
  type KpNativeKatexPaintAtomObservation,
  type KpNativeKatexRenderedEndpointHandle,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  compileKpNativeKatexEndpointOwnershipObservation,
  type KpNativeKatexEndpointOwnershipView
} from "./native-katex-endpoint-ownership.ts";
import {
  normalizeKpStageRelativeRect,
  type KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import {
  type KpEquationMaterialLayerOwnerFrame,
  setKpEquationMaterialOwnerVisual,
  syncKpEquationMaterialLayer
} from "./equation-material-layer-dom.ts";
import type {
  KpEquationStructuralSuccessionIntent
} from "../animation/structural-succession-presentation.ts";
import {
  retireKpNativeKatexStructuralSuccessionPreservingPaint,
  syncKpNativeKatexStructuralSuccession
} from "./native-katex-structural-succession-renderer.ts";
import {
  attachKpNativeKatexTrackPaintGeometry,
  measureKpNativeKatexTextInkRect
} from "./native-katex-paint-geometry.ts";
import {
  composeKpNativeKatexSceneMaterialOwners,
  sampleKpNativeKatexSuccessorSynthesisScenePlans
} from "./native-katex-successor-synthesis.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "./native-katex-scene-track-sampling.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrackFrameContract,
  KpNativeKatexPaintPreservingRetirement,
  KpNativeKatexRendererDispositionContract,
  KpNativeKatexRendererSessionContract,
  KpNativeKatexSceneOwnershipFrameContract,
  KpNativeKatexSceneTrackFrameContract
} from "./native-katex-scene-track-contract.ts";
import {
  compileKpCollisionSafeReorderTracks,
  assertKpNativeKatexContributionMeasurement,
  createKpNativeKatexSceneAssembly,
  type KpNativeKatexSceneAssembly,
  compileKpCollisionSafeTransitTracks,
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexOperationTracks,
  compileKpNativeKatexProjectedTracks,
  compileKpNativeKatexSceneTracks,
  compileKpNativeKatexSemanticMotionTracks,
  compileKpNativeKatexSuccessorSynthesisScenePlans,
  compileKpQualityBoundedFanInTracks,
  createKpNativeKatexRendererReadyScenePlan,
  isKpNativeKatexRendererReadyScenePlan,
  partitionKpNativeKatexSuccessorOwnedTracks,
  reconcileKpNativeKatexScenes,
  type KpCompiledSymbolMotionContract,
  type KpEquationMotionStageOccupancy as O,
  type KpEquationOperationChoreography,
  type KpEquationProtectedTransitCertificate,
  type KpNativeKatexAtomLifecycle,
  type KpNativeKatexHierarchicalScenePlan,
  type KpNativeKatexFactoringSceneBinding,
  type KpNativeKatexHandoffCorrelation,
  type KpNativeKatexPaintMeasuredSceneTrack,
  KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION,
  type KpNativeKatexRendererReadyScenePlan,
  type KpNativeKatexSceneReconciliation,
  type KpNativeKatexSceneTrack,
  type KpNativeKatexSemanticPaintRelation,
  type KpNativeKatexSuccessorSynthesisIntent,
  type KpNativeKatexTrackProjection
} from "./native-katex-base-scene-plan.ts";

export type KpNativeKatexSceneTrackFrame =
  KpNativeKatexSceneTrackFrameContract<KpNativeKatexAtomLifecycle,
    KpNativeKatexPaintAtomObservation["paintKind"], KpStageRelativeRect>;
export type KpNativeKatexPaintMeasuredSceneTrackFrame =
  KpNativeKatexPaintMeasuredSceneTrackFrameContract<
    KpNativeKatexSceneTrackFrame, KpStageRelativeRect>;
export type KpNativeKatexSceneOwnershipFrame =
  KpNativeKatexSceneOwnershipFrameContract<KpNativeKatexSceneTrackFrame>;
export type KpNativeKatexRendererDisposition =
  KpNativeKatexRendererDispositionContract;
export interface KpNativeKatexRendererSession extends
  KpNativeKatexRendererSessionContract<KpNativeKatexRendererDisposition,
    KpNativeKatexSceneTrack, KpNativeKatexSceneTrackFrame,
    KpNativeKatexSceneOwnershipFrame> {}

const kpExecutableNativeKatexSceneSessionBrand: unique symbol = Symbol(
  "kp.executable-native-katex-scene-session"
);
const kpCanonicalNativeKatexCarrierSceneSessionBrand: unique symbol = Symbol(
  "kp.canonical-native-katex-carrier-scene-session"
);

export interface KpNativeKatexExecutableMotionEvidence {
  readonly kind: "native-katex-executable-motion-evidence";
  readonly sampledProgresses: readonly [0, 0.25, 0.5, 0.75, 1];
  readonly dynamicTrackIds: readonly [string, ...string[]];
}

export type KpNativeKatexScenePaintReadiness = Readonly<{
  readonly status: "preparing" | "ready" | "unavailable";
  readonly reason?: string | undefined;
}>;

export interface KpNativeKatexSceneSessionOptions {
  /** Reserve structural paint before semantic time is allowed to advance. */
  readonly eagerStructuralPaint?: boolean | undefined;
  readonly onPaintReadinessChange?: (
    readiness: KpNativeKatexScenePaintReadiness
  ) => void;
}

export interface KpCanonicalNativeKatexSceneSession {
  readonly kind: "canonical-native-katex-scene-session";
  readonly lifecycle: "renderer-session";
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly hierarchy: KpNativeKatexHierarchicalScenePlan;
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly session: KpNativeKatexRendererSession;
  readonly readPaintReadiness: () => KpNativeKatexScenePaintReadiness;
  readonly executableMotion: KpNativeKatexExecutableMotionEvidence;
  readonly [kpExecutableNativeKatexSceneSessionBrand]: true;
}

/**
 * A carrier session owns measured native/material paint but is not runnable on
 * its own. Certified external motion must wrap it before a host publishes
 * readiness; ordinary compositor callers continue to require executable
 * measured tracks from createKpCanonicalNativeKatexSceneSession.
 */
export interface KpCanonicalNativeKatexCarrierSceneSession {
  readonly kind: "canonical-native-katex-carrier-scene-session";
  readonly lifecycle: "renderer-session";
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly hierarchy: KpNativeKatexHierarchicalScenePlan;
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly session: KpNativeKatexRendererSession;
  readonly readPaintReadiness: () => KpNativeKatexScenePaintReadiness;
  readonly [kpCanonicalNativeKatexCarrierSceneSessionBrand]: true;
}

export interface KpCanonicalNativeKatexPureScenePlan {
  readonly kind: "canonical-native-katex-pure-scene-plan";
  readonly lifecycle: "pure-measured-plan";
  readonly inputTrackSignature: string;
  readonly inputGeometry: readonly number[];
  readonly tracks: readonly KpNativeKatexSceneTrack[];
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
}

export interface KpCanonicalNativeKatexSceneInput {
  readonly source: KpCanonicalNativeKatexEndpointInput;
  readonly target: KpCanonicalNativeKatexEndpointInput;
  readonly relations: readonly KpNativeKatexSemanticPaintRelation[];
  readonly structuralSuccession?: KpEquationStructuralSuccessionIntent;
  readonly structuralMotion?: "full" | "checkpoint";
  readonly successorSyntheses?:
    readonly KpNativeKatexSuccessorSynthesisIntent[] | undefined;
  readonly factoring?: KpNativeKatexFactoringSceneBinding;
  readonly operationChoreography?: KpEquationOperationChoreography;
  readonly trackProjection?: KpNativeKatexTrackProjection | undefined;
  readonly symbolMotionContract?: KpCompiledSymbolMotionContract | undefined;
  readonly fanInRouting?: boolean;
  readonly copyFanOutRouting?: boolean;
  readonly horizontalAxisSemanticEntityIds?: readonly string[] | undefined;
  readonly reorderRouting?: boolean;
  readonly endpointDwellFraction?: number | undefined;
  readonly stageOccupancy?: O;
  readonly purePlan?: KpCanonicalNativeKatexPureScenePlan | undefined;
}

export type KpCanonicalNativeKatexEndpointInput =
  | KpNativeKatexRenderedSceneObservation
  | KpNativeKatexRenderedEndpointHandle
  | KpNativeKatexEndpointOwnershipView;

type KpResolvedCanonicalNativeKatexSceneInput = Omit<
  KpCanonicalNativeKatexSceneInput,
  "source" | "target"
> & {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
};

export function sampleKpNativeKatexEndpointDwellProgress(
  progress: number,
  dwellFraction: number
): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Native KaTeX endpoint dwell progress must be finite.");
  }
  if (
    !Number.isFinite(dwellFraction) ||
    dwellFraction < 0 ||
    dwellFraction > 0.25
  ) {
    throw new Error(
      "Native KaTeX endpoint dwell ratio must be between 0 and 0.25."
    );
  }
  const bounded = Math.max(0, Math.min(1, progress));
  if (dwellFraction === 0 || bounded === 0 || bounded === 1) {
    return bounded;
  }
  return Math.min(1, bounded / (1 - dwellFraction));
}

export function decideKpNativeKatexRendererDisposition(input: {
  readonly ambiguityIds: readonly string[];
  readonly blockedGeometryIds: readonly string[];
  readonly unsupportedTypographyIds?: readonly string[] | undefined;
}): KpNativeKatexRendererDisposition {
  const selected = ([
    ["semantic-ambiguity", input.ambiguityIds],
    ["blocked-geometry", input.blockedGeometryIds],
    ["unsupported-typography", input.unsupportedTypographyIds ?? []]
  ] as const).find(([, ids]) => ids.length > 0);
  const reason = selected?.[0] ?? "clear";
  return Object.freeze({
    mode: reason === "clear" ? "motion" : "checkpoint-settlement",
    reason,
    affectedIds: Object.freeze([...new Set(selected?.[1] ?? [])])
  });
}

export interface KpNativeKatexHandoffOwnershipSample {
  readonly progress: number;
  readonly visualOwner: KpNativeKatexSceneOwnershipFrame["visualOwner"];
  readonly sourceNativeOpacity: 0 | 1;
  readonly materialSceneOpacity: 0 | 1;
  readonly targetNativeOpacity: 0 | 1;
  readonly visibleMaterialOwnerIds: readonly string[];
  readonly glyphStyleMismatchIds: readonly string[];
  readonly maximumGlyphRectResidualPx: number;
  readonly maximumGlyphBaselineResidualPx: number;
  readonly maximumRuleGeometryResidualPx: number;
}

export type KpNativeKatexTypographyHandoffCompatibility =
  | "style-compatible"
  | "transform-compatible"
  | "unsupported";

export type KpNativeKatexTypographyHandoffReason =
  | "paint-mismatch"
  | "style-mismatch"
  | "shape-mismatch"
  | "clip-mismatch"
  | "font-revision-mismatch"
  | "translation-exceeds-bound"
  | "scale-exceeds-bound";

export interface KpNativeKatexTypographyHandoffAssessment {
  readonly kind: "native-katex-typography-handoff-assessment";
  readonly lifecycle: "renderer-session";
  readonly id: string;
  readonly compatibility: KpNativeKatexTypographyHandoffCompatibility;
  readonly translateX: number;
  readonly translateY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly stretchRatio: number;
  readonly settlement: "continuous" | "native-checkpoint";
  readonly reasons: readonly KpNativeKatexTypographyHandoffReason[];
}

export interface KpNativeKatexTypographyHandoffLaw {
  readonly kind: "native-katex-typography-handoff-law";
  readonly lifecycle: "renderer-session";
  readonly status: "continuous" | "native-checkpoint";
  readonly assessments: readonly KpNativeKatexTypographyHandoffAssessment[];
  readonly unsupportedIds: readonly string[];
}

export interface KpNativeKatexTypographyHandoffSelection {
  readonly kind: "native-katex-typography-handoff-selection";
  readonly lifecycle: "renderer-session";
  readonly selectedModel:
    | "target-style-reverse-flip"
    | "native-checkpoint-settlement";
  readonly law: KpNativeKatexTypographyHandoffLaw;
}

interface KpNativeKatexTypographyStylePlanEntryBase {
  readonly id: string;
  readonly materialOwnerId: string;
  readonly componentId: string;
  readonly atomLifecycle: KpNativeKatexAtomLifecycle;
  readonly targetPaintAtomId: string;
  readonly model:
    | "target-style-reverse-flip"
    | "native-checkpoint-settlement";
  readonly targetRect: KpStageRelativeRect;
  readonly inverseTranslateX: number;
  readonly inverseTranslateY: number;
  readonly inverseScaleX: number;
  readonly inverseScaleY: number;
  readonly targetStyleFingerprint: string;
}

interface KpNativeKatexTargetGlyphPaintFrame {
  readonly targetInsetX: number;
  readonly targetInsetY: number;
  readonly targetWidth: number;
  readonly targetHeight: number;
}

export type KpNativeKatexTypographyStylePlanEntry =
  KpNativeKatexTypographyStylePlanEntryBase & (
    | {
      readonly paintKind: "glyph";
      readonly paintRealization:
        | "preserve-source-glyph"
        | "realize-target-glyph";
      readonly glyphPaintFrame?: {
        readonly sourceLeft: number;
        readonly sourceTop: number;
        readonly sourceInsetX: number;
        readonly sourceInsetY: number;
        readonly targetInsetX: number;
        readonly targetInsetY: number;
        readonly sourceScale: number;
      } | undefined;
      readonly targetGlyphPaintFrame?:
        KpNativeKatexTargetGlyphPaintFrame | undefined;
    }
    | {
      readonly paintKind: KpNativeKatexPaintAtomObservation["paintKind"];
      readonly paintRealization: "preserve-structural-paint";
      readonly glyphPaintFrame?: undefined;
      readonly targetGlyphPaintFrame?: undefined;
    }
  );

export interface KpNativeKatexTypographyStylePlan {
  readonly kind: "native-katex-typography-style-plan";
  readonly lifecycle: "renderer-session";
  readonly model:
    | "target-style-reverse-flip"
    | "native-checkpoint-settlement";
  readonly entries: readonly KpNativeKatexTypographyStylePlanEntry[];
}

export interface KpNativeKatexTypographyStyleFrame {
  readonly kind: "native-katex-typography-style-frame";
  readonly lifecycle: "renderer-session";
  readonly progress: number;
  readonly entries: readonly {
    readonly id: string;
    readonly translateX: number;
    readonly translateY: number;
    readonly scaleX: number;
    readonly scaleY: number;
    readonly expectedPaintRect?: KpStageRelativeRect | undefined;
  }[];
}

export interface KpNativeKatexTypographyRealization {
  readonly kind: "native-katex-typography-realization";
  readonly lifecycle: "renderer-session";
  readonly realizedIds: readonly string[];
  readonly deferredIds: readonly string[];
  readonly deferred: readonly {
    readonly id: string;
    readonly disposition:
      | "preserve-source-glyph"
      | "preserve-structural-paint"
      | "native-checkpoint";
  }[];
  readonly nativeMutationCount: 0;
}

export function sampleKpNativeKatexSceneTracks(
  tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[],
  progress: number,
  copyFanOut?: boolean
): readonly KpNativeKatexPaintMeasuredSceneTrackFrame[];
export function sampleKpNativeKatexSceneTracks(
  tracks: readonly KpNativeKatexSceneTrack[],
  progress: number,
  copyFanOut?: boolean
): readonly KpNativeKatexSceneTrackFrame[];
export function sampleKpNativeKatexSceneTracks(
  tracks: readonly KpNativeKatexSceneTrack[],
  progress: number,
  copyFanOut = false
): readonly KpNativeKatexSceneTrackFrame[] {
  return sampleKpNativeKatexSceneTrackFrames(tracks, progress, copyFanOut);
}

export function correlateKpNativeKatexSceneHandoff(input: {
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
}): readonly KpNativeKatexHandoffCorrelation[] {
  const trackIds = input.tracks.map(({ id }) => id);
  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Native handoff correlation requires unique track IDs.");
  }
  const sourceById = new Map(input.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const dispositionsByComponentId = new Map(
    input.reconciliation.dispositions.map((disposition) => [
      `component.${disposition.id}`,
      disposition
    ])
  );
  const correlations = [...input.tracks].sort((left, right) =>
    left.id.localeCompare(right.id)
  ).map((sceneTrack) => {
    const disposition = dispositionsByComponentId.get(sceneTrack.componentId);
    if (disposition === undefined) {
      throw new Error(
        `Scene track ${sceneTrack.id} has no reconciliation disposition.`
      );
    }
    if (disposition.lifecycle !== sceneTrack.lifecycle) {
      throw new Error(
        `Scene track ${sceneTrack.id} disagrees with its disposition lifecycle.`
      );
    }
    const visualAtom = sourceById.get(sceneTrack.visualAtomId) ??
      targetById.get(sceneTrack.visualAtomId);
    if (visualAtom === undefined) {
      throw new Error(
        `Scene track ${sceneTrack.id} references unknown visual atom ` +
        `${sceneTrack.visualAtomId}.`
      );
    }
    const targetAtomId =
      sceneTrack.targetAtomId !== undefined &&
      disposition.targetAtomIds.includes(sceneTrack.targetAtomId)
        ? sceneTrack.targetAtomId
        : undefined;
    if (
      disposition.targetAtomIds.length > 0 &&
      (targetAtomId === undefined || !targetById.has(targetAtomId))
    ) {
      throw new Error(
        `Scene track ${sceneTrack.id} has no lineage-backed native target atom.`
      );
    }
    if (
      disposition.targetAtomIds.length === 0 &&
      sceneTrack.lifecycle !== "eliminate"
    ) {
      throw new Error(
        `Scene track ${sceneTrack.id} lacks a native target without departing.`
      );
    }
    const semanticEntityId = targetAtomId === undefined
      ? visualAtom.semanticEntityId
      : targetById.get(targetAtomId)!.semanticEntityId;
    return Object.freeze({
      kind: "native-katex-handoff-correlation" as const,
      lifecycle: "renderer-session" as const,
      id: `handoff.${sceneTrack.id}`,
      materialOwnerId: `native-scene-owner.${sceneTrack.id}`,
      trackId: sceneTrack.id,
      componentId: sceneTrack.componentId,
      atomLifecycle: sceneTrack.lifecycle,
      visualAtomId: sceneTrack.visualAtomId,
      ...(sceneTrack.sourceAtomId === undefined
        ? {}
        : { sourceAtomId: sceneTrack.sourceAtomId }),
      ...(targetAtomId === undefined ? {} : { targetAtomId }),
      semanticEntityId,
      disposition: targetAtomId === undefined
        ? "departing-without-native-target" as const
        : "target-bound" as const
    });
  });
  const coveredTargets = new Set(correlations.flatMap(({ targetAtomId }) =>
    targetAtomId === undefined ? [] : [targetAtomId]
  ));
  const missingTarget = input.reconciliation.target.atoms.find(({ id }) =>
    !coveredTargets.has(id)
  );
  if (missingTarget !== undefined) {
    throw new Error(
      `Native target atom ${missingTarget.id} has no material handoff correlation.`
    );
  }
  const ownerIds = correlations.map(({ materialOwnerId }) => materialOwnerId);
  if (new Set(ownerIds).size !== ownerIds.length) {
    throw new Error("Native handoff correlation repeats a material owner.");
  }
  return Object.freeze(correlations);
}

type KpNativeKatexHandoffMeasurementInput = {
  readonly stage: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly progress: number;
  readonly fontRevision: number;
  readonly viewportKey: string;
};

export function measureKpNativeKatexGlyphHandoff(
  input: KpNativeKatexHandoffMeasurementInput
): KpNativeKatexHandoffTelemetry {
  return measureKpNativeKatexHandoff(input, "glyph");
}

export function measureKpNativeKatexRuleHandoff(
  input: KpNativeKatexHandoffMeasurementInput
): KpNativeKatexHandoffTelemetry {
  return measureKpNativeKatexHandoff(input, "rule");
}

// One construction path prevents public handoff microscopes from drifting.
function measureKpNativeKatexHandoff(
  input: KpNativeKatexHandoffMeasurementInput,
  mode: "glyph" | "rule" | "correlated"
): KpNativeKatexHandoffTelemetry {
  const sourceById = new Map(input.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const observations = input.correlations.flatMap((correlation) => {
    if (correlation.disposition !== "target-bound") return [];
    const target = targetById.get(correlation.targetAtomId!)!;
    if (mode !== "correlated" && target?.paintKind !== mode) return [];
    const visual = mode === "correlated"
      ? sourceById.get(correlation.visualAtomId) ??
        targetById.get(correlation.visualAtomId)
      : target;
    const source = correlation.sourceAtomId === undefined
      ? undefined
      : sourceById.get(correlation.sourceAtomId);
    if (target === undefined || visual === undefined) {
      throw new Error(
        `Correlated handoff ${correlation.id} references missing paint.`
      );
    }
    const materialOwner = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${
        CSS.escape(correlation.materialOwnerId)
      }"]`
    );
    const materialVisual = materialOwner?.firstElementChild;
    if (
      materialOwner === null ||
      !(materialVisual instanceof HTMLElement)
    ) {
      throw new Error(
        mode === "correlated"
          ? `Correlated handoff cannot find ${correlation.materialOwnerId}.`
          : `Native handoff microscope cannot find ${correlation.materialOwnerId}.`
      );
    }
    const observe = (
      suffix: "source" | "material" | "native",
      side: "native-source" | "material" | "native-target",
      element: HTMLElement,
      rectElement: HTMLElement,
      atom: KpNativeKatexPaintAtomObservation
    ) => observeCorrelatedHandoffPaint({
      id: `${correlation.id}.${suffix}`,
      side,
      stage: input.stage,
      element,
      rectElement,
      atom,
      fontRevision: input.fontRevision
    });
    return [
      ...(mode === "correlated" && source !== undefined
        ? [observe(
            "source", "native-source", source.sourceElement,
            source.sourceElement, source
          )]
        : []),
      observe("material", "material", materialVisual, materialOwner, visual),
      observe(
        "native", "native-target", target.sourceElement,
        target.sourceElement, target
      )
    ];
  });
  if (observations.length === 0) {
    throw new Error(mode === "correlated"
      ? "Correlated handoff microscope requires target-bound paint."
      : `Native handoff microscope requires correlated ${mode} paint.`);
  }
  return createKpNativeKatexHandoffTelemetry({
    stage: input.stage,
    progress: input.progress,
    observations,
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey
  });
}

export function measureKpNativeKatexCorrelatedHandoff(
  input: KpNativeKatexHandoffMeasurementInput
): KpNativeKatexHandoffTelemetry {
  return measureKpNativeKatexHandoff(input, "correlated");
}

export function assessKpNativeKatexTypographyHandoff(input: {
  readonly from: KpNativeKatexHandoffTelemetry["observations"][number];
  readonly to: KpNativeKatexHandoffTelemetry["observations"][number];
  readonly tolerancePx: number;
  readonly maximumTranslationPx: number;
  readonly maximumScaleRatio: number;
}): KpNativeKatexTypographyHandoffAssessment {
  requireNonnegativeFinite(input.tolerancePx, "handoff tolerance");
  requireNonnegativeFinite(
    input.maximumTranslationPx,
    "maximum handoff translation"
  );
  if (
    !Number.isFinite(input.maximumScaleRatio) ||
    input.maximumScaleRatio < 1
  ) {
    throw new Error("Maximum handoff scale ratio must be finite and at least one.");
  }

  const translateX = input.to.rect.left - input.from.rect.left;
  const translateY =
    input.from.baselineY === null || input.to.baselineY === null
      ? input.to.rect.top - input.from.rect.top
      : input.to.baselineY - input.from.baselineY;
  const scaleX = safeScale(input.to.rect.width, input.from.rect.width);
  const scaleY = safeScale(input.to.rect.height, input.from.rect.height);
  const stretchRatio = maximum([
    symmetricScaleRatio(scaleX),
    symmetricScaleRatio(scaleY)
  ]);
  const reasons: KpNativeKatexTypographyHandoffReason[] = [];

  if (
    input.from.paintKind !== input.to.paintKind ||
    input.from.paintFingerprint !== input.to.paintFingerprint
  ) {
    reasons.push("paint-mismatch");
  }
  if (input.from.fontRevision !== input.to.fontRevision) {
    reasons.push("font-revision-mismatch");
  }
  if (input.from.clipPath !== input.to.clipPath) {
    reasons.push("clip-mismatch");
  }
  if (
    (input.from.baselineY === null) !== (input.to.baselineY === null) ||
    !compatibleRuleAxis(input.from, input.to)
  ) {
    reasons.push("shape-mismatch");
  }
  if (
    Math.abs(translateX) > input.maximumTranslationPx ||
    Math.abs(translateY) > input.maximumTranslationPx
  ) {
    reasons.push("translation-exceeds-bound");
  }
  if (
    !Number.isFinite(stretchRatio) ||
    stretchRatio > input.maximumScaleRatio
  ) {
    reasons.push("scale-exceeds-bound");
  }

  const sameStyle =
    input.from.styleFingerprint === input.to.styleFingerprint;
  const transformableStyle = sameStyle || handoffStylesAreTransformable(
    input.from,
    input.to
  );
  if (!transformableStyle) reasons.push("style-mismatch");

  const shapeResidual = maximum([
    Math.abs(input.to.rect.width - input.from.rect.width),
    Math.abs(input.to.rect.height - input.from.rect.height)
  ]);
  const compatibility = reasons.length > 0
    ? "unsupported"
    : sameStyle && shapeResidual <= input.tolerancePx
      ? "style-compatible"
      : "transform-compatible";
  return Object.freeze({
    kind: "native-katex-typography-handoff-assessment",
    lifecycle: "renderer-session",
    id: correlationId(input.from.id),
    compatibility,
    translateX,
    translateY,
    scaleX,
    scaleY,
    stretchRatio,
    settlement: compatibility === "unsupported"
      ? "native-checkpoint"
      : "continuous",
    reasons: Object.freeze([...new Set(reasons)].sort())
  });
}

export function evaluateKpNativeKatexTypographyHandoffLaw(input: {
  readonly telemetry: KpNativeKatexHandoffTelemetry;
  readonly tolerancePx: number;
  readonly maximumTranslationPx: number;
  readonly maximumScaleRatio: number;
}): KpNativeKatexTypographyHandoffLaw {
  const assessments = handoffTelemetryGroups(input.telemetry).map(
    ({ material, native }) => assessKpNativeKatexTypographyHandoff({
      from: material,
      to: native,
      tolerancePx: input.tolerancePx,
      maximumTranslationPx: input.maximumTranslationPx,
      maximumScaleRatio: input.maximumScaleRatio
    })
  );
  const unsupportedIds = assessments
    .filter(({ compatibility }) => compatibility === "unsupported")
    .map(({ id }) => id);
  return Object.freeze({
    kind: "native-katex-typography-handoff-law",
    lifecycle: "renderer-session",
    status: unsupportedIds.length === 0
      ? "continuous"
      : "native-checkpoint",
    assessments: Object.freeze(assessments),
    unsupportedIds: Object.freeze(unsupportedIds)
  });
}

export function selectKpNativeKatexTypographyHandoffModel(input: {
  readonly telemetry: KpNativeKatexHandoffTelemetry;
  readonly tolerancePx: number;
  readonly maximumTranslationPx: number;
  readonly maximumScaleRatio: number;
}): KpNativeKatexTypographyHandoffSelection {
  const law = evaluateKpNativeKatexTypographyHandoffLaw(input);
  const groups = handoffTelemetryGroups(input.telemetry);
  const hasExactLineagePaintFrames = groups.every(
    ({ source, material, native }) =>
      source !== undefined &&
      source.paintKind === "glyph" &&
      material.paintKind === "glyph" &&
      native.paintKind === "glyph" &&
      source.paintFingerprint === native.paintFingerprint &&
      source.fontRevision === native.fontRevision &&
      source.clipPath === native.clipPath
  );
  return Object.freeze({
    kind: "native-katex-typography-handoff-selection",
    lifecycle: "renderer-session",
    selectedModel: law.status === "continuous" || hasExactLineagePaintFrames
      ? "target-style-reverse-flip"
      : "native-checkpoint-settlement",
    law
  });
}

export function compileKpNativeKatexTypographyStylePlan(input: {
  readonly telemetry: KpNativeKatexHandoffTelemetry;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly tolerancePx: number;
  readonly maximumTranslationPx: number;
  readonly maximumScaleRatio: number;
}): KpNativeKatexTypographyStylePlan {
  const planModel = selectKpNativeKatexTypographyHandoffModel(input)
    .selectedModel;
  const targetBound = input.correlations.filter(
    ({ disposition }) => disposition === "target-bound"
  );
  assertUniqueTypographyStyleIds(targetBound.map(({ id }) => id));
  const correlationById = new Map(
    targetBound.map((correlation) => [correlation.id, correlation])
  );
  const entries = handoffTelemetryGroups(input.telemetry).map(
    ({ source, material, native }) => {
      const id = correlationId(material.id);
      const correlation = correlationById.get(id);
      if (correlation === undefined) {
        throw new Error(
          `Typography style plan cannot find scene correlation ${id}.`
        );
      }
      correlationById.delete(id);
      if (
        correlation.targetAtomId === undefined ||
        correlation.targetAtomId !== native.paintAtomId
      ) {
        throw new Error(
          `Typography style plan ${id} has no matching target paint atom.`
        );
      }
      // Unrelated introduced glyphs cannot downgrade this semantic handoff.
      const model = selectKpNativeKatexTypographyHandoffModel({
        ...input,
        telemetry: {
          ...input.telemetry,
          observations: source === undefined
            ? [material, native]
            : [source, material, native]
        }
      }).selectedModel;
      const shared = {
        id,
        materialOwnerId: correlation.materialOwnerId,
        componentId: correlation.componentId,
        atomLifecycle: correlation.atomLifecycle,
        targetPaintAtomId: correlation.targetAtomId,
        model,
        targetRect: native.rect,
        inverseTranslateX: model === "native-checkpoint-settlement"
          ? 0
          : material.rect.left - native.rect.left,
        inverseTranslateY: model === "native-checkpoint-settlement"
          ? 0
          : material.baselineY === null || native.baselineY === null
            ? material.rect.top - native.rect.top
            : material.baselineY - native.baselineY,
        inverseScaleX: model === "native-checkpoint-settlement"
          ? 1
          : safeScale(material.rect.width, native.rect.width),
        inverseScaleY: model === "native-checkpoint-settlement"
          ? 1
          : safeScale(material.rect.height, native.rect.height),
        targetStyleFingerprint: native.styleFingerprint
      } as const;
      if (
        native.paintKind !== "glyph" ||
        native.paintMeasurement === "subtree"
      ) {
        return freezeTypographyStylePlanEntry({
          ...shared,
          paintKind: native.paintKind,
          paintRealization: "preserve-structural-paint"
        });
      }
      const glyphPaintFrame = source === undefined
        ? undefined
        : createGlyphPaintFrame(input.telemetry.stage, source, native);
      const targetGlyphPaintFrame = source === undefined
        ? createTargetGlyphPaintFrame(input.telemetry.stage, native)
        : undefined;
      const paintRealization = selectKpNativeKatexGlyphPaintRealization({
        source,
        target: native,
        sourceInkScale: glyphPaintFrame?.sourceScale
      });
      return freezeTypographyStylePlanEntry({
        ...shared,
        paintKind: "glyph",
        paintRealization,
        ...(glyphPaintFrame === undefined
          ? {}
          : { glyphPaintFrame }),
        ...(targetGlyphPaintFrame === undefined
          ? {}
          : { targetGlyphPaintFrame })
      });
    }
  );
  if (correlationById.size > 0) {
    throw new Error(
      "Typography style plan has target-bound correlations without telemetry."
    );
  }
  return Object.freeze({
    kind: "native-katex-typography-style-plan",
    lifecycle: "renderer-session",
    model: planModel,
    entries: Object.freeze(entries)
  });
}

export function selectKpNativeKatexGlyphPaintRealization(input: {
  readonly source?: KpNativeKatexHandoffPaintObservation | undefined;
  readonly target: KpNativeKatexHandoffPaintObservation;
  readonly sourceInkScale?: number | undefined;
}): "preserve-source-glyph" | "realize-target-glyph" {
  // Equal CSS fingerprints do not prove equal paint when a KaTeX wrapper
  // contributes scale. Preserve one clone only for measured same-size ink.
  const maximumSameSizeScaleRatio = 1.001;
  const source = input.source;
  return source !== undefined &&
      source.paintKind === "glyph" &&
      input.target.paintKind === "glyph" &&
      input.sourceInkScale !== undefined &&
      symmetricScaleRatio(input.sourceInkScale) <=
        maximumSameSizeScaleRatio &&
      source.paintFingerprint === input.target.paintFingerprint &&
      source.styleFingerprint === input.target.styleFingerprint &&
      source.fontRevision === input.target.fontRevision &&
      source.clipPath === input.target.clipPath
    ? "preserve-source-glyph"
    : "realize-target-glyph";
}

export function sampleKpNativeKatexTypographyStylePlan(
  plan: KpNativeKatexTypographyStylePlan,
  progress: number,
  sceneFrames?: readonly KpNativeKatexSceneTrackFrame[]
): KpNativeKatexTypographyStyleFrame {
  if (!Number.isFinite(progress)) {
    throw new Error("Typography style progress must be finite.");
  }
  const bounded = Math.max(0, Math.min(1, progress));
  const sceneFrameByOwner = sceneFrames === undefined
    ? undefined
    : new Map(sceneFrames.map((frame) =>
      [`native-scene-owner.${frame.trackId}`, frame]));
  return Object.freeze({
    kind: "native-katex-typography-style-frame",
    lifecycle: "renderer-session",
    progress: bounded,
    entries: Object.freeze(plan.entries.map((entry) => {
      const sceneFrame = sceneFrameByOwner?.get(entry.materialOwnerId);
      if (sceneFrameByOwner !== undefined && sceneFrame === undefined) {
        throw new Error(
          `Typography style plan ${entry.id} has no scene frame.`
        );
      }
      if (
        sceneFrame?.metricProgress !== undefined &&
        entry.model === "native-checkpoint-settlement"
      ) {
        throw new Error(`${entry.id} cannot defer required metric interpolation.`);
      }
      const rect = sceneFrame?.rect;
      const eased = smoothstep(sceneFrame?.metricProgress ?? bounded);
      const paint = entry.glyphPaintFrame;
      if (paint !== undefined) {
        const typographyScale = lerp(paint.sourceScale, 1, eased);
        // Typography FLIP and motif-local contraction share one CSS transform
        // owner. Compose their scales and solve translation from the final
        // visible ink rect so neither authority silently overwrites the other.
        const scale = typographyScale * (sceneFrame?.materialScale ?? 1);
        const sampledLeft =
          rect?.left ?? lerp(paint.sourceLeft, entry.targetRect.left, eased);
        const sampledTop =
          rect?.top ?? lerp(paint.sourceTop, entry.targetRect.top, eased);
        const desiredPaintLeft =
          sceneFrame?.expectedPaintRect?.left ??
          sampledLeft + lerp(paint.sourceInsetX, paint.targetInsetX, eased);
        const desiredPaintTop =
          sceneFrame?.expectedPaintRect?.top ??
          sampledTop + lerp(paint.sourceInsetY, paint.targetInsetY, eased);
        return Object.freeze({
          id: entry.id,
          translateX:
            desiredPaintLeft -
            entry.targetRect.left -
            paint.targetInsetX * scale,
          translateY:
            desiredPaintTop -
            entry.targetRect.top -
            paint.targetInsetY * scale,
          // Uniform scaling keeps notation undistorted.
          scaleX: scale,
          scaleY: scale,
          ...(sceneFrame?.expectedPaintRect === undefined
            ? {}
            : { expectedPaintRect: sceneFrame.expectedPaintRect })
        });
      }
      const materialScale = entry.paintKind === "glyph"
        ? sceneFrame?.materialScale ?? 1
        : 1;
      const baseScaleX = rect === undefined
        ? lerp(entry.inverseScaleX, 1, eased)
        : safeScale(rect.width, entry.targetRect.width);
      const baseScaleY = rect === undefined
        ? lerp(entry.inverseScaleY, 1, eased)
        : safeScale(rect.height, entry.targetRect.height);
      const scaleX = baseScaleX * materialScale;
      const scaleY = baseScaleY * materialScale;
      const targetPaint = entry.paintRealization ===
          "preserve-structural-paint"
        ? undefined
        : entry.targetGlyphPaintFrame;
      if (
        materialScale !== 1 &&
        entry.paintKind === "glyph" &&
        targetPaint === undefined
      ) {
        throw new Error(
          `${entry.id} requires measured target ink to compose material scale.`
        );
      }
      const expectedPaint = sceneFrame?.expectedPaintRect;
      return Object.freeze({
        id: entry.id,
        translateX: expectedPaint !== undefined && targetPaint !== undefined
          ? expectedPaint.left - entry.targetRect.left -
            targetPaint.targetInsetX * scaleX
          : rect === undefined
            ? lerp(entry.inverseTranslateX, 0, eased)
            : rect.left - entry.targetRect.left,
        translateY: expectedPaint !== undefined && targetPaint !== undefined
          ? expectedPaint.top - entry.targetRect.top -
            targetPaint.targetInsetY * scaleY
          : rect === undefined
            ? lerp(entry.inverseTranslateY, 0, eased)
            : rect.top - entry.targetRect.top,
        scaleX,
        scaleY,
        ...(expectedPaint === undefined
          ? {}
          : { expectedPaintRect: expectedPaint })
      });
    }))
  });
}

export function realizeKpNativeKatexTypographyStylePlan(input: {
  readonly stage: HTMLElement;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpNativeKatexTypographyStylePlan;
  readonly frame?: KpNativeKatexTypographyStyleFrame | undefined;
}): KpNativeKatexTypographyRealization {
  const targetById = new Map(input.target.atoms.map((atom) => [atom.id, atom]));
  const styleFrame =
    input.frame ?? sampleKpNativeKatexTypographyStylePlan(input.plan, 0);
  const frameById = new Map(
    styleFrame.entries.map((entry) => [entry.id, entry])
  );
  if (frameById.size !== input.plan.entries.length) {
    throw new Error("Typography realization requires one style frame per entry.");
  }
  const realizedIds: string[] = [];
  const deferredIds: string[] = [];
  const deferred: Array<
    KpNativeKatexTypographyRealization["deferred"][number]
  > = [];
  for (const entry of input.plan.entries) {
    const disposition =
      selectKpNativeKatexTypographyRealizationDisposition(entry);
    if (disposition !== "html-clone") {
      deferredIds.push(entry.id);
      deferred.push(Object.freeze({
        id: entry.id,
        disposition
      }));
      continue;
    }
    const owner = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${
        CSS.escape(entry.materialOwnerId)
      }"]`
    );
    const target = targetById.get(entry.targetPaintAtomId);
    if (owner === null || target === undefined) {
      throw new Error(
        `Typography realization cannot find renderer paint for ${entry.id}.`
      );
    }
    const frame = frameById.get(entry.id);
    if (frame === undefined) {
      throw new Error(`Typography realization has no style frame for ${entry.id}.`);
    }
    const visual = setKpEquationMaterialOwnerVisual({
      owner,
      sourceElement: target.sourceElement,
      revisionKey:
        `target:${entry.targetPaintAtomId}:${entry.targetStyleFingerprint}`
    });
    const endpointIdentity = frame.translateX === 0 && frame.translateY === 0 &&
      frame.scaleX === 1 && frame.scaleY === 1;
    owner.style.left = `${entry.targetRect.left}px`;
    owner.style.top = `${entry.targetRect.top}px`;
    owner.style.width = `${entry.targetRect.width}px`;
    owner.style.height = `${entry.targetRect.height}px`;
    owner.style.transformOrigin = "0 0";
    // WebKit repaints even identity transforms; remove them before settlement.
    owner.style.transform = endpointIdentity
      ? "none"
      : `translate(${frame.translateX}px, ${frame.translateY}px) ` +
        `scale(${frame.scaleX}, ${frame.scaleY})`;
    if (visual instanceof HTMLElement) {
      owner.dataset["kpNativeKatexGlyphPaintFrame"] =
        entry.glyphPaintFrame === undefined ? "missing" : "measured";
      normalizeKpNativeKatexMaterialGlyphPaint({
        stage: input.stage,
        owner,
        visual,
        entry,
        frame
      });
    }
    owner.dataset["kpNativeKatexTypographyModel"] = entry.model;
    realizedIds.push(entry.id);
  }
  return Object.freeze({
    kind: "native-katex-typography-realization",
    lifecycle: "renderer-session",
    realizedIds: Object.freeze(realizedIds),
    deferredIds: Object.freeze(deferredIds),
    deferred: Object.freeze(deferred),
    nativeMutationCount: 0
  });
}

function normalizeKpNativeKatexMaterialGlyphPaint(input: {
  readonly stage: HTMLElement;
  readonly owner: HTMLElement;
  readonly visual: HTMLElement;
  readonly entry: KpNativeKatexTypographyStylePlanEntry;
  readonly frame: KpNativeKatexTypographyStyleFrame["entries"][number];
}): void {
  const paint = input.entry.glyphPaintFrame ?? input.entry.targetGlyphPaintFrame;
  if (
    paint === undefined ||
    input.visual.dataset["kpNativeKatexPaintFrameNormalized"] === "true"
  ) {
    return;
  }
  const clonePaint = measureKpNativeKatexTextInkRect(input.stage, input.visual);
  if (input.frame.expectedPaintRect !== undefined) {
    // Target-styled paint, including introduced ink without a source frame,
    // has its own clone inset. Reconcile that realized paint once against the
    // track's authoritative expected ink rather than reusing wrapper geometry.
    const correctionX =
      (input.frame.expectedPaintRect.left - clonePaint.left) /
      input.frame.scaleX;
    const correctionY =
      (input.frame.expectedPaintRect.top - clonePaint.top) /
      input.frame.scaleY;
    input.visual.style.translate = `${correctionX}px ${correctionY}px`;
    input.visual.dataset["kpNativeKatexPaintFrameNormalized"] = "true";
    return;
  }
  const ownerRect = stageRelativeRect(
    input.stage,
    input.owner.getBoundingClientRect()
  );
  const cloneInsetX =
    (clonePaint.left - ownerRect.left) / input.frame.scaleX;
  const cloneInsetY =
    (clonePaint.top - ownerRect.top) / input.frame.scaleY;
  const correctionX = paint.targetInsetX - cloneInsetX;
  const correctionY = paint.targetInsetY - cloneInsetY;
  input.visual.style.translate = `${correctionX}px ${correctionY}px`;
  input.visual.dataset["kpNativeKatexPaintFrameNormalized"] = "true";
}

export function selectKpNativeKatexTypographyRealizationDisposition(
  entry: KpNativeKatexTypographyStylePlanEntry
):
  | "html-clone"
  | "preserve-source-glyph"
  | "preserve-structural-paint"
  | "native-checkpoint" {
  if (entry.model === "native-checkpoint-settlement") {
    return "native-checkpoint";
  }
  return entry.paintRealization === "realize-target-glyph"
    ? "html-clone"
    : entry.paintRealization;
}

export function traceKpNativeKatexHandoffOwnership(input: {
  readonly stage: HTMLElement;
  readonly playback: KpNativeKatexRendererSession;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly progresses: readonly number[];
  readonly fontRevision: number;
  readonly viewportKey: string;
}): readonly KpNativeKatexHandoffOwnershipSample[] {
  return Object.freeze(input.progresses.map((progress) => {
    const ownership = input.playback.apply(progress);
    const glyphTelemetry = measureKpNativeKatexGlyphHandoff({
      ...input,
      progress
    });
    const ruleTelemetry = measureKpNativeKatexRuleHandoff({
      ...input,
      progress
    });
    const glyphPairs = handoffTelemetryGroups(glyphTelemetry);
    const rulePairs = handoffTelemetryGroups(ruleTelemetry);
    const visibleMaterialOwnerIds = [
      ...input.stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )
    ].filter((owner) => effectiveOpacity(owner, input.stage) > 0)
      .map((owner) => owner.dataset["kpEquationMaterialOwnerId"]!)
      .sort();
    return Object.freeze({
      progress,
      visualOwner: ownership.visualOwner,
      sourceNativeOpacity: ownership.sourceNativeOpacity,
      materialSceneOpacity: ownership.materialSceneOpacity,
      targetNativeOpacity: ownership.targetNativeOpacity,
      visibleMaterialOwnerIds: Object.freeze(visibleMaterialOwnerIds),
      glyphStyleMismatchIds: Object.freeze(glyphPairs.filter(
        ({ material, native }) =>
          material.styleFingerprint !== native.styleFingerprint
      ).map(({ material }) =>
        material.id.replace(/\.material$/, "")
      )),
      maximumGlyphRectResidualPx: maximum(
        glyphPairs.map(({ material, native }) =>
          rectDelta(material.rect, native.rect)
        )
      ),
      maximumGlyphBaselineResidualPx: maximum(
        glyphPairs.flatMap(({ material, native }) =>
          material.baselineY === null || native.baselineY === null
            ? []
            : [Math.abs(material.baselineY - native.baselineY)]
        )
      ),
      maximumRuleGeometryResidualPx: maximum(
        rulePairs.map(({ material, native }) =>
          ruleGeometryDelta(
            material.ruleGeometry!,
            native.ruleGeometry!
          )
        )
      )
    });
  }));
}

export function createKpNativeKatexRendererSession(input: {
  readonly sceneAssembly?: KpNativeKatexSceneAssembly | undefined;
  readonly semanticClock?: KpNativeKatexRendererReadyScenePlan["semanticClock"];
  readonly stage: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
  readonly copyFanOut?: boolean | undefined;
  readonly endpointDwellFraction?: number | undefined;
  readonly disposition?: KpNativeKatexRendererDisposition | undefined;
  readonly supplementalMaterialOwners?:
    (progress: number) => readonly KpEquationMaterialLayerOwnerFrame[];
}): KpNativeKatexRendererSession {
  const endpointDwellFraction = input.endpointDwellFraction ??
    KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION;
  if (
    endpointDwellFraction < KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION
  ) {
    throw new Error(
      `Native KaTeX material transit requires at least ` +
      `${KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION} terminal settlement.`
    );
  }
  sampleKpNativeKatexEndpointDwellProgress(0, endpointDwellFraction);
  const trackIds = input.tracks.map(({ id }) => id);
  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Renderer session requires unique track IDs.");
  }
  for (const track of input.tracks) {
    assertKpNativeKatexSceneTrackOpacityContract(track);
  }
  const sourceById = new Map(input.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetAtomIdByTrackId = new Map(input.tracks.map((track) => [
    track.id,
    track.targetAtomId
  ]));
  const unknownVisualAtom = input.tracks.find(({ visualAtomId }) =>
    !sourceById.has(visualAtomId) && !targetById.has(visualAtomId)
  );
  if (unknownVisualAtom !== undefined) {
    throw new Error(`unknown visual atom ${unknownVisualAtom.visualAtomId}.`);
  }
  const hasUnsupported = input.reconciliation.dispositions.some(
    ({ lifecycle }) => lifecycle === "unsupported"
  );
  const disposition = input.disposition ??
    decideKpNativeKatexRendererDisposition({
      ambiguityIds: [],
      blockedGeometryIds: []
    });
  if (hasUnsupported && disposition.reason === "clear") {
    throw new Error("Unsupported scene disposition.");
  }
  // Close raw-track entrypoints before clones receive paint authority.
  const tracks = attachKpNativeKatexTrackPaintGeometry({
    tracks: input.tracks,
    source: input.reconciliation.source,
    target: input.reconciliation.target
  });
  const nativeCompatible = input.sceneAssembly === undefined && input.supplementalMaterialOwners === undefined &&
    tracks.every((track) => {
    const source = sourceById.get(track.sourceAtomId ?? "");
    const target = targetById.get(track.targetAtomId ?? "");
    return track.lifecycle === "persist" &&
      source !== undefined &&
      target !== undefined &&
      source.visualKey === target.visualKey &&
      source.styleFingerprint === target.styleFingerprint &&
      source.fontRevision === target.fontRevision &&
      rectDelta(source.rect, target.rect) <= 0.25;
    });
  const mode =
    disposition.reason !== "clear"
      ? "checkpoint-settlement"
      : nativeCompatible ? "native-continuity" : "atom-transit";
  const sample = (progress: number) => {
    const poseProgress = sampleKpNativeKatexEndpointDwellProgress(
      progress,
      input.semanticClock === undefined ? endpointDwellFraction : 0
    );
    if (input.sceneAssembly) return input.sceneAssembly.sample(
      mode === "checkpoint-settlement" && progress < 1 ? 0 : poseProgress).frames;
    return sampleKpNativeKatexSceneTracks(
      tracks,
      mode === "checkpoint-settlement" && progress < 1
        ? 0
        : poseProgress,
      input.copyFanOut
    );
  };
  let disposed = false;
  const apply = (progress: number): KpNativeKatexSceneOwnershipFrame => {
    if (disposed) {
      throw new Error("Cannot apply a disposed native KaTeX renderer session.");
    }
    const frames = sample(progress);
    const bounded = Math.max(0, Math.min(1, progress));
    const poseProgress = sampleKpNativeKatexEndpointDwellProgress(
      bounded,
      input.semanticClock === undefined ? endpointDwellFraction : 0
    );
    const targetOwns = bounded === 1;
    const sourceOwns =
      bounded === 0 || (mode !== "atom-transit" && !targetOwns);
    const materialOwns = !sourceOwns && !targetOwns;
    input.sourceRoot.style.opacity = sourceOwns ? "1" : "0";
    input.targetRoot.style.opacity = targetOwns ? "1" : "0";
    syncKpEquationMaterialLayer({
      stage: input.stage,
      owners: mode === "atom-transit"
        ? composeKpNativeKatexSceneMaterialOwners({
            frames: frames.map((frame) => ({
              ...frame,
              endpointPaintAtomId:
                targetAtomIdByTrackId.get(frame.trackId)
            })),
            sourceAtoms: sourceById,
            targetAtoms: targetById,
            supplementalOwners:
              input.sceneAssembly?.sample(poseProgress).owners ?? input.supplementalMaterialOwners?.(poseProgress) ?? [],
            visible: materialOwns
          })
        : []
    });
    input.stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id^=\"native-scene-owner.\"]"
    ).forEach((owner) => {
      owner.setAttribute("inert", "");
      owner.dataset["kpNativeKatexSceneOwner"] = "true";
    });
    return Object.freeze({
      visualOwner:
        sourceOwns ? "source-native" :
        targetOwns ? "target-native" :
        "material-scene",
      sourceNativeOpacity: sourceOwns ? 1 : 0,
      materialSceneOpacity: materialOwns ? 1 : 0,
      targetNativeOpacity: targetOwns ? 1 : 0,
      frames
    });
  };
  return Object.freeze({
    kind: "native-katex-renderer-session",
    lifecycle: "renderer-session",
    mode,
    disposition,
    tracks,
    sample,
    apply,
    retire(retirement: KpNativeKatexPaintPreservingRetirement) {
      if (disposed) return;
      assertKpNativeKatexPaintPreservingRetirement(retirement);
      disposed = true;
      // The host replaces the stage; rewinding here causes a detached-frame flash.
    }
  });
}

export function compileKpCanonicalNativeKatexPureScenePlan(
  input: Omit<KpCanonicalNativeKatexSceneInput, "purePlan">
): KpCanonicalNativeKatexPureScenePlan {
  const resolved = resolveKpCanonicalNativeKatexSceneInput(input);
  const { prepared, protectedTransit } =
    compileKpCanonicalNativeKatexProtectedPlan(resolved);
  return Object.freeze({
    kind: "canonical-native-katex-pure-scene-plan",
    lifecycle: "pure-measured-plan",
    inputTrackSignature: prepared.inputTrackSignature,
    inputGeometry: pureSceneInputGeometry(resolved),
    tracks: protectedTransit.tracks,
    protectedTransit: protectedTransit.certificate
  });
}

export function compileKpCanonicalNativeKatexScenePlan(
  input: KpCanonicalNativeKatexSceneInput
): KpNativeKatexRendererReadyScenePlan {
  const resolved = resolveKpCanonicalNativeKatexSceneInput(input);
  if (resolved.source.stage !== resolved.target.stage) {
    throw new Error("Canonical native KaTeX endpoints must share one stage.");
  }
  const { prepared, protectedTransit } =
    compileKpCanonicalNativeKatexProtectedPlan(resolved);
  const {
    reconciliation,
    hierarchy,
    allTracks,
    syntheses,
    ownership
  } = prepared;
  const tracks = protectedTransit.tracks;
  const measuredTracks = attachKpNativeKatexTrackPaintGeometry({ tracks, source: resolved.source, target: resolved.target });
  const sceneAssembly = input.factoring === undefined ? undefined : createKpNativeKatexSceneAssembly({
    source: resolved.source, target: resolved.target, tracks: measuredTracks,
    contributions: [input.factoring.contribution], copyFanOut: input.copyFanOutRouting
  });
  if (sceneAssembly && syntheses.length) throw new Error("Mixed contributions require complete final-scene migration.");
  const correlations = correlateKpNativeKatexSceneHandoff({
    reconciliation,
    tracks: allTracks
  }).filter(({ targetAtomId }) =>
    targetAtomId === undefined ||
    !ownership.claimedTargetAtomIds.has(targetAtomId)
  );
  return createKpNativeKatexRendererReadyScenePlan({
    reconciliation,
    hierarchy,
    tracks: measuredTracks,
    sceneAssembly,
    protectedTransit: protectedTransit.certificate,
    disposition: decideKpNativeKatexRendererDisposition({
      ambiguityIds: [],
      blockedGeometryIds: []
    }),
    handoffCorrelations: correlations,
    copyFanOut: input.copyFanOutRouting,
    endpointDwellFraction: input.endpointDwellFraction,
    // The complete motif already owns orient/act/settle. A second time warp
    // changes every phase; native-only geometry retains the existing dwell.
    semanticClock: input.factoring?.semanticClock,
    structuralSuccession: input.structuralSuccession,
    structuralMotion: input.structuralMotion,
    supplementalMaterialOwners:
      syntheses.length === 0
        ? undefined
        : progress => sampleKpNativeKatexSuccessorSynthesisScenePlans({ plans: syntheses, progress })
  });
}

export function createKpCanonicalNativeKatexSceneSession(
  plan: KpNativeKatexRendererReadyScenePlan,
  options: KpNativeKatexSceneSessionOptions = {}
): KpCanonicalNativeKatexSceneSession {
  const carrier = createKpCanonicalNativeKatexCarrierSceneSession(
    plan,
    options
  );
  const executableMotion = certifyKpNativeKatexExecutableMotion(
    carrier.session
  );
  return Object.freeze({
    kind: "canonical-native-katex-scene-session",
    lifecycle: carrier.lifecycle,
    reconciliation: carrier.reconciliation,
    hierarchy: carrier.hierarchy,
    protectedTransit: carrier.protectedTransit,
    session: carrier.session,
    readPaintReadiness: carrier.readPaintReadiness,
    executableMotion,
    [kpExecutableNativeKatexSceneSessionBrand]: true as const
  });
}

const fractionReviewTypographyPlans = new WeakMap<HTMLElement, Map<string, KpNativeKatexTypographyStylePlan>>();

export function createKpCanonicalNativeKatexCarrierSceneSession(
  plan: KpNativeKatexRendererReadyScenePlan,
  options: KpNativeKatexSceneSessionOptions = {}
): KpCanonicalNativeKatexCarrierSceneSession {
  if (!isKpNativeKatexRendererReadyScenePlan(plan)) {
    throw new Error(
      "Canonical native KaTeX rendering requires a live renderer-ready plan."
    );
  }
  const { source, target } = plan.reconciliation;
  const { reconciliation, hierarchy, tracks } = plan;
  source.stage.dataset["kpNativeKatexHorizontalAxisTrackCount"] = String(
    tracks.filter(({ motionAxisConstraint }) =>
      motionAxisConstraint === "horizontal"
    ).length
  );
  const targetAtoms = new Map(target.atoms.map((atom) => [atom.id, atom]));
  // Structural paint keeps its clone; only glyphs need target styling.
  const glyphLinks = plan.handoffCorrelations.filter((correlation) =>
    targetAtoms.get(correlation.targetAtomId ?? "")?.paintKind === "glyph"
  );
  const playback = createKpNativeKatexRendererSession({
    sceneAssembly: plan.sceneAssembly,
    stage: source.stage,
    sourceRoot: source.root,
    targetRoot: target.root,
    reconciliation,
    tracks,
    disposition: plan.disposition,
    copyFanOut: plan.copyFanOut,
    endpointDwellFraction: plan.endpointDwellFraction,
    semanticClock: plan.semanticClock,
    ...(plan.supplementalMaterialOwners === undefined
      ? {}
      : { supplementalMaterialOwners: plan.supplementalMaterialOwners })
  });
  // Successor synthesis may own every target, leaving no residual handoff.
  let typographyWarmup:
    | KpNativeKatexTypographyStyleFrame
    | undefined;
  const typographyPlan = glyphLinks.length === 0
    ? undefined
    : (() => {
        const microscope = 1 - plan.endpointDwellFraction;
        const ownership = playback.apply(microscope);
        // This review card already supplies a total paint/geometry generation.
        // Reuse calibration only within that exact revision, never across an
        // arbitrary theme, font, layout, host or retired session boundary.
        const revision = source.stage.dataset["kpFractionCoherentTransportReview"] === "true" &&
          source.stage.dataset["kpEquationMaterialVisualCache"] === "dual-revision"
          ? source.stage.dataset["kpEquationMaterialPaintRevision"] : undefined;
        let cachedPlans = fractionReviewTypographyPlans.get(source.stage);
        if (revision && !cachedPlans) { cachedPlans = new Map(); fractionReviewTypographyPlans.set(source.stage, cachedPlans); }
        const compiled = (revision ? cachedPlans?.get(revision) : undefined) ?? compileKpNativeKatexTypographyStylePlan({
          telemetry: measureKpNativeKatexCorrelatedHandoff({
            stage: source.stage,
            reconciliation,
            correlations: glyphLinks,
            progress: microscope,
            fontRevision: target.fontRevision,
            viewportKey: target.viewportKey
          }),
          correlations: glyphLinks,
          tolerancePx: 0.1,
          maximumTranslationPx: 2,
          maximumScaleRatio: 1.1
        });
        if (revision && cachedPlans) {
          cachedPlans.set(revision, compiled);
          if (cachedPlans.size > 4) cachedPlans.delete(cachedPlans.keys().next().value!);
        }
        typographyWarmup = sampleKpNativeKatexTypographyStylePlan(
          compiled,
          microscope,
          ownership.frames
        );
        return compiled;
      })();
  if (
    source.stage.dataset["kpEquationMaterialVisualCache"] ===
      "dual-revision" &&
    typographyPlan !== undefined &&
    typographyWarmup !== undefined
  ) {
    // Warm the detached target clone cache before the surface becomes ready.
    // playback.apply(0) below restores the source visual, so prewarming cannot
    // leak target typography into the approved source-phase composition.
    realizeKpNativeKatexTypographyStylePlan({
      stage: source.stage,
      target,
      plan: typographyPlan,
      frame: typographyWarmup
    });
  }
  playback.apply(0);
  source.stage.dataset["kpCanonicalNativeKatexSessionFactory"] =
    "shared-v1";
  let latestProgress = 0;
  let disposed = false;
  let paintReadiness: KpNativeKatexScenePaintReadiness = Object.freeze({
    status: plan.structuralSuccession === undefined
      ? "ready"
      : "preparing"
  });
  const commitPaintReadiness = (
    next: KpNativeKatexScenePaintReadiness
  ): void => {
    if (
      paintReadiness.status === next.status &&
      paintReadiness.reason === next.reason
    ) return;
    paintReadiness = Object.freeze(next);
    options.onPaintReadinessChange?.(paintReadiness);
  };
  const session: KpNativeKatexRendererSession = Object.freeze({
    ...playback,
    apply(progress: number) {
      if (disposed) {
        throw new Error("Cannot apply a disposed canonical KaTeX scene session.");
      }
      const bounded = Math.max(0, Math.min(1, progress));
      const poseProgress = sampleKpNativeKatexEndpointDwellProgress(
        bounded,
        plan.semanticClock === undefined ? plan.endpointDwellFraction : 0
      );
      source.stage.dataset["kpNativeKatexRawProgress"] =
        String(bounded);
      source.stage.dataset["kpNativeKatexPoseProgress"] =
        String(poseProgress);
      latestProgress = bounded;
      const structural = plan.structuralSuccession;
      const fullMotion = structural !== undefined &&
        (
          plan.structuralMotion === "full" ||
          (
            plan.structuralMotion === undefined &&
            source.stage.ownerDocument.defaultView?.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches !== true
          )
        );
      const structuralSync = structural === undefined
        ? undefined
        : syncKpNativeKatexStructuralSuccession({
            stage: source.stage,
            sourceRoot: source.root,
            targetRoot: target.root,
            intent: structural,
            progress: bounded,
            visible: false,
            enabled: fullMotion,
            prewarm:
              options.eagerStructuralPaint === true && bounded < 1,
            onSettled: () => session.apply(latestProgress)
          });
      const structuralReady =
        structuralSync?.strategy === "solid-mask-succession" &&
        structuralSync.status === "ready";
      const appliedProgress =
        structural !== undefined &&
        !structuralReady &&
        bounded > 0 &&
        bounded < 1
          ? 0
          : bounded;
      const ownership = playback.apply(appliedProgress);
      if (
        ownership.visualOwner === "material-scene" &&
        typographyPlan !== undefined
      ) {
        realizeKpNativeKatexTypographyStylePlan({
          stage: source.stage,
          target,
          plan: typographyPlan,
          frame: sampleKpNativeKatexTypographyStylePlan(
            typographyPlan,
            poseProgress,
            ownership.frames
          )
        });
      }
      if (
        structural !== undefined &&
        structuralReady &&
        bounded > 0 &&
        bounded < 1
      ) {
        const canvasOwnsStructuralPaint =
          bounded >= structural.paintStrategy.morph.start &&
          structuralSync?.paintReady !== false;
        if (canvasOwnsStructuralPaint) {
          hideStructuralAtomOwners({
            stage: source.stage,
            reconciliation,
            tracks,
            intent: structural
          });
        }
        syncKpNativeKatexStructuralSuccession({
          stage: source.stage,
          sourceRoot: source.root,
          targetRoot: target.root,
          intent: structural,
          progress: bounded,
          visible: canvasOwnsStructuralPaint,
          enabled: true,
          prewarm:
            options.eagerStructuralPaint === true && bounded < 1,
          onSettled: () => session.apply(latestProgress)
        });
        source.stage.dataset["kpNativeKatexStructuralPaintOwner"] =
          canvasOwnsStructuralPaint
            ? "solid-mask-canvas"
            : "native-material-clones";
      }
      commitPaintReadiness(structuralSync === undefined
        ? { status: "ready" }
        : structuralSync.status === "ready"
          ? { status: "ready" }
          : structuralSync.status === "unavailable"
            ? {
                status: "unavailable",
                ...(structuralSync.reason === undefined
                  ? {}
                  : { reason: structuralSync.reason })
              }
            : {
                status: "preparing",
                ...(structuralSync.reason === undefined
                  ? {}
                  : { reason: structuralSync.reason })
              });
      return ownership;
    },
    retire(retirement: KpNativeKatexPaintPreservingRetirement) {
      if (disposed) return;
      assertKpNativeKatexPaintPreservingRetirement(retirement);
      disposed = true;
      if (retirement.structuralSuccession === "retire-preserving-paint") {
        retireKpNativeKatexStructuralSuccessionPreservingPaint(
          source.stage
        );
      }
      playback.retire(retirement);
    }
  });
  if (plan.structuralSuccession !== undefined) session.apply(0);
  return Object.freeze({
    kind: "canonical-native-katex-carrier-scene-session",
    lifecycle: "renderer-session",
    reconciliation,
    hierarchy,
    protectedTransit: plan.protectedTransit,
    session,
    readPaintReadiness: () => paintReadiness,
    [kpCanonicalNativeKatexCarrierSceneSessionBrand]: true as const
  });
}

function certifyKpNativeKatexExecutableMotion(
  playback: KpNativeKatexRendererSession
): KpNativeKatexExecutableMotionEvidence {
  const sampledProgresses = [0, 0.25, 0.5, 0.75, 1] as const;
  const signaturesByTrack = new Map<string, Set<string>>();
  for (const progress of sampledProgresses) {
    for (const frame of playback.sample(progress)) {
      const signatures = signaturesByTrack.get(frame.trackId) ?? new Set<string>();
      signatures.add(JSON.stringify({
        rect: frame.rect,
        opacity: frame.opacity,
        metricProgress: frame.metricProgress,
        materialScale: frame.materialScale
      }));
      signaturesByTrack.set(frame.trackId, signatures);
    }
  }
  const dynamicTrackIds = [...signaturesByTrack]
    .filter(([, signatures]) => signatures.size > 1)
    .map(([trackId]) => trackId);
  if (dynamicTrackIds.length === 0) {
    throw new Error(
      "Canonical Native KaTeX motion must produce at least one non-static " +
      "measured track before a surface can publish itself as ready."
    );
  }
  return Object.freeze({
    kind: "native-katex-executable-motion-evidence" as const,
    sampledProgresses,
    dynamicTrackIds: Object.freeze(dynamicTrackIds) as readonly [
      string,
      ...string[]
    ]
  });
}

function compileKpCanonicalNativeKatexProtectedPlan(
  input: KpResolvedCanonicalNativeKatexSceneInput
) {
  const prepared = prepareKpCanonicalNativeKatexScene(input);
  const cached = input.purePlan;
  if (
    cached !== undefined &&
    cached.inputTrackSignature !== prepared.inputTrackSignature
  ) {
    const mismatch = firstStringDifference(
      cached.inputTrackSignature,
      prepared.inputTrackSignature
    );
    throw new Error(
      "Canonical native KaTeX pure plan does not match measured scene tracks " +
      `(first difference ${mismatch.index}: cached ${mismatch.left}, ` +
      `current ${mismatch.right}).`
    );
  }
  if (
    cached !== undefined &&
    !pureSceneGeometryMatches(cached.inputGeometry, pureSceneInputGeometry(input))
  ) {
    throw new Error(
      "Canonical native KaTeX pure plan exceeds the measured geometry " +
      "reuse tolerance."
    );
  }
  const sampleFrames = (tracks: readonly KpNativeKatexSceneTrack[], progress: number) =>
    sampleKpNativeKatexSceneTrackFrames(tracks, progress, input.copyFanOutRouting === true);
  const protectedTransit = cached === undefined
    ? compileKpCollisionSafeTransitTracks({
        tracks: prepared.motifRoutedTracks,
        stageOccupancy: input.stageOccupancy,
        sampleFrames
      })
    : { tracks: cached.tracks, certificate: cached.protectedTransit };
  return { prepared, protectedTransit };
}

function assertKpNativeKatexPaintPreservingRetirement(
  retirement: KpNativeKatexPaintPreservingRetirement
): void {
  if (
    retirement.kind !== "native-katex-paint-preserving-retirement" ||
    ![
      "preserve",
      "retire-preserving-paint"
    ].includes(retirement.structuralSuccession) ||
    ![
      "scene-replaced",
      "surface-disposed",
      "measurement-invalidated"
    ].includes(retirement.reason)
  ) {
    throw new Error(
      "Native KaTeX sessions require paint-preserving retirement."
    );
  }
}

function prepareKpCanonicalNativeKatexScene(
  input: Omit<KpResolvedCanonicalNativeKatexSceneInput, "purePlan">
) {
  if (input.factoring) assertKpNativeKatexContributionMeasurement(input.factoring.contribution, input.source, input.target);
  const reconciliation = reconcileKpNativeKatexScenes({
    source: input.source,
    target: input.target,
    relations: input.relations
  });
  const hierarchy = compileKpNativeKatexHierarchicalScenePlan(reconciliation);
  const allTracks = attachKpNativeKatexTrackPaintGeometry({
    tracks: compileKpNativeKatexSceneTracks(hierarchy),
    source: input.source,
    target: input.target
  });
  const axisConstrainedTracks = applyHorizontalAxisConstraints({
    tracks: allTracks,
    source: input.source,
    target: input.target,
    semanticEntityIds: input.horizontalAxisSemanticEntityIds ?? []
  });
  const syntheses = compileKpNativeKatexSuccessorSynthesisScenePlans({
    source: input.source,
    target: input.target,
    intents: input.successorSyntheses ?? []
  });
  const semanticMotionTracks = compileKpNativeKatexSemanticMotionTracks({
    tracks: axisConstrainedTracks,
    source: input.source,
    target: input.target,
    contract: input.symbolMotionContract
  });
  const operationTracks = compileKpNativeKatexOperationTracks({
    tracks: semanticMotionTracks,
    source: input.source,
    target: input.target,
    choreography: input.operationChoreography
  });
  const projectedTracks = compileKpNativeKatexProjectedTracks({
    projection: input.trackProjection,
    tracks: operationTracks,
    source: input.source,
    target: input.target
  });
  const ownership = partitionKpNativeKatexSuccessorOwnedTracks(
    syntheses,
    projectedTracks,
    input.factoring
  );
  const routed = input.reorderRouting === true
    ? compileKpCollisionSafeReorderTracks(ownership.tracks, input.stageOccupancy)
    : ownership.tracks;
  const motifRoutedTracks = input.fanInRouting === true
    ? compileKpQualityBoundedFanInTracks(routed, input.stageOccupancy)
    : routed;
  return {
    reconciliation,
    hierarchy,
    allTracks: axisConstrainedTracks,
    syntheses,
    ownership,
    motifRoutedTracks,
    inputTrackSignature: pureSceneInputSignature(input)
  };
}

function pureSceneInputSignature(
  input: Omit<KpResolvedCanonicalNativeKatexSceneInput, "purePlan">
): string {
  const atoms = (scene: KpNativeKatexRenderedSceneObservation) =>
    scene.atoms.map((atom) => ({
      id: atom.id,
      semanticEntityId: atom.semanticEntityId,
      presentationGroupId: atom.presentationGroupId,
      paintKind: atom.paintKind,
      visualKey: atom.visualKey,
      styleFingerprint: atom.styleFingerprint,
      zOrder: atom.zOrder,
      fontRevision: atom.fontRevision
    }));
  return JSON.stringify({
    source: atoms(input.source),
    target: atoms(input.target),
    relations: input.relations,
    symbolMotionContract: input.symbolMotionContract,
    fanInRouting: input.fanInRouting === true,
    copyFanOutRouting: input.copyFanOutRouting === true,
    horizontalAxisSemanticEntityIds:
      input.horizontalAxisSemanticEntityIds ?? [],
    reorderRouting: input.reorderRouting === true,
    stageOccupancy: input.stageOccupancy === undefined
      ? undefined
      : {
          measurementIdentity: input.stageOccupancy.measurementIdentity,
          rowIds: input.stageOccupancy.rows.map(({ id }) => id),
          geometryAuthority: input.stageOccupancy.geometryAuthority
        }
  });
}

function applyHorizontalAxisConstraints(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly semanticEntityIds: readonly string[];
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (input.semanticEntityIds.length === 0) return input.tracks;
  const constrained = new Set(input.semanticEntityIds);
  const sourceEntities = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntities = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const matched = new Set<string>();
  const tracks = input.tracks.map((track) => {
    const sourceEntity = sourceEntities.get(track.sourceAtomId ?? "");
    const targetEntity = targetEntities.get(track.targetAtomId ?? "");
    if (
      sourceEntity === undefined ||
      targetEntity === undefined ||
      !constrained.has(sourceEntity) ||
      !constrained.has(targetEntity)
    ) return track;
    matched.add(sourceEntity);
    matched.add(targetEntity);
    return Object.freeze({
      ...track,
      motionAxisConstraint: "horizontal" as const
    });
  });
  const missing = input.semanticEntityIds.filter((id) => !matched.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Native KaTeX horizontal-axis constraints lack paint for ` +
      `${missing.join(", ")}.`
    );
  }
  return Object.freeze(tracks);
}

function pureSceneInputGeometry(
  input: Omit<KpResolvedCanonicalNativeKatexSceneInput, "purePlan">
): readonly number[] {
  const rect = (value: KpStageRelativeRect): readonly number[] => [
    value.left,
    value.top,
    value.width,
    value.height
  ];
  return Object.freeze([
    ...input.source.atoms.flatMap((atom) => rect(atom.rect)),
    ...input.target.atoms.flatMap((atom) => rect(atom.rect)),
    ...(input.stageOccupancy?.rows.flatMap((row) => rect(row.rect)) ?? []),
    ...(input.stageOccupancy === undefined
      ? []
      : rect(input.stageOccupancy.protectedCorridor))
  ]);
}

function resolveKpCanonicalNativeKatexSceneInput(
  input: KpCanonicalNativeKatexSceneInput |
    Omit<KpCanonicalNativeKatexSceneInput, "purePlan">
): KpResolvedCanonicalNativeKatexSceneInput {
  return {
    ...input,
    source: resolveKpCanonicalNativeKatexEndpointInput(input.source),
    target: resolveKpCanonicalNativeKatexEndpointInput(input.target)
  };
}

export function resolveKpCanonicalNativeKatexEndpointInput(
  endpoint: KpCanonicalNativeKatexEndpointInput
): KpNativeKatexRenderedSceneObservation {
  if (endpoint.kind === "native-katex-rendered-scene-observation") {
    return endpoint;
  }
  if (endpoint.kind === "native-katex-rendered-endpoint-handle") {
    return endpoint.observation;
  }
  return compileKpNativeKatexEndpointOwnershipObservation(endpoint);
}

function pureSceneGeometryMatches(
  cached: readonly number[],
  current: readonly number[]
): boolean {
  if (cached.length !== current.length) return false;
  // Ignore sub-pixel layout noise, but reject physically visible stale geometry.
  return cached.every((value, index) =>
    Math.abs(value - current[index]!) <= 1 / 64
  );
}

function firstStringDifference(
  left: string,
  right: string
): {
  readonly index: number;
  readonly left: string;
  readonly right: string;
} {
  const maxShared = Math.min(left.length, right.length);
  let index = 0;
  while (index < maxShared && left[index] === right[index]) index += 1;
  const contextStart = Math.max(0, index - 32);
  const contextEnd = index + 64;
  return {
    index,
    left: JSON.stringify(left.slice(contextStart, contextEnd)),
    right: JSON.stringify(right.slice(contextStart, contextEnd))
  };
}

function hideStructuralAtomOwners(input: {
  readonly stage: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
  readonly intent: KpEquationStructuralSuccessionIntent;
}): void {
  const entityIds = new Set([
    ...input.intent.sourceEntityIds,
    ...input.intent.targetEntityIds
  ]);
  const componentIds = new Set(input.reconciliation.dispositions
    .filter(({ semanticEntityIds }) => semanticEntityIds.some((entityId) =>
      entityIds.has(entityId)
    ))
    .map(({ id }) => `component.${id}`));
  for (const track of input.tracks) {
    if (!componentIds.has(track.componentId)) continue;
    const owner = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="native-scene-owner.${
        CSS.escape(track.id)
      }"]`
    );
    if (owner !== null) owner.style.opacity = "0";
  }
}

function assertKpNativeKatexSceneTrackOpacityContract(
  track: KpNativeKatexSceneTrack
): void {
  const lineage = track.lifecycle === "persist" ||
    track.lifecycle === "split" || track.lifecycle === "merge";
  const valid = lineage
    ? track.startOpacity === 1 && track.endOpacity === 1 &&
      track.opacityStepAt === undefined
    : track.lifecycle === "introduce"
      ? track.startOpacity === 0 && track.endOpacity === 1
      : track.startOpacity === 1 && track.endOpacity === 0;
  if (!valid) throw new Error(lineage
    ? "Lineage-backed scene tracks must remain fully opaque."
    : `${track.lifecycle} scene tracks require explicit endpoint opacity.`);
}

function assertUniqueTypographyStyleIds(ids: readonly string[]): void {
  if (
    ids.some((id) => id.trim() === "") ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error("Typography style plan IDs must be unique and non-empty.");
  }
}

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function observeCorrelatedHandoffPaint(input: {
  readonly id: string;
  readonly side: "native-source" | "material" | "native-target";
  readonly stage: HTMLElement;
  readonly element: HTMLElement;
  readonly rectElement: HTMLElement;
  readonly atom: KpNativeKatexPaintAtomObservation;
  readonly fontRevision: number;
}) {
  const isGlyph = input.atom.paintKind === "glyph";
  // Rules own border geometry; other paint follows the scene owner.
  const rectElement =
    input.atom.paintKind === "rule" ? input.element : input.rectElement;
  const rect = stageRelativeRect(
    input.stage,
    rectElement.getBoundingClientRect()
  );
  const computed = getComputedStyle(input.element);
  return {
    kind: "native-katex-handoff-paint-observation" as const,
    lifecycle: "renderer-session" as const,
    id: input.id,
    side: input.side,
    paintAtomId: input.atom.id,
    semanticEntityId: input.atom.semanticEntityId,
    presentationGroupId: input.atom.presentationGroupId,
    paintKind: input.atom.paintKind,
    paintMeasurement: input.atom.paintMeasurement,
    element: input.element,
    rect,
    baselineY: isGlyph
      ? fontMetricBaseline(input.element, computed, rect)
      : null,
    wrapperTransform: computedTransformChain(input.element, input.stage),
    wrapperFingerprint: computedWrapperFingerprint(input.element, input.stage),
    clipPath: computed.clipPath || "none",
    paintFingerprint: input.atom.visualKey,
    styleFingerprint: isGlyph
      ? handoffStyleFingerprint(computed)
      : structuralStyleFingerprint(computed),
    opacity: effectiveOpacity(rectElement, input.stage),
    ...(input.atom.paintKind === "rule"
      ? { ruleGeometry: measureRuleGeometry(computed, rect) }
      : {}),
    fontRevision: input.fontRevision
  };
}

function stageRelativeRect(
  stage: HTMLElement,
  fragmentClientRect: Pick<DOMRect, "left" | "top" | "width" | "height">
): KpStageRelativeRect {
  const stageClientRect = stage.getBoundingClientRect();
  return normalizeKpStageRelativeRect({
    stageClientRect,
    stageLayoutWidth: stage.offsetWidth || stageClientRect.width,
    stageLayoutHeight: stage.offsetHeight || stageClientRect.height,
    fragmentClientRect
  });
}

function createGlyphPaintFrame(
  stage: HTMLElement,
  source: KpNativeKatexHandoffTelemetry["observations"][number],
  target: KpNativeKatexHandoffTelemetry["observations"][number]
): NonNullable<KpNativeKatexTypographyStylePlanEntry["glyphPaintFrame"]> {
  const sourcePaint = measureKpNativeKatexTextInkRect(stage, source.element);
  const targetPaint = measureKpNativeKatexTextInkRect(stage, target.element);
  const scaleX = safeScale(sourcePaint.width, targetPaint.width);
  const scaleY = safeScale(sourcePaint.height, targetPaint.height);
  const maximumInkScaleAnisotropy = 1.025;
  const measuredInkScale =
    !Number.isFinite(scaleX) ||
    !Number.isFinite(scaleY) ||
    symmetricScaleRatio(scaleX / scaleY) > maximumInkScaleAnisotropy
      ? undefined
      : Math.sqrt(scaleX * scaleY);
  const sourceScale = measuredInkScale ??
    resolveEquivalentGlyphTypographyScale({
      source,
      target,
      maximumScaleDrift: maximumInkScaleAnisotropy
    });
  if (sourceScale === undefined) {
    const sourceFontSize = getComputedStyle(source.element).fontSize;
    const targetFontSize = getComputedStyle(target.element).fontSize;
    throw new Error(
      `Native glyph metric interpolation requires uniform measured ink scale ` +
      `for ${source.semanticEntityId} → ${target.semanticEntityId} ` +
      `(x=${scaleX.toFixed(4)}, y=${scaleY.toFixed(4)}, ` +
      `fonts=${sourceFontSize}→${targetFontSize}).`
    );
  }
  return Object.freeze({
    sourceLeft: source.rect.left,
    sourceTop: source.rect.top,
    sourceInsetX: sourcePaint.left - source.rect.left,
    sourceInsetY: sourcePaint.top - source.rect.top,
    targetInsetX: targetPaint.left - target.rect.left,
    targetInsetY: targetPaint.top - target.rect.top,
    sourceScale
  });
}

function resolveEquivalentGlyphTypographyScale(input: {
  readonly source: KpNativeKatexHandoffTelemetry["observations"][number];
  readonly target: KpNativeKatexHandoffTelemetry["observations"][number];
  readonly maximumScaleDrift: number;
}): number | undefined {
  if (
    input.source.paintFingerprint !== input.target.paintFingerprint ||
    input.source.fontRevision !== input.target.fontRevision
  ) return undefined;
  const sourceStyle = getComputedStyle(input.source.element);
  const targetStyle = getComputedStyle(input.target.element);
  if (
    glyphMetricStyleFingerprint(sourceStyle) !==
    glyphMetricStyleFingerprint(targetStyle)
  ) return undefined;
  const fontScale = safeScale(
    Number.parseFloat(sourceStyle.fontSize),
    Number.parseFloat(targetStyle.fontSize)
  );
  const sourceLayout = directTextLayoutRect(input.source.element);
  const targetLayout = directTextLayoutRect(input.target.element);
  const layoutScaleX = safeScale(sourceLayout.width, targetLayout.width);
  const layoutScaleY = safeScale(sourceLayout.height, targetLayout.height);
  if (
    !Number.isFinite(fontScale) ||
    !Number.isFinite(layoutScaleX) ||
    !Number.isFinite(layoutScaleY) ||
    symmetricScaleRatio(layoutScaleX / fontScale) >
      input.maximumScaleDrift ||
    symmetricScaleRatio(layoutScaleY / fontScale) > input.maximumScaleDrift
  ) return undefined;
  // Canvas ink bounds are font-size hinted in some engines. When the same
  // glyph, font metrics, and DOM text box prove a uniform CSS role change,
  // the computed font ratio is the stable scale authority for the clone.
  return fontScale;
}

function directTextLayoutRect(element: HTMLElement): DOMRect {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const rect = range.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0
    ? rect
    : element.getBoundingClientRect();
}

function glyphMetricStyleFingerprint(computed: CSSStyleDeclaration): string {
  return [
    "font-family",
    "font-style",
    "font-weight",
    "font-stretch",
    "font-kerning",
    "font-feature-settings",
    "font-variation-settings",
    "letter-spacing"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function createTargetGlyphPaintFrame(
  stage: HTMLElement,
  target: KpNativeKatexHandoffTelemetry["observations"][number]
): KpNativeKatexTargetGlyphPaintFrame | undefined {
  if (
    typeof target.element.ownerDocument.createRange !== "function" ||
    typeof target.element.getBoundingClientRect !== "function"
  ) {
    // Headless contract fixtures may prove typography without a paint
    // backend. A scaled runtime frame will still fail closed in the sampler.
    return undefined;
  }
  const paint = measureKpNativeKatexTextInkRect(stage, target.element);
  return Object.freeze({
    targetInsetX: paint.left - target.rect.left,
    targetInsetY: paint.top - target.rect.top,
    targetWidth: paint.width,
    targetHeight: paint.height
  });
}

function fontMetricBaseline(
  element: HTMLElement,
  computed: CSSStyleDeclaration,
  rect: KpStageRelativeRect
): number {
  const canvas = element.ownerDocument.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Native handoff baseline measurement requires canvas text metrics.");
  }
  context.font = [
    computed.fontStyle,
    computed.fontWeight,
    computed.fontSize,
    computed.fontFamily
  ].join(" ");
  const metrics = context.measureText(element.textContent?.trim() ?? "");
  return rect.top + rect.height - metrics.actualBoundingBoxDescent;
}

function computedTransformChain(
  element: HTMLElement,
  stage: HTMLElement
): string {
  const transforms: string[] = [];
  let current: HTMLElement | null = element;
  while (current !== null && current !== stage) {
    const computed = getComputedStyle(current);
    transforms.push([
      computed.transform || "none",
      computed.translate || "none",
      computed.scale || "none"
    ].join(","));
    current = current.parentElement;
  }
  return transforms.join(">");
}

function computedWrapperFingerprint(
  element: HTMLElement,
  stage: HTMLElement
): string {
  const wrappers: string[] = [];
  let current = element.parentElement;
  while (current !== null && current !== stage) {
    const computed = getComputedStyle(current);
    wrappers.push([
      `display:${computed.display}`,
      `position:${computed.position}`,
      `font-family:${computed.fontFamily}`,
      `font-size:${computed.fontSize}`,
      `line-height:${computed.lineHeight}`,
      `vertical-align:${computed.verticalAlign}`
    ].join("|"));
    current = current.parentElement;
  }
  return wrappers.join(">");
}

function handoffStyleFingerprint(computed: CSSStyleDeclaration): string {
  return [
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "color",
    "letter-spacing",
    "line-height",
    "vertical-align"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function structuralStyleFingerprint(computed: CSSStyleDeclaration): string {
  return [
    "background-color",
    "border-top-width",
    "border-top-style",
    "border-right-width",
    "border-right-style",
    "border-bottom-width",
    "border-bottom-style",
    "border-left-width",
    "border-left-style",
    "box-sizing",
    "overflow",
    "clip-path"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function measureRuleGeometry(
  computed: CSSStyleDeclaration,
  rect: KpStageRelativeRect
) {
  const candidates = [
    {
      side: "top",
      axis: "horizontal" as const,
      width: computed.borderTopWidth,
      style: computed.borderTopStyle
    },
    {
      side: "bottom",
      axis: "horizontal" as const,
      width: computed.borderBottomWidth,
      style: computed.borderBottomStyle
    },
    {
      side: "left",
      axis: "vertical" as const,
      width: computed.borderLeftWidth,
      style: computed.borderLeftStyle
    },
    {
      side: "right",
      axis: "vertical" as const,
      width: computed.borderRightWidth,
      style: computed.borderRightStyle
    }
  ].map((candidate) => ({
    ...candidate,
    thickness: Number.parseFloat(candidate.width)
  })).filter(({ style, thickness }) =>
    Number.isFinite(thickness) &&
    thickness > 0 &&
    style !== "none" &&
    style !== "hidden"
  ).sort((left, right) => right.thickness - left.thickness);
  const border = candidates[0];
  if (border === undefined) {
    throw new Error("Native handoff rule requires one visible border.");
  }
  const horizontal = border.axis === "horizontal";
  return {
    axis: border.axis,
    left:
      border.side === "right"
        ? rect.left + rect.width - border.thickness
        : rect.left,
    top:
      border.side === "bottom"
        ? rect.top + rect.height - border.thickness
        : rect.top,
    width: horizontal ? rect.width : rect.height,
    thickness: border.thickness
  };
}

function effectiveOpacity(element: HTMLElement, stage: HTMLElement): number {
  let opacity = 1;
  let current: HTMLElement | null = element;
  while (current !== null) {
    opacity *= Number(getComputedStyle(current).opacity);
    if (current === stage) break;
    current = current.parentElement;
  }
  return opacity;
}

function handoffTelemetryGroups(
  telemetry: KpNativeKatexHandoffTelemetry
) {
  const byId = new Map<string, typeof telemetry.observations>();
  for (const observation of telemetry.observations) {
    const id = observation.id.replace(/\.(source|material|native)$/, "");
    byId.set(id, [...(byId.get(id) ?? []), observation]);
  }
  return [...byId.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  ).map(([id, observations]) => {
    const source = observations.find(({ side }) => side === "native-source");
    const material = observations.find(({ side }) => side === "material");
    const native = observations.find(({ side }) => side === "native-target");
    if (material === undefined || native === undefined) {
      throw new Error(`Native handoff telemetry ${id} is not paired.`);
    }
    return { source, material, native } as const;
  });
}

function ruleGeometryDelta(
  left: NonNullable<
    KpNativeKatexHandoffTelemetry["observations"][number]["ruleGeometry"]
  >,
  right: NonNullable<
    KpNativeKatexHandoffTelemetry["observations"][number]["ruleGeometry"]
  >
): number {
  if (left.axis !== right.axis) return Number.POSITIVE_INFINITY;
  return maximum([
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.thickness - right.thickness)
  ]);
}

function maximum(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

function correlationId(observationId: string): string {
  return observationId.replace(/\.(source|material|native)$/, "");
}

const kpTransformableTypographyProperties = new Set([
  "font-size",
  "line-height"
]);

function handoffStylesAreTransformable(
  from: KpNativeKatexHandoffTelemetry["observations"][number],
  to: KpNativeKatexHandoffTelemetry["observations"][number]
): boolean {
  if (from.paintKind === "rule" || to.paintKind === "rule") return false;
  const fromStyle = parseFingerprint(from.styleFingerprint);
  const toStyle = parseFingerprint(to.styleFingerprint);
  if (
    fromStyle.size !== toStyle.size ||
    [...fromStyle.keys()].some((property) => !toStyle.has(property))
  ) {
    return false;
  }
  let changed = false;
  for (const [property, fromValue] of fromStyle) {
    const toValue = toStyle.get(property);
    if (fromValue === toValue) continue;
    changed = true;
    if (!kpTransformableTypographyProperties.has(property)) return false;
    if (!positiveCssLength(fromValue) || !positiveCssLength(toValue!)) {
      return false;
    }
  }
  return changed;
}

function parseFingerprint(fingerprint: string): ReadonlyMap<string, string> {
  return new Map(fingerprint.split("|").map((entry) => {
    const separator = entry.indexOf(":");
    return separator < 1
      ? [entry, ""] as const
      : [entry.slice(0, separator), entry.slice(separator + 1)] as const;
  }));
}

function positiveCssLength(value: string): boolean {
  const match = /^([0-9]+(?:\.[0-9]+)?)px$/.exec(value);
  return match !== null && Number(match[1]) > 0;
}

function compatibleRuleAxis(
  from: KpNativeKatexHandoffTelemetry["observations"][number],
  to: KpNativeKatexHandoffTelemetry["observations"][number]
): boolean {
  if (from.ruleGeometry === undefined && to.ruleGeometry === undefined) {
    return true;
  }
  return from.ruleGeometry?.axis === to.ruleGeometry?.axis;
}

function safeScale(to: number, from: number): number {
  return from === 0 ? Number.POSITIVE_INFINITY : to / from;
}

function symmetricScaleRatio(scale: number): number {
  return scale <= 0 ? Number.POSITIVE_INFINITY : Math.max(scale, 1 / scale);
}

function freezeTypographyStylePlanEntry(
  entry: KpNativeKatexTypographyStylePlanEntry
): KpNativeKatexTypographyStylePlanEntry {
  if (entry.paintRealization === "preserve-structural-paint") {
    return Object.freeze({
      ...entry,
      targetRect: Object.freeze({ ...entry.targetRect })
    });
  }
  return Object.freeze({
    ...entry,
    targetRect: Object.freeze({ ...entry.targetRect }),
    ...(entry.targetGlyphPaintFrame === undefined
      ? {}
      : {
          targetGlyphPaintFrame: Object.freeze({
            ...entry.targetGlyphPaintFrame
          })
        }),
    ...(entry.glyphPaintFrame === undefined
      ? {}
      : { glyphPaintFrame: Object.freeze({ ...entry.glyphPaintFrame }) })
  });
}

function requireNonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative.`);
  }
}
