import {
  createKpFunctionWrapReceptionPlan
} from "../animation/function-wrap-motif.ts";
import {
  isKpVerifiedCompoundRootCarrierExemplar,
  type KpVerifiedCompoundRootCarrierExemplar
} from "../semantic/compound-root-carrier-exemplar.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexRendererReadyScenePlan
} from "./native-katex-base-scene-plan.ts";
import type { KpNativeKatexFunctionWrapAdaptationCertificate } from
  "./native-katex-function-wrap-reception.ts";
import {
  adaptKpNativeKatexFunctionWrapReception
} from "./native-katex-function-wrap-reception.ts";
import {
  createKpNativeKatexEndpointOwnershipView
} from "./native-katex-endpoint-ownership.ts";
import {
  createKpNativeKatexRenderedEndpointHandle,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import type { KpCompoundRootCarrierNativeEndpointSet } from
  "./compound-root-carrier-native-endpoints.ts";

const kpCompoundRootCarrierTreatment = Object.freeze({
  sourceWithdrawal: Object.freeze({ start: 0.08, end: 0.34 }),
  carrierTransit: Object.freeze({ start: 0.2, end: 0.6 }),
  enclosurePresence: Object.freeze({ start: 0.42, end: 0.5 }),
  enclosureReception: Object.freeze({ start: 0.5, end: 0.74 }),
  enclosureOutwardOffsetInNativeHeights: 0.58
});

export interface KpCompoundRootCarrierMotionPlan {
  readonly kind: "compound-root-carrier-motion-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly exemplar: KpVerifiedCompoundRootCarrierExemplar;
  readonly rendererPlan: KpNativeKatexRendererReadyScenePlan;
  readonly carrierTrackId: string;
  readonly removedSyntaxTrackIds: readonly string[];
  readonly enclosureTrackIds: readonly string[];
  readonly functionWrapCertificate:
    KpNativeKatexFunctionWrapAdaptationCertificate;
  readonly toJSON: () => never;
}

export interface KpCompoundRootCarrierTransitSession {
  readonly kind: "compound-root-carrier-transit-session";
  readonly lifecycle: "renderer-session";
  readonly motion: KpCompoundRootCarrierMotionPlan;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: "surface-disposed" | "measurement-invalidated" | "scene-replaced"
  ) => void;
}

export function compileKpCompoundRootCarrierMotion(input: {
  readonly exemplar: KpVerifiedCompoundRootCarrierExemplar;
  readonly endpoints: KpCompoundRootCarrierNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpCompoundRootCarrierMotionPlan {
  assertInput(input);
  const [sourceState, targetState] = input.exemplar.states;
  const sourceHandle = createKpNativeKatexRenderedEndpointHandle({
    observation: input.source
  });
  const targetHandle = createKpNativeKatexRenderedEndpointHandle({
    observation: input.target
  });
  const sourceCarrierGroupId = groupIdFor(
    input.endpoints.source,
    sourceState.carrier.occurrence.entityId
  );
  const targetCarrierGroupId = groupIdFor(
    input.endpoints.target,
    targetState.carrier.occurrence.entityId
  );
  const source = createKpNativeKatexEndpointOwnershipView({
    handle: sourceHandle,
    endpoint: "source",
    collapsedGroupIds: [sourceCarrierGroupId]
  });
  const target = createKpNativeKatexEndpointOwnershipView({
    handle: targetHandle,
    endpoint: "target",
    collapsedGroupIds: [targetCarrierGroupId]
  });
  const wrapPlan = createKpFunctionWrapReceptionPlan({
    id: `reception.${input.exemplar.id}.absolute-value`,
    direction: "forward",
    branches: [{
      id: "branch.absolute-value",
      argumentEntityIds: [targetState.carrier.occurrence.entityId],
      syntaxEntityIds: [],
      enclosureEntityRoles: [{
        entityId: targetState.leadingDelimiter.entityId,
        side: "leading"
      }, {
        entityId: targetState.trailingDelimiter.entityId,
        side: "trailing"
      }]
    }]
  });
  let carrierTrackId: string | undefined;
  let removedSyntaxTrackIds: readonly string[] | undefined;
  let enclosureTrackIds: readonly string[] | undefined;
  let functionWrapCertificate:
    KpNativeKatexFunctionWrapAdaptationCertificate | undefined;
  const trackProjection = createKpNativeKatexTrackProjection({
    id: `track-projection.${input.exemplar.id}`,
    project(projectionInput) {
      const sourceEntityByAtom = new Map(projectionInput.source.atoms.map(
        ({ id, semanticEntityId }) => [id, semanticEntityId]
      ));
      const targetEntityByAtom = new Map(projectionInput.target.atoms.map(
        ({ id, semanticEntityId }) => [id, semanticEntityId]
      ));
      const removedIds: string[] = [];
      const initial = projectionInput.tracks.map((track) => {
        const sourceEntity = track.sourceAtomId === undefined
          ? undefined
          : sourceEntityByAtom.get(track.sourceAtomId);
        const targetEntity = track.targetAtomId === undefined
          ? undefined
          : targetEntityByAtom.get(track.targetAtomId);
        if (track.lifecycle === "persist" &&
          sourceEntity === sourceState.carrier.occurrence.entityId &&
          targetEntity === targetState.carrier.occurrence.entityId) {
          carrierTrackId = track.id;
          return Object.freeze({
            ...track,
            timingGroupId: `timing.${input.exemplar.id}.carrier-transit`,
            sampleProgress: sampleWindow(
              kpCompoundRootCarrierTreatment.carrierTransit.start,
              kpCompoundRootCarrierTreatment.carrierTransit.end
            )
          });
        }
        if (track.lifecycle === "eliminate") {
          removedIds.push(track.id);
          return Object.freeze({
            ...track,
            endRect: Object.freeze({ ...track.startRect }),
            endPaintRect: Object.freeze({ ...track.startPaintRect }),
            timingGroupId: `timing.${input.exemplar.id}.source-withdrawal`,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 0,
            sampleOpacityProgress: sampleWindow(
              kpCompoundRootCarrierTreatment.sourceWithdrawal.start,
              kpCompoundRootCarrierTreatment.sourceWithdrawal.end
            )
          });
        }
        if (track.lifecycle !== "introduce") {
          throw new Error(
            `Compound-root realization received unclassified ${track.lifecycle} track.`
          );
        }
        return track;
      });
      const adapted = adaptKpNativeKatexFunctionWrapReception({
        tracks: initial,
        source: projectionInput.source,
        target: projectionInput.target,
        plan: wrapPlan,
        entryWindow: kpCompoundRootCarrierTreatment.enclosureReception,
        presenceWindow: kpCompoundRootCarrierTreatment.enclosurePresence,
        motion: "horizontal-squeeze",
        horizontalSqueezeTreatment: {
          outwardOffsetInNativeHeights:
            kpCompoundRootCarrierTreatment
              .enclosureOutwardOffsetInNativeHeights
        }
      });
      removedSyntaxTrackIds = Object.freeze(removedIds);
      enclosureTrackIds = Object.freeze(adapted.tracks.filter((track) =>
        track.targetAtomId !== undefined &&
        [targetState.leadingDelimiter.entityId,
          targetState.trailingDelimiter.entityId].includes(
            targetEntityByAtom.get(track.targetAtomId) ?? ""
          )
      ).map(({ id }) => id));
      functionWrapCertificate = adapted.certificate;
      return adapted.tracks;
    }
  });
  const rendererPlan = compileKpCanonicalNativeKatexScenePlan({
    source,
    target,
    relations: projectKpNativeKatexSemanticPaintRelations({
      groups: [{
        id: `relation.${input.exemplar.id}.carrier`,
        kind: "one-to-one",
        sourceEntityIds: [sourceState.carrier.occurrence.entityId],
        targetEntityIds: [targetState.carrier.occurrence.entityId]
      }]
    }),
    trackProjection,
    fanInRouting: false,
    copyFanOutRouting: false
  });
  if (carrierTrackId === undefined ||
    removedSyntaxTrackIds === undefined || removedSyntaxTrackIds.length === 0 ||
    enclosureTrackIds === undefined || enclosureTrackIds.length !== 2 ||
    functionWrapCertificate === undefined) {
    throw new Error(
      "Compound-root realization did not classify its complete paint topology."
    );
  }
  return Object.freeze({
    kind: "compound-root-carrier-motion-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    exemplar: input.exemplar,
    rendererPlan,
    carrierTrackId,
    removedSyntaxTrackIds,
    enclosureTrackIds,
    functionWrapCertificate,
    toJSON(): never {
      throw new Error("Compound-root motion plans cannot enter durable state.");
    }
  });
}

export function createKpCompoundRootCarrierTransitSession(input: {
  readonly exemplar: KpVerifiedCompoundRootCarrierExemplar;
  readonly endpoints: KpCompoundRootCarrierNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpCompoundRootCarrierTransitSession {
  const motion = compileKpCompoundRootCarrierMotion(input);
  const canonical = createKpCanonicalNativeKatexSceneSession(
    motion.rendererPlan
  );
  let retired = false;
  return Object.freeze({
    kind: "compound-root-carrier-transit-session" as const,
    lifecycle: "renderer-session" as const,
    motion,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired compound-root session.");
      }
      return canonical.session.apply(Math.max(0, Math.min(1, progress)));
    },
    retire(
      reason: "surface-disposed" | "measurement-invalidated" |
        "scene-replaced" = "surface-disposed"
    ) {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason,
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

function assertInput(input: {
  readonly exemplar: KpVerifiedCompoundRootCarrierExemplar;
  readonly endpoints: KpCompoundRootCarrierNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  if (!isKpVerifiedCompoundRootCarrierExemplar(input.exemplar) ||
    input.endpoints.exemplar !== input.exemplar) {
    throw new Error("Compound-root realization requires matching authority.");
  }
  if (input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage ||
    input.source.root === input.target.root) {
    throw new Error("Compound-root realization crossed endpoint ownership.");
  }
}

function groupIdFor(
  endpoint: KpCompoundRootCarrierNativeEndpointSet["source"],
  entityId: string
): string {
  const nodes = endpoint.nodes.filter(({ occurrence }) =>
    occurrence.entityId === entityId);
  if (nodes.length !== 1) {
    throw new Error(`Compound-root endpoint lacks unique entity ${entityId}.`);
  }
  return nodes[0]!.presentationGroupId;
}

function sampleWindow(start: number, end: number): (progress: number) => number {
  return (progress: number) => {
    if (progress <= start) return 0;
    if (progress >= end) return 1;
    const local = (progress - start) / (end - start);
    return local * local * (3 - 2 * local);
  };
}
