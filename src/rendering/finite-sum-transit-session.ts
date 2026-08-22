import {
  sampleKpFiniteSumExpansionMotion,
  type KpFiniteSumExpansionMotionFrame,
  type KpFiniteSumMotionMode
} from "../animation/finite-sum-expansion-motion.ts";
import {
  kpCanonicalFiniteSumExpansionPresentationPlan
} from "../animation/finite-sum-expansion-presentation-plan.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../semantic/canonical-finite-sum-expansion.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  compileKpNativeKatexEndpointOwnershipObservation
} from "./native-katex-endpoint-ownership.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import {
  createKpFiniteSumNativePaintOwnership
} from "./finite-sum-native-paint-ownership.ts";
import {
  planKpFiniteSumRelationClearingTransit
} from "./finite-sum-relation-aware-transit.ts";
import type {
  KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexRenderedEndpointHandle
} from "./native-katex-rendered-scene.ts";

export interface KpFiniteSumTransitSession {
  readonly kind: "kp-finite-sum-transit-session";
  readonly lifecycle: "renderer-session";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function createKpFiniteSumTransitSession(input: {
  readonly sourceHandle: KpNativeKatexRenderedEndpointHandle;
  readonly targetHandle: KpNativeKatexRenderedEndpointHandle;
  readonly relationInkRect: KpStageRelativeRect;
  readonly mode?: Exclude<KpFiniteSumMotionMode, "static"> | undefined;
}): KpFiniteSumTransitSession {
  const mode = input.mode ?? "full";
  let sampledMotionProgress: number | undefined;
  let sampledMotion: KpFiniteSumExpansionMotionFrame | undefined;
  const sampleMotion = (progress: number): KpFiniteSumExpansionMotionFrame => {
    if (sampledMotionProgress !== progress || sampledMotion === undefined) {
      sampledMotionProgress = progress;
      sampledMotion = sampleKpFiniteSumExpansionMotion(progress, mode);
    }
    return sampledMotion;
  };
  const ownership = createKpFiniteSumNativePaintOwnership(input);
  const operation = kpCanonicalFiniteSumExpansionOperation;
  // Track IDs address the projected ownership observations, not the raw leaf
  // handles. Resolve semantic entities in that same paint namespace.
  const sourceObservation =
    compileKpNativeKatexEndpointOwnershipObservation(ownership.source);
  const targetObservation =
    compileKpNativeKatexEndpointOwnershipObservation(ownership.target);
  const sourceEntities = new Map(
    sourceObservation.atoms.map((atom) =>
      [atom.id, atom.semanticEntityId]
    )
  );
  const targetEntities = new Map(
    targetObservation.atoms.map((atom) =>
      [atom.id, atom.semanticEntityId]
    )
  );
  const retainedScaffoldIds = new Set<string>([
    operation.source.semantic.operator.id,
    operation.source.semantic.binder.id,
    operation.source.semantic.lowerBound.id,
    operation.source.semantic.upperBound.id,
    operation.source.semantic.body.references[0]!.id
  ]);
  const instanceOrdinal = new Map<string, number>(operation.target.instances.map(
    (instance) => [instance.id, instance.ordinal]
  ));
  const referenceOrdinal = new Map<string, number>(operation.target.instances.map(
    (instance) => [instance.references[0]!.id, instance.ordinal]
  ));
  const connectorOrdinal = new Map<string, number>(operation.target.connectors.map(
    (connector) => [connector.id, connector.ordinal + 1]
  ));
  const trackProjection = createKpNativeKatexTrackProjection({
    id: "track-projection.finite-sum-expansion.canonical.v1",
    project({ tracks }) {
      return Object.freeze(tracks.map((track) => {
        const sourceEntity = track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId);
        const targetEntity = track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId);
        const targetInstanceOrdinal = targetEntity === undefined
          ? undefined
          : instanceOrdinal.get(targetEntity);
        if (track.lifecycle === "split" &&
            targetInstanceOrdinal !== undefined) {
          const arrivalCohort = operation.target.instances[
            targetInstanceOrdinal
          ] === undefined
            ? undefined
            : kpCanonicalFiniteSumExpansionPresentationPlan.instances[
                targetInstanceOrdinal
              ]!.precedingConnector?.arrivalCohort;
          const motionPath = mode === "reduced"
            ? undefined
            : planKpFiniteSumRelationClearingTransit({
                id: `finite-sum.relation-clearing.${track.id}`,
                relationOccurrenceId:
                  kpCanonicalFiniteSumExpansionPresentationPlan
                    .transitBoundary.relationOccurrenceId,
                startPaintRect: track.startPaintRect,
                endPaintRect: track.endPaintRect,
                relationInkRect: input.relationInkRect
              }).selected;
          return Object.freeze({
            ...track,
            materialPositioning: "transform" as const,
            timingGroupId:
              `finite-sum.instance.${targetInstanceOrdinal}`,
            semanticMotionUnitId:
              `finite-sum.body.${targetInstanceOrdinal}`,
            routingCohortId: "finite-sum.ordered-template-fan-out",
            ...(arrivalCohort === undefined ? {} : {
              intentionalContactGroupId: arrivalCohort.id
            }),
            ...(motionPath === undefined ? {} : {
              motionPath,
              motionPathSampling: "planned-curve" as const
            }),
            sampleProgress: (progress: number) =>
              sampleMotion(progress).instances[targetInstanceOrdinal]!
                .bodyTransitProgress,
            samplePaintPresence: (progress: number) =>
              sampleMotion(progress).instances[targetInstanceOrdinal]!
                .bodyPresence
          });
        }
        if (track.lifecycle === "eliminate" &&
            sourceEntity !== undefined &&
            retainedScaffoldIds.has(sourceEntity)) {
          return Object.freeze({
            ...track,
            materialPositioning: "transform" as const,
            endRect: Object.freeze({ ...track.startRect }),
            timingGroupId: "finite-sum.retained-source-scaffold",
            opacityScheduleAuthority: "semantic-choreography" as const,
            // The frozen equivalence occurrence already paints these glyphs;
            // hiding transit clones prevents boldening and crossing noise.
            sampleProgress: () => 1,
            sampleOpacityProgress: () => 1
          });
        }
        const targetReferenceOrdinal = targetEntity === undefined
          ? undefined
          : referenceOrdinal.get(targetEntity);
        const targetConnectorOrdinal = targetEntity === undefined
          ? undefined
          : connectorOrdinal.get(targetEntity);
        const ordinal = targetReferenceOrdinal ?? targetConnectorOrdinal;
        if (track.lifecycle === "introduce" && ordinal !== undefined) {
          const arrivalCohort =
            kpCanonicalFiniteSumExpansionPresentationPlan.instances[ordinal]!
              .precedingConnector?.arrivalCohort;
          const presence = (progress: number) => {
            const frame = sampleMotion(progress).instances[ordinal]!;
            return targetReferenceOrdinal === undefined
              ? frame.precedingConnectorPresence
              : frame.referencePresence;
          };
          return Object.freeze({
            ...track,
            materialPositioning: "transform" as const,
            startRect: Object.freeze({ ...track.endRect }),
            timingGroupId: targetReferenceOrdinal === undefined
              ? `finite-sum.connector.${ordinal - 1}`
              : `finite-sum.reference.${ordinal}`,
            opacityScheduleAuthority: "semantic-choreography" as const,
            ...(arrivalCohort === undefined ? {} : {
              intentionalContactGroupId: arrivalCohort.id
            }),
            sampleProgress: () => 1,
            sampleOpacityProgress: presence,
            ...(mode === "reduced" ? {} : {
              sampleMaterialScale: (progress: number) =>
                0.82 + 0.18 * presence(progress)
            })
          });
        }
        throw new Error(
          `Finite-sum transit received unclassified ${track.lifecycle} track ` +
          `${track.id} (${track.sourceAtomId ?? "no-source-atom"}:` +
          `${sourceEntity ?? "no-source-entity"} -> ` +
          `${track.targetAtomId ?? "no-target-atom"}:` +
          `${targetEntity ?? "no-target-entity"}).`
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
    kind: "kp-finite-sum-transit-session" as const,
    lifecycle: "renderer-session" as const,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired finite-sum transit session.");
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
