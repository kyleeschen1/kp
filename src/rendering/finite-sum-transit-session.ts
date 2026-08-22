import {
  sampleKpFiniteSumExpansionMotion,
  type KpFiniteSumMotionMode
} from "../animation/finite-sum-expansion-motion.ts";
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
  readonly mode?: Exclude<KpFiniteSumMotionMode, "static"> | undefined;
}): KpFiniteSumTransitSession {
  const mode = input.mode ?? "full";
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
  const scopeIds = new Set<string>([
    operation.source.semantic.operator.id,
    operation.source.semantic.binder.id,
    operation.source.semantic.lowerBound.id,
    operation.source.semantic.upperBound.id
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
  const operatorAtom = ownership.source.handle.observation.atoms.find(
    ({ semanticEntityId }) =>
      semanticEntityId === operation.source.semantic.operator.id
  );
  if (operatorAtom === undefined) {
    throw new Error("Finite-sum transit lacks measured operator ink.");
  }
  const operatorCenter = {
    x: operatorAtom.rect.left + operatorAtom.rect.width / 2,
    y: operatorAtom.rect.top + operatorAtom.rect.height / 2
  };
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
          return Object.freeze({
            ...track,
            timingGroupId:
              `finite-sum.instance.${targetInstanceOrdinal}`,
            sampleProgress: (progress: number) =>
              sampleKpFiniteSumExpansionMotion(progress, mode)
                .instances[targetInstanceOrdinal]!.bodyTransitProgress,
            samplePaintPresence: (progress: number) =>
              sampleKpFiniteSumExpansionMotion(progress, mode)
                .instances[targetInstanceOrdinal]!.bodyPresence
          });
        }
        if (track.lifecycle === "eliminate" &&
            sourceEntity !== undefined && scopeIds.has(sourceEntity)) {
          return Object.freeze({
            ...track,
            endRect: Object.freeze({
              ...track.endRect,
              left: operatorCenter.x - track.endRect.width / 2,
              top: operatorCenter.y - track.endRect.height / 2
            }),
            timingGroupId: "finite-sum.source-scope-withdrawal",
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: (progress: number) =>
              sampleKpFiniteSumExpansionMotion(progress, mode)
                .sourceScope.contractionProgress,
            sampleOpacityProgress: (progress: number) =>
              1 - sampleKpFiniteSumExpansionMotion(progress, mode)
                .sourceScope.presence,
            ...(mode === "reduced" ? {} : {
              sampleMaterialScale: (progress: number) =>
                1 - 0.25 * sampleKpFiniteSumExpansionMotion(progress, mode)
                  .sourceScope.contractionProgress
            })
          });
        }
        if (track.lifecycle === "eliminate" &&
            sourceEntity === operation.source.semantic.body.references[0]!.id) {
          return Object.freeze({
            ...track,
            endRect: Object.freeze({ ...track.startRect }),
            timingGroupId: "finite-sum.source-reference-withdrawal",
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 0,
            sampleOpacityProgress: (progress: number) =>
              1 - sampleKpFiniteSumExpansionMotion(progress, mode)
                .sourceReferencePresence
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
          const presence = (progress: number) => {
            const frame = sampleKpFiniteSumExpansionMotion(progress, mode)
              .instances[ordinal]!;
            return targetReferenceOrdinal === undefined
              ? frame.precedingConnectorPresence
              : frame.referencePresence;
          };
          return Object.freeze({
            ...track,
            startRect: Object.freeze({ ...track.endRect }),
            timingGroupId: targetReferenceOrdinal === undefined
              ? `finite-sum.connector.${ordinal - 1}`
              : `finite-sum.reference.${ordinal}`,
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
