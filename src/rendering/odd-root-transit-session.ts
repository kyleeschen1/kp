import {
  isKpVerifiedOddRootSolveExemplar,
  type KpVerifiedOddRootSolveExemplar
} from "../semantic/odd-root-solve-exemplar.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexRendererReadyScenePlan
} from "./native-katex-base-scene-plan.ts";
import {
  planKpEquationMotionPathBetweenPoints
} from "./equation-motion-path-planner.ts";
import type { KpOddRootNativeEndpointSet } from
  "./odd-root-native-endpoints.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
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
import { createKpNativeKatexTrackProjection } from
  "./native-katex-track-projection.ts";

const kpOddRootTreatment = Object.freeze({
  exponentIndexTransferWindow: Object.freeze({ start: 0.08, end: 0.6 }),
  radicalIntroductionWindow: Object.freeze({ start: 0.42, end: 0.62 }),
  contextSettlementWindow: Object.freeze({ start: 0.14, end: 0.62 }),
  departureClearanceInLocalInkHeights: 0.55
});

export interface KpOddRootMotionPlan {
  readonly kind: "odd-root-motion-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly exemplar: KpVerifiedOddRootSolveExemplar;
  readonly rendererPlan: KpNativeKatexRendererReadyScenePlan;
  readonly exponentIndexTrackId: string;
  readonly radicalTrackIds: readonly [string, ...string[]];
  readonly toJSON: () => never;
}

export interface KpOddRootTransitSession {
  readonly kind: "odd-root-transit-session";
  readonly lifecycle: "renderer-session";
  readonly motion: KpOddRootMotionPlan;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: "surface-disposed" | "measurement-invalidated" | "scene-replaced"
  ) => void;
}

export function compileKpOddRootMotion(input: {
  readonly exemplar: KpVerifiedOddRootSolveExemplar;
  readonly endpoints: KpOddRootNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpOddRootMotionPlan {
  assertInput(input);
  const [sourceState, targetState] = input.exemplar.states;
  const operation = input.exemplar.operation;
  const paintCorrespondence = operation.correspondence.filter(({ relation }) =>
    relation === "identity" || relation === "role-transfer"
  );
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: paintCorrespondence.map((record) => ({
      id: record.id,
      kind: "one-to-one" as const,
      sourceEntityIds: record.sourceEntityIds,
      targetEntityIds: record.targetEntityIds
    }))
  });
  let exponentIndexTrackId: string | undefined;
  let radicalTrackIds: readonly string[] | undefined;
  const rootReceptionContactGroupId =
    `contact.${input.exemplar.id}.root-reception`;
  const trackProjection = createKpNativeKatexTrackProjection({
    id: `track-projection.${input.exemplar.id}.odd-root`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      const radicalIds: string[] = [];
      const projected = tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (from === sourceState.exponent.entityId &&
          to === targetState.rootIndex.entityId) {
          exponentIndexTrackId = track.id;
          const localInkHeight = Math.max(
            track.startPaintRect.height,
            track.endPaintRect.height,
            1
          );
          const motionPath = planKpEquationMotionPathBetweenPoints({
            id: `operation-path.${input.exemplar.id}.exponent-to-index`,
            relationRecordId:
              "correspondence.inverse-power.exponent-index",
            start: center(track.startPaintRect),
            end: center(track.endPaintRect),
            variants: ["arc-above"],
            clearance: localInkHeight *
              kpOddRootTreatment.departureClearanceInLocalInkHeights
          }).selected;
          return Object.freeze({
            ...track,
            motionPath,
            motionPathSampling:
              "foreground-diagonal-role-transfer" as const,
            timingGroupId: `timing.${input.exemplar.id}.role-transfer`,
            semanticMotionUnitId:
              `motion.${input.exemplar.id}.exponent-index`,
            intentionalContactGroupId: rootReceptionContactGroupId,
            sampleProgress: sampleWindow(
              kpOddRootTreatment.exponentIndexTransferWindow.start,
              kpOddRootTreatment.exponentIndexTransferWindow.end
            )
          });
        }
        if (to === targetState.radical.entityId) {
          radicalIds.push(track.id);
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: track.endRect,
            startPaintRect: track.endPaintRect,
            timingGroupId: `timing.${input.exemplar.id}.root-reception`,
            semanticMotionUnitId:
              `motion.${input.exemplar.id}.radical-introduction`,
            intentionalContactGroupId: rootReceptionContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 1,
            sampleOpacityProgress: sampleWindow(
              kpOddRootTreatment.radicalIntroductionWindow.start,
              kpOddRootTreatment.radicalIntroductionWindow.end
            )
          }));
        }
        return Object.freeze({
          ...track,
          ...(to === targetState.radicand.entityId
            ? { intentionalContactGroupId: rootReceptionContactGroupId }
            : {}),
          sampleProgress: sampleWindow(
            kpOddRootTreatment.contextSettlementWindow.start,
            kpOddRootTreatment.contextSettlementWindow.end
          )
        });
      });
      radicalTrackIds = Object.freeze(radicalIds);
      return Object.freeze(projected);
    }
  });
  const rendererPlan = compileKpCanonicalNativeKatexScenePlan({
    source: createKpNativeKatexRenderedEndpointHandle({
      observation: input.source
    }),
    target: createKpNativeKatexRenderedEndpointHandle({
      observation: input.target
    }),
    relations,
    trackProjection,
    fanInRouting: false,
    copyFanOutRouting: false
  });
  if (exponentIndexTrackId === undefined || radicalTrackIds === undefined ||
    radicalTrackIds.length === 0) {
    throw new Error("Odd-root realization did not classify its paint roles.");
  }
  return Object.freeze({
    kind: "odd-root-motion-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    exemplar: input.exemplar,
    rendererPlan,
    exponentIndexTrackId,
    radicalTrackIds: radicalTrackIds as readonly [string, ...string[]],
    toJSON(): never {
      throw new Error("Odd-root motion plans cannot enter durable state.");
    }
  });
}

export function createKpOddRootTransitSession(input: {
  readonly exemplar: KpVerifiedOddRootSolveExemplar;
  readonly endpoints: KpOddRootNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpOddRootTransitSession {
  const motion = compileKpOddRootMotion(input);
  const canonical = createKpCanonicalNativeKatexSceneSession(
    motion.rendererPlan
  );
  let retired = false;
  return Object.freeze({
    kind: "odd-root-transit-session" as const,
    lifecycle: "renderer-session" as const,
    motion,
    canonical,
    apply(progress: number) {
      if (retired) throw new Error("Cannot apply a retired odd-root session.");
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
  readonly exemplar: KpVerifiedOddRootSolveExemplar;
  readonly endpoints: KpOddRootNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  if (!isKpVerifiedOddRootSolveExemplar(input.exemplar) ||
    input.endpoints.exemplar !== input.exemplar) {
    throw new Error("Odd-root realization requires matching authority.");
  }
  if (input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage ||
    input.source.root === input.target.root) {
    throw new Error("Odd-root realization crossed endpoint ownership.");
  }
}

function entityByAtom(scene: KpNativeKatexRenderedSceneObservation) {
  return new Map(scene.atoms.map((atom) => [atom.id, atom.semanticEntityId]));
}

function center(rect: Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>) {
  return Object.freeze({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  });
}

function sampleWindow(start: number, end: number) {
  return (progress: number): number => {
    if (progress <= start) return 0;
    if (progress >= end) return 1;
    const local = (progress - start) / (end - start);
    return local * local * (3 - 2 * local);
  };
}
