import {
  pointOnKpSchemeBindingArc,
  sampleKpSchemeBindingMotion,
  type KpSchemeBindingArc,
  type KpSchemeBindingSample
} from "./scheme-factorial-binding-choreography.ts";
import type { KpSchemeFactorialChoreography } from
  "./scheme-factorial-choreography.ts";
import {
  sampleKpSchemeBranchMotif,
  sampleKpSchemePrimitiveMotif,
  sampleKpSchemeSummaryMotif,
  type KpSchemeBranchMotif,
  type KpSchemeBranchMotifSample,
  type KpSchemePrimitiveMotif,
  type KpSchemePrimitiveMotifSample,
  type KpSchemeSummaryMotifSample
} from "./scheme-factorial-evaluation-motifs.ts";
import {
  sampleKpSchemeFactorialReturn,
  type KpSchemeReturnSample
} from "./scheme-factorial-return-choreography.ts";
import {
  sampleKpSchemeStructuralTransition,
  type KpSchemeStructuralSample,
  type KpSchemeStructuralTransition
} from "./scheme-factorial-structural-choreography.ts";
import type { KpSchemeFactorialTimelineSample } from
  "./scheme-factorial-timeline.ts";
import {
  sampleKpSchemeFactorialSettlement,
  type KpSchemeFactorialSettlementEvidence
} from "./scheme-factorial-settlement.ts";

interface KpSchemeSettlementProjection {
  readonly settlement: KpSchemeFactorialSettlementEvidence;
}

export type KpSchemeFactorialMotionProjection =
  | { readonly kind: "none" }
  | (KpSchemeSettlementProjection & {
      readonly kind: "structural";
      readonly transition: KpSchemeStructuralTransition;
      readonly sample: KpSchemeStructuralSample;
    })
  | (KpSchemeSettlementProjection & {
      readonly kind: "binding";
      readonly arc: KpSchemeBindingArc;
      readonly sample: KpSchemeBindingSample;
      readonly point: { readonly inline: number; readonly block: number };
    })
  | (KpSchemeSettlementProjection & {
      readonly kind: "branch";
      readonly motif: KpSchemeBranchMotif;
      readonly sample: KpSchemeBranchMotifSample;
    })
  | (KpSchemeSettlementProjection & {
      readonly kind: "primitive";
      readonly motif: KpSchemePrimitiveMotif;
      readonly sample: KpSchemePrimitiveMotifSample;
    })
  | (KpSchemeSettlementProjection & {
      readonly kind: "summary";
      readonly sample: KpSchemeSummaryMotifSample;
    })
  | (KpSchemeSettlementProjection & {
      readonly kind: "return";
      readonly sample: KpSchemeReturnSample;
    });

/** Chooses one primary attention carrier while retaining compiled truth. */
export function projectKpSchemeFactorialMotion(input: {
  readonly choreography: KpSchemeFactorialChoreography;
  readonly timeline: KpSchemeFactorialTimelineSample;
}): KpSchemeFactorialMotionProjection {
  if (input.timeline.phase === "hold") return Object.freeze({ kind: "none" });
  const progress = input.timeline.localProgress;
  switch (input.timeline.motionKind) {
    case "definition-seed":
      return progress < 0.46
        ? structural(input.choreography, 0, range(progress, 0, 0.46))
        : binding(input.choreography, 0, range(progress, 0.46, 1));
    case "first-descent":
      if (progress < 0.26) {
        return branch(input.choreography, 0, range(progress, 0, 0.26));
      }
      if (progress < 0.58) {
        const primitive = input.choreography.evaluation.primitives.find(({ primitive }) =>
          primitive === "-");
        if (primitive !== undefined) {
          return Object.freeze({
            kind: "primitive",
            motif: primitive,
            sample: sampleKpSchemePrimitiveMotif(range(progress, 0.26, 0.58)),
            settlement: sampleKpSchemeFactorialSettlement({
              motif: "primitive",
              transitionId: input.timeline.intervalId,
              materialIds: [primitive.applicationExpressionId, primitive.resultValueId],
              progress: range(progress, 0.26, 0.58)
            })
          });
        }
      }
      return progress < 0.76
        ? structural(input.choreography, 1, range(progress, 0.58, 0.76))
        : binding(input.choreography, 1, range(progress, 0.76, 1));
    case "repeated-descent":
      const summaryProgress = progress;
      return Object.freeze({
        kind: "summary",
        sample: sampleKpSchemeSummaryMotif(
          input.choreography.evaluation.summary,
          summaryProgress
        ),
        settlement: sampleKpSchemeFactorialSettlement({
          motif: "summary",
          transitionId: input.timeline.intervalId,
          materialIds: input.choreography.evaluation.summary.eventIds,
          progress: summaryProgress
        })
      });
    case "base-case":
      return branch(
        input.choreography,
        input.choreography.evaluation.branches.length - 1,
        progress
      );
    case "return-cascade":
      return Object.freeze({
        kind: "return",
        sample: sampleKpSchemeFactorialReturn(
          input.choreography.returns,
          progress
        ),
        settlement: sampleKpSchemeFactorialSettlement({
          motif: "return",
          transitionId: input.timeline.intervalId,
          materialIds: [
            input.choreography.returns.carrierId,
            ...input.choreography.returns.steps.map(({ outgoingValueId }) =>
              outgoingValueId)
          ],
          progress
        })
      });
    case "result":
      return Object.freeze({ kind: "none" });
  }
}

function structural(
  choreography: KpSchemeFactorialChoreography,
  index: number,
  progress: number
): KpSchemeFactorialMotionProjection {
  const transition = choreography.structural.transitions[index];
  if (transition === undefined) throw new Error(`Missing structural motion ${index}.`);
  return Object.freeze({
    kind: "structural",
    transition,
    sample: sampleKpSchemeStructuralTransition(transition, progress),
    settlement: sampleKpSchemeFactorialSettlement({
      motif: "structural",
      transitionId: transition.id,
      materialIds: [
        ...transition.expressionMotions.map(({ expressionId }) => expressionId),
        ...transition.waitingShells.map(({ materialId }) => materialId)
      ],
      progress
    })
  });
}

function binding(
  choreography: KpSchemeFactorialChoreography,
  index: number,
  progress: number
): KpSchemeFactorialMotionProjection {
  const arc = choreography.binding.arcs[index];
  if (arc === undefined) throw new Error(`Missing binding motion ${index}.`);
  const sample = sampleKpSchemeBindingMotion(progress);
  return Object.freeze({
    kind: "binding",
    arc,
    sample,
    point: pointOnKpSchemeBindingArc(arc, sample.arcProgress),
    settlement: sampleKpSchemeFactorialSettlement({
      motif: "binding",
      transitionId: arc.id,
      materialIds: [arc.argumentExpressionId, arc.parameterOccurrenceId],
      progress
    })
  });
}

function branch(
  choreography: KpSchemeFactorialChoreography,
  index: number,
  progress: number
): KpSchemeFactorialMotionProjection {
  const motif = choreography.evaluation.branches[index];
  if (motif === undefined) throw new Error(`Missing branch motif ${index}.`);
  return Object.freeze({
    kind: "branch",
    motif,
    sample: sampleKpSchemeBranchMotif(progress),
    settlement: sampleKpSchemeFactorialSettlement({
      motif: "branch",
      transitionId: motif.id,
      materialIds: [motif.selectedExpressionId, motif.dormantExpressionId],
      progress,
      semanticDeletion: {
        operationId: motif.eventId,
        materialIds: [motif.dormantExpressionId]
      }
    })
  });
}

function range(value: number, start: number, end: number): number {
  return Math.max(0, Math.min(1, (value - start) / (end - start)));
}
