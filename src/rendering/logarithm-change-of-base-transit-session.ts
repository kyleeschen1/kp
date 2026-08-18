import {
  createKpCanonicalFunctionWrapChoreography,
  createKpCausalStructuralIntroductionChoreography
} from "../animation/equation-operation-choreography.ts";
import {
  kpCanonicalLogarithmChangeOfBasePresentationPlan
} from "../animation/logarithm-change-of-base-presentation-plan.ts";
import {
  kpCanonicalLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import {
  applyKpNativeKatexOperationChoreography
} from "./native-katex-operation-choreography.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export const kpLogarithmChangeOfBaseExemplarTiming = Object.freeze({
  id: "timing.logarithm-change-of-base.exemplar.v1" as const,
  argumentReflow: Object.freeze({ start: 0.06, end: 0.54 }),
  sourceEnclosureExit: Object.freeze({ start: 0.08, end: 0.24 }),
  fractionRuleEntry: Object.freeze({ start: 0.44, end: 0.58 }),
  wrapperEntry: Object.freeze({ start: 0.58, end: 0.9 }),
  sourceOperatorRelease: Object.freeze({ start: 0.32, end: 0.5 })
});

export interface KpLogarithmChangeOfBaseTransitSession {
  readonly kind: "kp-logarithm-change-of-base-transit-session";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function createKpLogarithmChangeOfBaseTransitSession(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpLogarithmChangeOfBaseTransitSession {
  if (
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage
  ) {
    throw new Error("Change-of-base transit requires one shared measured stage.");
  }
  const presentation = kpCanonicalLogarithmChangeOfBasePresentationPlan;
  const functionWrap = createKpCanonicalFunctionWrapChoreography({
    invocationGroup: presentation.functionWrapInvocationGroup,
    direction: "forward",
    argumentReflowWindow: kpLogarithmChangeOfBaseExemplarTiming.argumentReflow,
    wrapperEntryWindow: kpLogarithmChangeOfBaseExemplarTiming.wrapperEntry
  });
  const fractionRule = createKpCausalStructuralIntroductionChoreography({
    id: "operation-choreography.logarithm-change-of-base.fraction-rule.forward",
    transformationId: kpCanonicalLogarithmChangeOfBase.id,
    direction: "forward",
    semanticEntityIds: [
      kpCanonicalLogarithmChangeOfBase.target.divisionEntityId
    ],
    entryWindow: kpLogarithmChangeOfBaseExemplarTiming.fractionRuleEntry
  });
  const plan = compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: projectKpNativeKatexSemanticPaintRelations({
      groups: presentation.identityTransfers.map((transfer) => ({
        id: transfer.correspondenceId,
        kind: "one-to-one" as const,
        sourceEntityIds: [transfer.sourceEntityId],
        targetEntityIds: [transfer.targetEntityId]
      }))
    }),
    endpointDwellFraction: 0,
    operationChoreography: functionWrap,
    trackProjection: createKpNativeKatexTrackProjection({
      id: "track-projection.logarithm-change-of-base.fraction-rule.v1",
      project(projectionInput) {
        const withFractionRule = applyKpNativeKatexOperationChoreography({
          ...projectionInput,
          choreography: fractionRule
        });
        return projectSourceSyntaxHandoff({
          tracks: withFractionRule,
          source: projectionInput.source
        });
      }
    })
  });
  const canonical = createKpCanonicalNativeKatexSceneSession(plan);
  let retired = false;
  return Object.freeze({
    kind: "kp-logarithm-change-of-base-transit-session" as const,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired change-of-base transit session.");
      }
      return canonical.session.apply(bounded(progress));
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

function projectSourceSyntaxHandoff(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const sourceEntityByAtomId = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const sourceOperatorId = kpCanonicalLogarithmChangeOfBase.source.operatorEntityId;
  return Object.freeze(input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntityByAtomId.get(track.sourceAtomId);
    if (sourceEntityId === sourceOperatorId && track.lifecycle === "eliminate") {
      const sample = (progress: number) => smoothWindow(
        progress,
        kpLogarithmChangeOfBaseExemplarTiming.sourceOperatorRelease
      );
      return Object.freeze({
        ...track,
        timingGroupId: "timing.logarithm-change-of-base.operator-handoff",
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample
      });
    }
    if (
      sourceEntityId === kpCanonicalLogarithmChangeOfBase.source.stateId &&
      track.lifecycle === "eliminate"
    ) {
      const sample = (progress: number) => smoothWindow(
        progress,
        kpLogarithmChangeOfBaseExemplarTiming.sourceEnclosureExit
      );
      return Object.freeze({
        ...track,
        timingGroupId: "timing.logarithm-change-of-base.source-enclosure-exit",
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample
      });
    }
    return track;
  }));
}

function smoothWindow(
  progress: number,
  window: Readonly<{ start: number; end: number }>
): number {
  const linear = bounded((progress - window.start) / (window.end - window.start));
  return linear * linear * (3 - (2 * linear));
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Change-of-base transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
