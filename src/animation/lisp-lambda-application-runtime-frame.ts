import type {
  KpLispAnimationCheckpoint,
  KpLispLambdaApplicationAsset,
  KpLispMaterialLedgerEntry
} from "../semantic/lisp-lambda-application-asset.ts";

export type KpLispRuntimeStage =
  | "read"
  | "bind"
  | "substitute"
  | "evaluate"
  | "settle";

export type KpLispMaterialState =
  | "source"
  | "in-transit"
  | "target"
  | "exited";

export interface KpLispMaterialRuntimeState {
  readonly id: string;
  readonly reason: KpLispMaterialLedgerEntry["reason"];
  readonly state: KpLispMaterialState;
  readonly transitionProgress: number;
}

export interface KpLispLambdaApplicationRuntimeFrame {
  readonly id: string;
  readonly kind: "lisp-lambda-application-runtime-frame";
  readonly animationId: KpLispLambdaApplicationAsset["id"];
  readonly progress: number;
  readonly stage: KpLispRuntimeStage;
  readonly checkpointId: KpLispAnimationCheckpoint["id"];
  readonly bindingProgress: number;
  readonly substitutionProgress: number;
  readonly evaluationProgress: number;
  readonly activeSelectorIds: readonly string[];
  readonly material: readonly KpLispMaterialRuntimeState[];
  readonly expressions: {
    readonly application: "((lambda (x) (+ x 1)) 4)";
    readonly reconstructed: "(+ 4 1)";
    readonly result: "5";
    readonly applicationOpacity: number;
    readonly environmentOpacity: number;
    readonly reconstructedOpacity: number;
    readonly resultOpacity: number;
  };
  readonly accessibleDescription: string;
}

export function sampleKpLispLambdaApplicationRuntimeFrame(input: {
  readonly asset: KpLispLambdaApplicationAsset;
  readonly progress: number;
}): KpLispLambdaApplicationRuntimeFrame {
  const progress = clamp(input.progress);
  const bindingProgress = interval(progress, 0.18, 0.42);
  const substitutionProgress = interval(progress, 0.42, 0.74);
  const evaluationProgress = interval(progress, 0.74, 0.94);
  const stage = stageAt(progress);
  const checkpoint = checkpointAt(input.asset.checkpoints, progress);

  return Object.freeze({
    id: `lisp-lambda-frame.${progress.toFixed(4)}`,
    kind: "lisp-lambda-application-runtime-frame",
    animationId: input.asset.id,
    progress,
    stage,
    checkpointId: checkpoint.id,
    bindingProgress,
    substitutionProgress,
    evaluationProgress,
    activeSelectorIds: activeSelectors(input.asset, stage),
    material: Object.freeze(
      input.asset.materialLedger.map((entry) =>
        materialState(entry, substitutionProgress, evaluationProgress)
      )
    ),
    expressions: Object.freeze({
      application: "((lambda (x) (+ x 1)) 4)",
      reconstructed: "(+ 4 1)",
      result: "5",
      applicationOpacity: 1 - 0.72 * substitutionProgress,
      environmentOpacity: bindingProgress * (1 - substitutionProgress),
      reconstructedOpacity: substitutionProgress * (1 - evaluationProgress),
      resultOpacity: evaluationProgress
    }),
    accessibleDescription: accessibleDescription(stage)
  });
}

function materialState(
  entry: KpLispMaterialLedgerEntry,
  substitutionProgress: number,
  evaluationProgress: number
): KpLispMaterialRuntimeState {
  const transition = entry.id === "material.result"
    ? evaluationProgress
    : substitutionProgress;
  let state: KpLispMaterialState;
  if (transition <= 0) {
    state = "source";
  } else if (transition < 1) {
    state = "in-transit";
  } else if (entry.reason === "exits-after-substitution") {
    state = "exited";
  } else {
    state = "target";
  }
  return Object.freeze({
    id: entry.id,
    reason: entry.reason,
    state,
    transitionProgress: transition
  });
}

function activeSelectors(
  asset: KpLispLambdaApplicationAsset,
  stage: KpLispRuntimeStage
): readonly string[] {
  const ids = stage === "read"
    ? asset.checkpoints[0]?.focusSelectorIds
    : stage === "bind"
      ? asset.checkpoints[1]?.focusSelectorIds
      : stage === "substitute"
        ? asset.checkpoints[2]?.focusSelectorIds
        : asset.checkpoints[3]?.focusSelectorIds;
  return Object.freeze([...(ids ?? [])]);
}

function checkpointAt(
  checkpoints: readonly KpLispAnimationCheckpoint[],
  progress: number
): KpLispAnimationCheckpoint {
  const checkpoint = [...checkpoints]
    .reverse()
    .find((candidate) => progress >= candidate.progress);
  if (checkpoint === undefined) {
    throw new Error("The Lisp asset requires an initial checkpoint at progress zero.");
  }
  return checkpoint;
}

function stageAt(progress: number): KpLispRuntimeStage {
  if (progress < 0.18) return "read";
  if (progress < 0.42) return "bind";
  if (progress < 0.74) return "substitute";
  if (progress < 0.94) return "evaluate";
  return "settle";
}

function interval(progress: number, start: number, end: number): number {
  return clamp((progress - start) / (end - start));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Lisp runtime progress must be finite.");
  }
  return Math.min(1, Math.max(0, value));
}

function accessibleDescription(stage: KpLispRuntimeStage): string {
  switch (stage) {
    case "read":
      return "A lambda expression with parameter x is applied to four.";
    case "bind":
      return "The argument four is binding to the parameter x.";
    case "substitute":
      return "Four moves to the exact x reference, reconstructing plus four one.";
    case "evaluate":
      return "The reconstructed expression plus four one evaluates to five.";
    case "settle":
      return "The application has settled as the native Lisp result five.";
  }
}
