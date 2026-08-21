import {
  isKpVerifiedRationalExponentCompositionExemplar,
  type KpVerifiedRationalExponentCompositionExemplar
} from "../semantic/rational-exponent-composition-exemplar.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexRendererReadyScenePlan
} from "./native-katex-base-scene-plan.ts";
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
import type { KpRationalExponentCompositionNativeEndpointSet } from
  "./rational-exponent-composition-native-endpoints.ts";

const kpRationalExponentCompositionTreatment = Object.freeze({
  radicalWithdrawalWindow: Object.freeze({ start: 0.08, end: 0.26 }),
  operandTransitWindow: Object.freeze({ start: 0.18, end: 0.62 }),
  divisionIntroductionWindow: Object.freeze({ start: 0.4, end: 0.56 }),
  carrierSettlementWindow: Object.freeze({ start: 0.14, end: 0.62 })
});

export interface KpRationalExponentCompositionMotionPlan {
  readonly kind: "rational-exponent-composition-motion-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly exemplar: KpVerifiedRationalExponentCompositionExemplar;
  readonly rendererPlan: KpNativeKatexRendererReadyScenePlan;
  readonly compositionTrackIds: readonly [string, ...string[]];
  readonly divisionTrackIds: readonly [string, ...string[]];
  readonly radicalTrackIds: readonly [string, ...string[]];
  readonly toJSON: () => never;
}

export function compileKpRationalExponentCompositionMotion(input: {
  readonly exemplar: KpVerifiedRationalExponentCompositionExemplar;
  readonly endpoints: KpRationalExponentCompositionNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpRationalExponentCompositionMotionPlan {
  assertInput(input);
  const [sourceState, targetState] = input.exemplar.states;
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: input.exemplar.correspondence.map((record) => ({
      id: record.id,
      kind: record.relation === "identity" || record.relation === "role-change"
        ? "one-to-one" as const
        : record.relation === "introduction"
          ? "introduction" as const
          : "removal" as const,
      sourceEntityIds: record.sourceEntityIds,
      targetEntityIds: record.targetEntityIds
    }))
  });
  const sourceCompositionIds = new Set([
    sourceState.exponent.entityId,
    sourceState.rootIndex.entityId
  ]);
  const targetCompositionIds = new Set([
    targetState.numerator.entityId,
    targetState.denominator.entityId
  ]);
  const compositionTrackIds: string[] = [];
  const divisionTrackIds: string[] = [];
  const radicalTrackIds: string[] = [];
  const assemblyContactGroupId =
    `contact.${input.exemplar.id}.rational-exponent-assembly`;
  const trackProjection = createKpNativeKatexTrackProjection({
    id: `track-projection.${input.exemplar.id}`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      return Object.freeze(tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (from !== undefined && to !== undefined &&
          sourceCompositionIds.has(from) && targetCompositionIds.has(to)) {
          compositionTrackIds.push(track.id);
          return Object.freeze({
            ...track,
            timingGroupId: `timing.${input.exemplar.id}.composition`,
            semanticMotionUnitId:
              `motion.${input.exemplar.id}.exponent-index-composition`,
            intentionalContactGroupId: assemblyContactGroupId,
            sampleProgress: sampleWindow(
              kpRationalExponentCompositionTreatment.operandTransitWindow.start,
              kpRationalExponentCompositionTreatment.operandTransitWindow.end
            )
          });
        }
        if (to === targetState.division.entityId) {
          divisionTrackIds.push(track.id);
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: track.endRect,
            startPaintRect: track.endPaintRect,
            timingGroupId: `timing.${input.exemplar.id}.composition`,
            semanticMotionUnitId:
              `motion.${input.exemplar.id}.division-introduction`,
            intentionalContactGroupId: assemblyContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 1,
            sampleOpacityProgress: sampleWindow(
              kpRationalExponentCompositionTreatment
                .divisionIntroductionWindow.start,
              kpRationalExponentCompositionTreatment
                .divisionIntroductionWindow.end
            )
          }));
        }
        if (from === sourceState.radical.entityId) {
          radicalTrackIds.push(track.id);
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            endRect: track.startRect,
            endPaintRect: track.startPaintRect,
            timingGroupId: `timing.${input.exemplar.id}.radical-withdrawal`,
            semanticMotionUnitId:
              `motion.${input.exemplar.id}.radical-withdrawal`,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 0,
            sampleOpacityProgress: sampleWindow(
              kpRationalExponentCompositionTreatment
                .radicalWithdrawalWindow.start,
              kpRationalExponentCompositionTreatment
                .radicalWithdrawalWindow.end
            )
          }));
        }
        return Object.freeze({
          ...track,
          sampleProgress: sampleWindow(
            kpRationalExponentCompositionTreatment.carrierSettlementWindow
              .start,
            kpRationalExponentCompositionTreatment.carrierSettlementWindow.end
          )
        });
      }));
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
  if (compositionTrackIds.length !== 2 || divisionTrackIds.length === 0 ||
    radicalTrackIds.length === 0) {
    throw new Error(
      "Rational-exponent realization did not classify complete notation paint."
    );
  }
  return Object.freeze({
    kind: "rational-exponent-composition-motion-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    exemplar: input.exemplar,
    rendererPlan,
    compositionTrackIds: Object.freeze(compositionTrackIds) as readonly [
      string,
      ...string[]
    ],
    divisionTrackIds: Object.freeze(divisionTrackIds) as readonly [
      string,
      ...string[]
    ],
    radicalTrackIds: Object.freeze(radicalTrackIds) as readonly [
      string,
      ...string[]
    ],
    toJSON(): never {
      throw new Error(
        "Rational-exponent motion plans cannot enter durable state."
      );
    }
  });
}

export function createKpRationalExponentCompositionTransitSession(input: {
  readonly exemplar: KpVerifiedRationalExponentCompositionExemplar;
  readonly endpoints: KpRationalExponentCompositionNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}) {
  const motion = compileKpRationalExponentCompositionMotion(input);
  const canonical: KpCanonicalNativeKatexSceneSession =
    createKpCanonicalNativeKatexSceneSession(motion.rendererPlan);
  let retired = false;
  return Object.freeze({
    kind: "rational-exponent-composition-transit-session" as const,
    lifecycle: "renderer-session" as const,
    motion,
    canonical,
    apply(progress: number): KpNativeKatexSceneOwnershipFrame {
      if (retired) throw new Error("Cannot apply a retired root session.");
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
  readonly exemplar: KpVerifiedRationalExponentCompositionExemplar;
  readonly endpoints: KpRationalExponentCompositionNativeEndpointSet;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  if (!isKpVerifiedRationalExponentCompositionExemplar(input.exemplar) ||
    input.endpoints.exemplar !== input.exemplar) {
    throw new Error("Rational-exponent motion requires matching authority.");
  }
  if (input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage ||
    input.source.root === input.target.root) {
    throw new Error("Rational-exponent motion crossed endpoint ownership.");
  }
}

function entityByAtom(scene: KpNativeKatexRenderedSceneObservation) {
  return new Map(scene.atoms.map((atom) => [atom.id, atom.semanticEntityId]));
}

function sampleWindow(start: number, end: number) {
  return (progress: number): number => {
    if (progress <= start) return 0;
    if (progress >= end) return 1;
    const local = (progress - start) / (end - start);
    return local * local * (3 - 2 * local);
  };
}
