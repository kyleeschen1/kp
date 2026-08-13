import {
  sampleKpTypeScriptRefactorScore,
  type KpTypeScriptRefactorScoreSample,
  type KpTypeScriptRefactorScoreV1
} from "../semantic/typescript-refactor-score.ts";
import {
  kpTypeScriptRefactorSourceProjectionIds,
  type KpTypeScriptRefactorSourceProjectionId
} from "../semantic/typescript-refactor-source-projections.ts";
import {
  mintKpCodeSettlementPlan,
  sampleKpCodeSettlement
} from "./code-motion-settlement.ts";

export interface KpTypeScriptRefactorProjectionFrame {
  readonly id: KpTypeScriptRefactorSourceProjectionId;
  readonly opacity: number;
  readonly scale: number;
}

export interface KpTypeScriptRefactorMotionFrame {
  readonly progress: number;
  readonly stage: KpTypeScriptRefactorScoreSample;
  readonly projections: readonly KpTypeScriptRefactorProjectionFrame[];
  readonly focusStrength: number;
  readonly accessibleProjectionId: KpTypeScriptRefactorSourceProjectionId;
  readonly reducedMotion: boolean;
}

const nativeOwnershipPlans = new Map([
  nativeOwnershipPlan("projection.typescript.before", "projection.typescript.helper-introduced"),
  nativeOwnershipPlan("projection.typescript.helper-introduced", "projection.typescript.cost-replaced"),
  nativeOwnershipPlan("projection.typescript.cost-replaced", "projection.typescript.final")
].map((plan) => [`${plan.sourceNativeOwnerId}\u0000${plan.targetNativeOwnerId}`, plan]));

export function sampleKpTypeScriptRefactorMotionFrame(input: {
  readonly score: KpTypeScriptRefactorScoreV1;
  readonly progress: number;
  readonly reducedMotion?: boolean | undefined;
}): KpTypeScriptRefactorMotionFrame {
  const progress = clamp(input.progress, 0, 1);
  const timeMs = progress * input.score.durationMs;
  const stage = sampleKpTypeScriptRefactorScore(input.score, timeMs);
  const handoff = projectionHandoff(input.score, timeMs, input.reducedMotion === true);
  const currentStage = input.score.stages.find(({ id }) => id === stage.stageId);
  if (currentStage === undefined) {
    throw new Error(`TypeScript refactor motion cannot resolve ${stage.stageId}.`);
  }
  // Focus peaks at the authored checkpoint, then yields only if another stage
  // follows. The sampled value is paint input, never a second clock.
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
    projections: Object.freeze(kpTypeScriptRefactorSourceProjectionIds.map((id) => {
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
  readonly from: KpTypeScriptRefactorSourceProjectionId;
  readonly to: KpTypeScriptRefactorSourceProjectionId;
  readonly progress: number;
}): KpTypeScriptRefactorSourceProjectionId {
  if (handoff.from === handoff.to) return handoff.from;
  const plan = nativeOwnershipPlans.get(`${handoff.from}\u0000${handoff.to}`);
  if (plan === undefined) {
    throw new Error(`Missing TypeScript native ownership plan ${handoff.from} -> ${handoff.to}.`);
  }
  return sampleKpCodeSettlement({ plan, progress: handoff.progress })
    .accessibleNativeOwnerId;
}

function nativeOwnershipPlan(
  from: KpTypeScriptRefactorSourceProjectionId,
  to: KpTypeScriptRefactorSourceProjectionId
) {
  return mintKpCodeSettlementPlan({
    id: `settlement.typescript.native.${from}.${to}`,
    sourcePaintOwnerId: `paint.typescript.native.${from}`,
    transitPaintOwnerId: `paint.typescript.native-handoff.${from}.${to}`,
    targetPaintOwnerId: `paint.typescript.native.${to}`,
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
  score: KpTypeScriptRefactorScoreV1,
  timeMs: number,
  reducedMotion: boolean
): {
  readonly from: KpTypeScriptRefactorSourceProjectionId;
  readonly to: KpTypeScriptRefactorSourceProjectionId;
  readonly progress: number;
} {
  const transitions = [
    transition(score, "stage.introduce-helper", "projection.typescript.before", "projection.typescript.helper-introduced"),
    transition(score, "stage.replace-cost-call", "projection.typescript.helper-introduced", "projection.typescript.cost-replaced"),
    transition(score, "stage.replace-message-call", "projection.typescript.cost-replaced", "projection.typescript.final")
  ] as const;
  let settled: KpTypeScriptRefactorSourceProjectionId = "projection.typescript.before";
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
  score: KpTypeScriptRefactorScoreV1,
  stageId: string,
  from: KpTypeScriptRefactorSourceProjectionId,
  to: KpTypeScriptRefactorSourceProjectionId
): {
  readonly from: KpTypeScriptRefactorSourceProjectionId;
  readonly to: KpTypeScriptRefactorSourceProjectionId;
  readonly startMs: number;
  readonly checkpointMs: number;
} {
  const stage = score.stages.find(({ id }) => id === stageId);
  if (stage === undefined) throw new Error(`Missing TypeScript transition stage ${stageId}.`);
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
