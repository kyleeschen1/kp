import {
  sampleKpPythonRefactorScore,
  type KpPythonRefactorScoreSample,
  type KpPythonRefactorScoreV1
} from "../semantic/python-refactor-score.ts";
import {
  kpPythonRefactorSourceProjectionIds,
  type KpPythonRefactorSourceProjectionId
} from "../semantic/python-refactor-source-projections.ts";
import {
  mintKpCodeSettlementPlan,
  sampleKpCodeSettlement
} from "./code-motion-settlement.ts";

export interface KpPythonRefactorProjectionFrame {
  readonly id: KpPythonRefactorSourceProjectionId;
  readonly opacity: number;
  readonly scale: number;
}

export interface KpPythonRefactorMotionFrame {
  readonly progress: number;
  readonly stage: KpPythonRefactorScoreSample;
  readonly projections: readonly KpPythonRefactorProjectionFrame[];
  readonly focusStrength: number;
  readonly accessibleProjectionId: KpPythonRefactorSourceProjectionId;
  readonly reducedMotion: boolean;
}

const nativeOwnershipPlans = new Map([
  nativeOwnershipPlan("projection.python.before", "projection.python.helper-introduced"),
  nativeOwnershipPlan("projection.python.helper-introduced", "projection.python.cost-replaced"),
  nativeOwnershipPlan("projection.python.cost-replaced", "projection.python.final")
].map((plan) => [`${plan.sourceNativeOwnerId}\u0000${plan.targetNativeOwnerId}`, plan]));

export function sampleKpPythonRefactorMotionFrame(input: {
  readonly score: KpPythonRefactorScoreV1;
  readonly progress: number;
  readonly reducedMotion?: boolean;
}): KpPythonRefactorMotionFrame {
  const progress = clamp(input.progress, 0, 1);
  const timeMs = progress * input.score.durationMs;
  const stage = sampleKpPythonRefactorScore(input.score, timeMs);
  const handoff = projectionHandoff(input.score, timeMs, input.reducedMotion === true);
  const currentStage = input.score.stages.find(({ id }) => id === stage.stageId);
  if (currentStage === undefined) throw new Error(`Missing Python stage ${stage.stageId}.`);
  const focusStrength = input.reducedMotion === true
    ? 1
    : Math.min(
      smoothstep(normalize(timeMs, currentStage.startMs, currentStage.checkpointMs)),
      currentStage.checkpointMs === currentStage.endMs
        ? 1
        : smoothstep(normalize(
          currentStage.endMs - timeMs,
          0,
          currentStage.endMs - currentStage.checkpointMs
        ))
    );
  return Object.freeze({
    progress,
    stage,
    projections: Object.freeze(kpPythonRefactorSourceProjectionIds.map((id) => {
      const incoming = id === handoff.to ? handoff.progress : 0;
      const outgoing = id === handoff.from ? 1 - handoff.progress : 0;
      const opacity = handoff.from === handoff.to && id === handoff.from
        ? 1
        : incoming + outgoing;
      return Object.freeze({
        id,
        opacity: round(opacity),
        scale: round(0.988 + 0.012 * opacity)
      });
    })),
    focusStrength: round(focusStrength),
    accessibleProjectionId: accessibleNativeOwner(handoff),
    reducedMotion: input.reducedMotion === true
  });
}

function accessibleNativeOwner(handoff: {
  readonly from: KpPythonRefactorSourceProjectionId;
  readonly to: KpPythonRefactorSourceProjectionId;
  readonly progress: number;
}): KpPythonRefactorSourceProjectionId {
  if (handoff.from === handoff.to) return handoff.from;
  const plan = nativeOwnershipPlans.get(`${handoff.from}\u0000${handoff.to}`);
  if (plan === undefined) {
    throw new Error(`Missing Python native ownership plan ${handoff.from} -> ${handoff.to}.`);
  }
  return sampleKpCodeSettlement({ plan, progress: handoff.progress })
    .accessibleNativeOwnerId;
}

function nativeOwnershipPlan(
  from: KpPythonRefactorSourceProjectionId,
  to: KpPythonRefactorSourceProjectionId
) {
  return mintKpCodeSettlementPlan({
    id: `settlement.python.native.${from}.${to}`,
    sourcePaintOwnerId: `paint.python.native.${from}`,
    targetPaintOwnerId: `paint.python.native.${to}`,
    sourceNativeOwnerId: from,
    targetNativeOwnerId: to,
    milestones: {
      travel: 0,
      arrival: 0.35,
      recognition: 0.45,
      ownershipHandoff: 0.5,
      withdrawal: 1
    }
  });
}

function projectionHandoff(
  score: KpPythonRefactorScoreV1,
  timeMs: number,
  reducedMotion: boolean
): {
  readonly from: KpPythonRefactorSourceProjectionId;
  readonly to: KpPythonRefactorSourceProjectionId;
  readonly progress: number;
} {
  const transitions = [
    transition(score, "stage.introduce-helper", "projection.python.before", "projection.python.helper-introduced"),
    transition(score, "stage.replace-cost-call", "projection.python.helper-introduced", "projection.python.cost-replaced"),
    transition(score, "stage.replace-message-call", "projection.python.cost-replaced", "projection.python.final")
  ] as const;
  let settled: KpPythonRefactorSourceProjectionId = "projection.python.before";
  for (const entry of transitions) {
    if (timeMs < entry.startMs) return { from: settled, to: settled, progress: 1 };
    if (timeMs <= entry.checkpointMs) {
      const raw = reducedMotion
        ? timeMs < entry.checkpointMs ? 0 : 1
        : smoothstep(normalize(timeMs, entry.startMs, entry.checkpointMs));
      return { from: entry.from, to: entry.to, progress: raw };
    }
    settled = entry.to;
  }
  return { from: settled, to: settled, progress: 1 };
}

function transition(
  score: KpPythonRefactorScoreV1,
  stageId: string,
  from: KpPythonRefactorSourceProjectionId,
  to: KpPythonRefactorSourceProjectionId
) {
  const stage = score.stages.find(({ id }) => id === stageId);
  if (stage === undefined) throw new Error(`Missing Python transition stage ${stageId}.`);
  return { from, to, startMs: stage.startMs, checkpointMs: stage.checkpointMs };
}

function normalize(value: number, start: number, end: number): number {
  return end === start ? 1 : clamp((value - start) / (end - start), 0, 1);
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
