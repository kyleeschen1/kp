import {
  createKpTimelineSpec,
  sampleKpTimeline,
  validateKpTimelineSpec,
  type KpTimelineSpec
} from "./asset-timeline.ts";
import {
  kpTypeScriptFreeShippingRefactorContract,
  type KpTypeScriptRefactorStageContract
} from "./typescript-free-shipping-refactor-contract.ts";
import { kpTypeScriptRefactorSelectorId } from "./typescript-refactor-operations.ts";

export interface KpTypeScriptRefactorScoreStage {
  readonly id: string;
  readonly operation: KpTypeScriptRefactorStageContract["operation"];
  readonly checkpointMs: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly narration: string;
  readonly focusSelectorIds: readonly string[];
  readonly transformationIds: readonly string[];
}

export interface KpTypeScriptRefactorScoreV1 {
  readonly schemaVersion: "kp.typescript-refactor-score.v1";
  readonly id: "score.typescript.free-shipping-threshold";
  readonly durationMs: 14000;
  readonly timeline: KpTimelineSpec;
  readonly stages: readonly KpTypeScriptRefactorScoreStage[];
}

export interface KpTypeScriptRefactorScoreSample {
  readonly timeMs: number;
  readonly progress: number;
  readonly stageId: string;
  readonly narration: string;
  readonly focusSelectorIds: readonly string[];
  readonly transformationIds: readonly string[];
}

const durationMs = 14000 as const;

export function createKpTypeScriptRefactorScore(): KpTypeScriptRefactorScoreV1 {
  const contractStages = kpTypeScriptFreeShippingRefactorContract.stages;
  const checkpoints = contractStages.map(({ progress }) => progress * durationMs);
  const stages = contractStages.map((stage, index) => {
    const startMs = index === 0
      ? 0
      : midpoint(checkpoints[index - 1]!, checkpoints[index]!);
    const endMs = index === contractStages.length - 1
      ? durationMs
      : midpoint(checkpoints[index]!, checkpoints[index + 1]!);
    return Object.freeze({
      id: stage.id,
      operation: stage.operation,
      checkpointMs: checkpoints[index]!,
      startMs,
      endMs,
      narration: stage.narration,
      focusSelectorIds: Object.freeze(stage.focusEntityIds.map(kpTypeScriptRefactorSelectorId)),
      transformationIds: Object.freeze(transformationIds(stage.id))
    });
  });
  const timeline = createKpTimelineSpec({
    id: "timeline.typescript.free-shipping-threshold",
    durationMs,
    beats: stages.map((stage) => ({
      id: `beat.${stage.id}`,
      label: stage.narration,
      startMs: stage.startMs,
      durationMs: stage.endMs - stage.startMs,
      selectorIds: stage.focusSelectorIds,
      transformationIds: stage.transformationIds
    })),
    events: stages.map((stage) => ({
      id: `event.${stage.id}`,
      kind: "checkpoint",
      timeMs: stage.checkpointMs,
      label: stage.narration,
      selectorIds: stage.focusSelectorIds
    }))
  });
  const issues = validateKpTimelineSpec(timeline);
  if (issues.length > 0) throw new Error(issues[0]!.message);

  return Object.freeze({
    schemaVersion: "kp.typescript-refactor-score.v1",
    id: "score.typescript.free-shipping-threshold",
    durationMs,
    timeline,
    stages: Object.freeze(stages)
  });
}

export function sampleKpTypeScriptRefactorScore(
  score: KpTypeScriptRefactorScoreV1,
  timeMs: number
): KpTypeScriptRefactorScoreSample {
  const sample = sampleKpTimeline(score.timeline, timeMs);
  const activeBeatId = sample.activeBeatIds[0];
  const stage = score.stages.find(({ id }) => `beat.${id}` === activeBeatId);
  if (stage === undefined) {
    throw new Error(`TypeScript refactor score has no active stage at ${sample.timeMs}ms.`);
  }
  return Object.freeze({
    timeMs: sample.timeMs,
    progress: sample.progress,
    stageId: stage.id,
    narration: stage.narration,
    focusSelectorIds: stage.focusSelectorIds,
    transformationIds: stage.transformationIds
  });
}

function midpoint(left: number, right: number): number {
  return left + (right - left) / 2;
}

function transformationIds(stageId: string): readonly string[] {
  if (stageId === "stage.introduce-helper" || stageId === "stage.move-shared-rule") {
    return ["transform.typescript.extract-shared-rule"];
  }
  if (stageId === "stage.replace-cost-call") {
    return ["transform.typescript.replace-cost-call"];
  }
  if (stageId === "stage.replace-message-call") {
    return ["transform.typescript.replace-message-call"];
  }
  if (stageId === "stage.verify-parity") {
    return ["transform.typescript.recompose-program"];
  }
  return [];
}
