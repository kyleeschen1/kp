import {
  activeKpChoreographyPhase,
  createKpChoreographyPlan,
  validateKpChoreographyPlan,
  type KpChoreographyActivity,
  type KpChoreographyCheckpoint,
  type KpChoreographyPlan
} from "./choreography-plan.ts";
import {
  kpCanonicalLogExponentContinuity,
  type KpLogExponentContinuityPlan
} from "./log-exponent-continuity.ts";
import {
  kpCanonicalLogExponentInterpolationProgram,
  type KpCompiledLogExponentInterpolationProgram,
  type KpLogExponentInterpolationObligation
} from "./log-exponent-interpolation-obligations.ts";
import {
  kpCanonicalLogExponentSalience,
  type KpLogExponentSaliencePlan
} from "./log-exponent-salience.ts";

export interface KpLogExponentObligationBinding {
  readonly activityId: string;
  readonly obligationIds: readonly string[];
}

export interface KpLogExponentChoreography {
  readonly operationId: string;
  readonly plan: KpChoreographyPlan;
  readonly continuity: KpLogExponentContinuityPlan;
  readonly salience: KpLogExponentSaliencePlan;
  readonly obligationBindings: readonly KpLogExponentObligationBinding[];
}

export function compileKpLogExponentChoreography(input: {
  readonly continuity?: readonly KpLogExponentContinuityPlan[] | undefined;
  readonly salience?: readonly KpLogExponentSaliencePlan[] | undefined;
  readonly interpolation?: KpCompiledLogExponentInterpolationProgram | undefined;
} = {}): readonly KpLogExponentChoreography[] {
  const continuity = input.continuity ?? kpCanonicalLogExponentContinuity;
  const salience = input.salience ?? kpCanonicalLogExponentSalience;
  const interpolation = input.interpolation ??
    kpCanonicalLogExponentInterpolationProgram;
  return Object.freeze(continuity.map((continuityPlan) => {
    const operationId = continuityPlan.operationId;
    const saliencePlan = salience.find((plan) => plan.operationId === operationId);
    const obligations = interpolation.obligations.filter(
      (obligation) => obligation.operationId === operationId
    );
    if (saliencePlan === undefined || obligations.length === 0) {
      throw new Error(`Choreography compilation lacks salience or interpolation for ${operationId}.`);
    }
    const ids = idsFor(operationId);
    const transferObligations = obligations.filter(
      ({ kind }) => kind === "measured-continuant-transfer"
    );
    const structuralObligations = obligations.filter(
      ({ kind }) => kind !== "measured-continuant-transfer"
    );
    const orientEntities = focusedEntities(saliencePlan, "orient");
    const settleEntities = focusedEntities(saliencePlan, "settle");
    const targetEntities = continuityPlan.lineage.targetEntityIds;
    const transferEntities = obligationEntities(transferObligations);
    const structuralEntities = obligationEntities(structuralObligations);
    const activities: readonly KpChoreographyActivity[] = Object.freeze([
      activity(ids.focus, "orient", "focus", orientEntities, continuityPlan, [], []),
      activity(ids.reserve, "reflow", "reserve-space", targetEntities, continuityPlan, [ids.focus], [ids.focusReady]),
      activity(ids.transfer, "act", "move-continuant", transferEntities, continuityPlan, [ids.reserve], [ids.spaceReserved]),
      Object.freeze({
        ...activity(ids.execute, "act", "execute-operation", structuralEntities, continuityPlan, [ids.reserve], [ids.spaceReserved]),
        governedOverlap: Object.freeze({
          withActivityId: ids.transfer,
          reason: "Structural change may begin only while compiled continuants retain explicit ownership."
        })
      }),
      activity(ids.recognize, "settle", "recognition-hold", settleEntities, continuityPlan, [ids.transfer, ids.execute], [ids.operationComplete]),
      activity(ids.release, "release", "release-attention", targetEntities, continuityPlan, [ids.recognize], [ids.recognition])
    ]);
    const checkpoints: readonly KpChoreographyCheckpoint[] = Object.freeze([
      checkpoint(ids.focusReady, "orient", "focus-ready", "The operation's source relationship is perceptually available."),
      checkpoint(ids.spaceReserved, "reflow", "space-reserved", "Native target layout has been measured without changing semantic ownership."),
      checkpoint(ids.operationComplete, "act", "phase-complete", "Every interpolation obligation reached its semantic terminal condition."),
      checkpoint(ids.recognition, "settle", "recognition", "The target equation is stable long enough to recognize the law."),
      checkpoint(ids.neutral, "release", "neutral", "Attention returns to the complete native target equation.")
    ]);
    const plan = createKpChoreographyPlan({
      id: `choreography.${operationId}`,
      timelineRefId: `timeline.${operationId}`,
      vocabulary: continuityPlan.vocabulary,
      phases: [
        activeKpChoreographyPhase({ id: "orient", activityIds: [ids.focus], completionCheckpointId: ids.focusReady }),
        activeKpChoreographyPhase({ id: "reflow", activityIds: [ids.reserve], dependsOnPhaseIds: ["orient"], prerequisiteCheckpointIds: [ids.focusReady], completionCheckpointId: ids.spaceReserved }),
        activeKpChoreographyPhase({ id: "act", activityIds: [ids.transfer, ids.execute], dependsOnPhaseIds: ["reflow"], prerequisiteCheckpointIds: [ids.spaceReserved], completionCheckpointId: ids.operationComplete }),
        activeKpChoreographyPhase({ id: "settle", activityIds: [ids.recognize], dependsOnPhaseIds: ["act"], prerequisiteCheckpointIds: [ids.operationComplete], completionCheckpointId: ids.recognition }),
        activeKpChoreographyPhase({ id: "release", activityIds: [ids.release], dependsOnPhaseIds: ["settle"], prerequisiteCheckpointIds: [ids.recognition], completionCheckpointId: ids.neutral })
      ],
      activities,
      checkpoints
    });
    const issues = validateKpChoreographyPlan(plan);
    if (issues.length > 0) throw new Error(issues[0]!.message);
    const obligationBindings = Object.freeze([
      Object.freeze({
        activityId: ids.transfer,
        obligationIds: Object.freeze(transferObligations.map(({ id }) => id))
      }),
      Object.freeze({
        activityId: ids.execute,
        obligationIds: Object.freeze(structuralObligations.map(({ id }) => id))
      })
    ]);
    assertObligationsBoundOnce(obligations, obligationBindings);
    return Object.freeze({
      operationId,
      plan,
      continuity: continuityPlan,
      salience: saliencePlan,
      obligationBindings
    });
  }));
}

export const kpCanonicalLogExponentChoreography =
  compileKpLogExponentChoreography();

function idsFor(operationId: string) {
  const prefix = `activity.${operationId}`;
  const checkpointPrefix = `checkpoint.${operationId}`;
  return Object.freeze({
    focus: `${prefix}.focus`,
    reserve: `${prefix}.reserve`,
    transfer: `${prefix}.transfer`,
    execute: `${prefix}.execute`,
    recognize: `${prefix}.recognize`,
    release: `${prefix}.release`,
    focusReady: `${checkpointPrefix}.focus-ready`,
    spaceReserved: `${checkpointPrefix}.space-reserved`,
    operationComplete: `${checkpointPrefix}.operation-complete`,
    recognition: `${checkpointPrefix}.recognition`,
    neutral: `${checkpointPrefix}.neutral`
  });
}

function activity(
  id: string,
  phaseId: KpChoreographyActivity["phaseId"],
  kind: KpChoreographyActivity["kind"],
  entityIds: readonly string[],
  continuity: KpLogExponentContinuityPlan,
  dependsOnActivityIds: readonly string[],
  prerequisiteCheckpointIds: readonly string[]
): KpChoreographyActivity {
  return Object.freeze({
    id,
    phaseId,
    kind,
    entityIds: Object.freeze([...new Set(entityIds)]),
    summary: `${kind} for ${continuity.operationId}.`,
    motionClassificationIds: Object.freeze(
      continuity.vocabulary.motionClassifications
        .filter((classification) => classification.entityIds.some((entityId) =>
          entityIds.includes(entityId)
        ))
        .map(({ id }) => id)
    ),
    dependsOnActivityIds: Object.freeze([...dependsOnActivityIds]),
    prerequisiteCheckpointIds: Object.freeze([...prerequisiteCheckpointIds])
  });
}

function checkpoint(
  id: string,
  phaseId: KpChoreographyCheckpoint["phaseId"],
  kind: KpChoreographyCheckpoint["kind"],
  requirement: string
): KpChoreographyCheckpoint {
  return Object.freeze({ id, phaseId, kind, requirement, stable: true });
}

function focusedEntities(
  salience: KpLogExponentSaliencePlan,
  phase: "orient" | "settle"
): readonly string[] {
  return salience.stages
    .find((stage) => stage.phase === phase)!
    .assignments
    .filter(({ state }) => state.level === "focus")
    .map(({ entityId }) => entityId);
}

function obligationEntities(
  obligations: readonly KpLogExponentInterpolationObligation[]
): readonly string[] {
  return [...new Set(obligations.flatMap((obligation) => [
    ...obligation.sourceEntityIds,
    ...obligation.targetEntityIds
  ]))];
}

function assertObligationsBoundOnce(
  obligations: readonly KpLogExponentInterpolationObligation[],
  bindings: readonly KpLogExponentObligationBinding[]
): void {
  const bound = bindings.flatMap(({ obligationIds }) => obligationIds);
  if (
    bound.length !== obligations.length ||
    new Set(bound).size !== obligations.length ||
    obligations.some(({ id }) => !bound.includes(id))
  ) {
    throw new Error("Every interpolation obligation must bind to exactly one choreography activity.");
  }
}
