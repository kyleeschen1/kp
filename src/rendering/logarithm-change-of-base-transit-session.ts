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
  projectKpNativeKatexSemanticPaintRelations
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
  fractionRuleEntry: Object.freeze({ start: 0.44, end: 0.58 }),
  wrapperEntry: Object.freeze({ start: 0.58, end: 0.9 })
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
        return applyKpNativeKatexOperationChoreography({
          ...projectionInput,
          choreography: fractionRule
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

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Change-of-base transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
