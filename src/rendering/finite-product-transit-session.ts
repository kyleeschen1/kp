import {
  sampleKpFiniteProductExpansionMotion,
  type KpFiniteProductExpansionMotionFrame,
  type KpFiniteProductMotionMode
} from "../animation/finite-product-expansion-motion.ts";
import {
  kpCanonicalFiniteProductExpansionPresentationPlan
} from "../animation/finite-product-expansion-presentation-plan.ts";
import { kpCanonicalFiniteProductExpansionOperation } from
  "../semantic/canonical-finite-product-expansion.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import { compileKpNativeKatexEndpointOwnershipObservation } from
  "./native-katex-endpoint-ownership.ts";
import { createKpNativeKatexTrackProjection } from
  "./native-katex-track-projection.ts";
import { createKpFiniteProductNativePaintOwnership } from
  "./finite-product-native-paint-ownership.ts";
import { planKpFiniteProductRelationClearingTransit } from
  "./finite-product-relation-aware-transit.ts";
import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import type { KpNativeKatexRenderedEndpointHandle } from
  "./native-katex-rendered-scene.ts";

export interface KpFiniteProductTransitSession {
  readonly kind: "kp-finite-product-transit-session";
  readonly lifecycle: "renderer-session";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function createKpFiniteProductTransitSession(input: {
  readonly sourceHandle: KpNativeKatexRenderedEndpointHandle;
  readonly targetHandle: KpNativeKatexRenderedEndpointHandle;
  readonly relationInkRect: KpStageRelativeRect;
  readonly mode?: Exclude<KpFiniteProductMotionMode, "static"> | undefined;
}): KpFiniteProductTransitSession {
  const mode = input.mode ?? "full";
  let sampledProgress: number | undefined;
  let sampled: KpFiniteProductExpansionMotionFrame | undefined;
  const sample = (progress: number) => {
    if (sampledProgress !== progress || sampled === undefined) {
      sampledProgress = progress;
      sampled = sampleKpFiniteProductExpansionMotion(progress, mode);
    }
    return sampled;
  };
  const ownership = createKpFiniteProductNativePaintOwnership(input);
  const operation = kpCanonicalFiniteProductExpansionOperation;
  const sourceObservation =
    compileKpNativeKatexEndpointOwnershipObservation(ownership.source);
  const targetObservation =
    compileKpNativeKatexEndpointOwnershipObservation(ownership.target);
  const sourceEntities = new Map(sourceObservation.atoms.map((atom) =>
    [atom.id, atom.semanticEntityId]
  ));
  const targetEntities = new Map(targetObservation.atoms.map((atom) =>
    [atom.id, atom.semanticEntityId]
  ));
  const retainedSourceIds = new Set<string>([
    operation.source.semantic.operator.id,
    operation.source.semantic.binder.id,
    operation.source.semantic.lowerBound.id,
    operation.source.semantic.upperBound.id,
    operation.source.semantic.body.references[0]!.id
  ]);
  const instanceOrdinals = new Map<string, number>(operation.target.instances.map(
    (instance) => [instance.id, instance.ordinal]
  ));
  const referenceOrdinals = new Map<string, number>(operation.target.instances.map(
    (instance) => [instance.references[0]!.id, instance.ordinal]
  ));
  const trackProjection = createKpNativeKatexTrackProjection({
    id: "track-projection.finite-product-expansion.canonical.v1",
    project({ tracks }) {
      return Object.freeze(tracks.map((track) => {
        const sourceEntity = track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId);
        const targetEntity = track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId);
        const factorOrdinal = targetEntity === undefined
          ? undefined
          : instanceOrdinals.get(targetEntity);
        if (track.lifecycle === "split" && factorOrdinal !== undefined) {
          const motionPath = mode === "reduced"
            ? undefined
            : planKpFiniteProductRelationClearingTransit({
                id: `finite-product.relation-clearing.${track.id}`,
                relationOccurrenceId:
                  kpCanonicalFiniteProductExpansionPresentationPlan
                    .transitBoundary.relationOccurrenceId,
                startPaintRect: track.startPaintRect,
                endPaintRect: track.endPaintRect,
                relationInkRect: input.relationInkRect
              }).selected;
          return Object.freeze({
            ...track,
            timingGroupId: `finite-product.factor.${factorOrdinal}`,
            semanticMotionUnitId: `finite-product.body.${factorOrdinal}`,
            routingCohortId: "finite-product.ordered-factor-generation",
            // Juxtaposed product factors intentionally settle into one ink
            // cohort; without this semantic declaration the collision gate
            // mistakes native target adjacency for an unrelated crossing.
            intentionalContactGroupId:
              "finite-product.target-adjacency-cohort",
            ...(motionPath === undefined ? {} : {
              motionPath,
              motionPathSampling: "planned-curve" as const
            }),
            sampleProgress: (progress: number) =>
              sample(progress).factors[factorOrdinal]!.factorTransitProgress,
            samplePaintPresence: (progress: number) =>
              sample(progress).factors[factorOrdinal]!.factorPresence
          });
        }
        if (track.lifecycle === "eliminate" &&
            sourceEntity !== undefined && retainedSourceIds.has(sourceEntity)) {
          return Object.freeze({
            ...track,
            endRect: Object.freeze({ ...track.startRect }),
            timingGroupId: "finite-product.retained-source-scaffold",
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 1,
            sampleOpacityProgress: () => 1
          });
        }
        const referenceOrdinal = targetEntity === undefined
          ? undefined
          : referenceOrdinals.get(targetEntity);
        if (track.lifecycle === "introduce" &&
            referenceOrdinal !== undefined) {
          const presence = (progress: number) =>
            sample(progress).factors[referenceOrdinal]!.referencePresence;
          return Object.freeze({
            ...track,
            startRect: Object.freeze({ ...track.endRect }),
            timingGroupId: `finite-product.reference.${referenceOrdinal}`,
            intentionalContactGroupId:
              "finite-product.target-adjacency-cohort",
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 1,
            sampleOpacityProgress: presence,
            ...(mode === "reduced" ? {} : {
              sampleMaterialScale: (progress: number) =>
                0.82 + 0.18 * presence(progress)
            })
          });
        }
        throw new Error(
          `Finite-product transit received unclassified ${track.lifecycle} ` +
          `track ${track.id} (${sourceEntity ?? "no-source"} -> ` +
          `${targetEntity ?? "no-target"}).`
        );
      }));
    }
  });
  const rendererPlan = compileKpCanonicalNativeKatexScenePlan({
    source: ownership.source,
    target: ownership.target,
    relations: ownership.relations,
    trackProjection,
    copyFanOutRouting: false
  });
  const canonical = createKpCanonicalNativeKatexSceneSession(rendererPlan);
  let retired = false;
  return Object.freeze({
    kind: "kp-finite-product-transit-session" as const,
    lifecycle: "renderer-session" as const,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired finite-product session.");
      }
      return canonical.session.apply(progress);
    },
    retire() {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason: "surface-disposed",
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}
