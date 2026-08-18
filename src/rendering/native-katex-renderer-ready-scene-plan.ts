import type {
  KpEquationProtectedTransitCertificate
} from "./equation-motion-path-planner.ts";
import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-dom.ts";
import type {
  KpNativeKatexHierarchicalScenePlan,
  KpNativeKatexPaintMeasuredSceneTrack,
  KpNativeKatexRendererDisposition,
  KpNativeKatexSceneReconciliation
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export type KpNativeKatexSupplementalMaterialOwnerSampler = (
  progress: number
) => readonly KpEquationMaterialLayerOwnerFrame[];

/**
 * Renderer-ready plans may retain measured DOM observations, so their
 * lifetime is deliberately restricted to one mounted renderer session. They
 * are neither animation artifacts nor a serializable scene-graph format.
 */
export interface KpNativeKatexRendererReadyScenePlan {
  readonly kind: "native-katex-renderer-ready-scene-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly hierarchy: KpNativeKatexHierarchicalScenePlan;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly disposition: KpNativeKatexRendererDisposition;
  readonly copyFanOut: boolean;
  readonly endpointDwellFraction: number;
  readonly supplementalMaterialOwners?:
    KpNativeKatexSupplementalMaterialOwnerSampler | undefined;
  readonly toJSON: () => never;
}

const livePlans = new WeakSet<KpNativeKatexRendererReadyScenePlan>();

export function createKpNativeKatexRendererReadyScenePlan(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly hierarchy: KpNativeKatexHierarchicalScenePlan;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly disposition: KpNativeKatexRendererDisposition;
  readonly copyFanOut?: boolean | undefined;
  readonly endpointDwellFraction?: number | undefined;
  readonly supplementalMaterialOwners?:
    KpNativeKatexSupplementalMaterialOwnerSampler | undefined;
}): KpNativeKatexRendererReadyScenePlan {
  if (
    input.source.lifecycle !== "renderer-session" ||
    input.target.lifecycle !== "renderer-session"
  ) {
    throw new Error(
      "Renderer-ready plans require ephemeral renderer-session observations."
    );
  }
  if (input.source.stage !== input.target.stage) {
    throw new Error("Renderer-ready endpoints must share one measured stage.");
  }
  const trackIds = input.tracks.map(({ id }) => id);
  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Renderer-ready plans require unique measured track IDs.");
  }
  const endpointDwellFraction = input.endpointDwellFraction ?? 0;
  if (
    !Number.isFinite(endpointDwellFraction) ||
    endpointDwellFraction < 0 ||
    endpointDwellFraction > 0.25
  ) {
    throw new Error(
      "Renderer-ready endpoint dwell must be between zero and 0.25."
    );
  }
  const plan = Object.freeze({
    kind: "native-katex-renderer-ready-scene-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    source: input.source,
    target: input.target,
    reconciliation: input.reconciliation,
    hierarchy: input.hierarchy,
    tracks: Object.freeze([...input.tracks]),
    protectedTransit: input.protectedTransit,
    disposition: input.disposition,
    copyFanOut: input.copyFanOut ?? false,
    endpointDwellFraction,
    ...(input.supplementalMaterialOwners === undefined
      ? {}
      : { supplementalMaterialOwners: input.supplementalMaterialOwners }),
    toJSON(): never {
      throw new Error(
        "Renderer-ready native KaTeX plans cannot enter durable state."
      );
    }
  });
  livePlans.add(plan);
  return plan;
}

export function isKpNativeKatexRendererReadyScenePlan(
  value: unknown
): value is KpNativeKatexRendererReadyScenePlan {
  return typeof value === "object" && value !== null &&
    livePlans.has(value as KpNativeKatexRendererReadyScenePlan);
}
