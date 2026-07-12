import {
  createKpBehavior,
  type KpBehavior
} from "./asset-behavior.ts";
import { findKpAssetSelector } from "./asset.ts";
import {
  createKpEquationFrameInterpreter,
  type KpEquationFrame,
  type KpEquationFrameInterpreter,
  type KpEquationFrameSelectorRef
} from "./equation-frame-interpreter.ts";
import type { LinearSolveKpAsset } from "./linear-solve-asset.ts";
import type {
  KpInterpreterDiagnostic,
  KpInterpreterResultInput
} from "./asset-interpreter.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";

export interface LinearSolveEquationFrameInterpreterInput {
  readonly asset: LinearSolveKpAsset;
  readonly progress: number;
}

export type LinearSolveEquationFrameBehavior = KpBehavior<KpEquationFrame>;

interface ActiveLinearSolveTransformation {
  readonly transformation: KpSemanticTransformation;
  readonly index: number;
  readonly globalProgress: number;
  readonly localProgress: number;
}

export function createLinearSolveEquationFrameInterpreter():
  KpEquationFrameInterpreter<LinearSolveEquationFrameInterpreterInput> {
  return createKpEquationFrameInterpreter({
    id: "interpreter.linear-solve.katex-equation-frame",
    inputKind: "linear-solve-asset",
    preservation: "sampled",
    interpret: interpretLinearSolveEquationFrame
  });
}

export function createLinearSolveEquationFrameBehavior(
  asset: LinearSolveKpAsset
): LinearSolveEquationFrameBehavior {
  const interpreter = createLinearSolveEquationFrameInterpreter();
  const behaviorId = "behavior.linear-solve.katex-equation-frame";

  return createKpBehavior({
    id: behaviorId,
    durationMs: Math.max(1, asset.transformations.length) * 1000,
    sample: ({ timeMs, progress }) => {
      const frame = interpreter.interpret({
        asset,
        progress
      }).output;

      return {
        ...frame,
        inspection: {
          behaviorId,
          timeMs,
          progress: frame.progress,
          phaseId: frame.activeTransformationIds[0],
          activeTransformationIds: frame.activeTransformationIds,
          activeSelectorIds: frame.selectorRefs.map((ref) => ref.selectorId)
        }
      };
    }
  });
}

function interpretLinearSolveEquationFrame(
  input: LinearSolveEquationFrameInterpreterInput
): KpInterpreterResultInput<KpEquationFrame> {
  const active = selectActiveTransformation(input.asset, input.progress);
  const diagnostics: KpInterpreterDiagnostic[] = [];
  const selectorRefs = active.transformation.correspondence.flatMap(
    (correspondence) =>
      [
        selectorRef(input.asset, correspondence.sourceSelectorId, diagnostics),
        selectorRef(input.asset, correspondence.targetSelectorId, diagnostics)
      ].filter((ref): ref is KpEquationFrameSelectorRef => ref !== undefined)
  );

  return {
    preservation: diagnostics.length === 0 ? "sampled" : "lossy",
    output: {
      id: `frame.linear-solve.katex.${String(active.index).padStart(4, "0")}`,
      assetId: input.asset.bundle.id,
      progress: active.globalProgress,
      surface: "katex-dom",
      activeTransformationIds: [active.transformation.id],
      objectRefs: [
        ...active.transformation.sourceObjectIds.map((objectId) => ({
          objectId,
          role: "source" as const
        })),
        ...active.transformation.targetObjectIds.map((objectId) => ({
          objectId,
          role: "target" as const
        }))
      ],
      transformationRefs: [
        {
          transformationId: active.transformation.id,
          sourceObjectIds: active.transformation.sourceObjectIds,
          targetObjectIds: active.transformation.targetObjectIds,
          progress: active.localProgress
        }
      ],
      selectorRefs,
      selectorCorrespondenceRefs: active.transformation.correspondence.map(
        (correspondence) => ({
          sourceSelectorId: correspondence.sourceSelectorId,
          targetSelectorId: correspondence.targetSelectorId,
          preserves: correspondence.preserves
        })
      ),
      drillDownIds: input.asset.drillDownHooks
        .filter((hook) => hook.transformationId === active.transformation.id)
        .map((hook) => hook.id),
      flashcardIds: input.asset.flashcards
        .filter((card) =>
          card.transformationIds?.includes(active.transformation.id) ?? false
        )
        .map((card) => card.id),
      diagnostics
    },
    diagnostics
  };
}

function selectActiveTransformation(
  asset: LinearSolveKpAsset,
  progress: number
): ActiveLinearSolveTransformation {
  const globalProgress = clampProgress(progress);
  const count = asset.transformations.length;

  if (count === 0) {
    throw new Error(`Asset ${asset.bundle.id} has no transformations to sample.`);
  }

  const scaled = globalProgress * count;
  const index = globalProgress >= 1 ? count - 1 : Math.floor(scaled);
  const transformation = asset.transformations[index];

  if (transformation === undefined) {
    throw new Error(
      `Asset ${asset.bundle.id} has no transformation at index ${index}.`
    );
  }

  return {
    transformation,
    index,
    globalProgress,
    localProgress: globalProgress >= 1 ? 1 : scaled - index
  };
}

function selectorRef(
  asset: LinearSolveKpAsset,
  selectorId: string,
  diagnostics: KpInterpreterDiagnostic[]
): KpEquationFrameSelectorRef | undefined {
  const selector = findKpAssetSelector(asset.bundle, selectorId);

  if (selector === undefined) {
    diagnostics.push({
      severity: "error",
      code: "selector-correspondence-missing",
      message: `Linear-solve frame could not resolve selector ${selectorId}.`,
      lossKind: "selector-correspondence",
      path: `selectors.${selectorId}`
    });
    return undefined;
  }

  return {
    selectorId: selector.id,
    objectId: selector.objectId,
    role: "persistent"
  };
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  if (progress < 0) return 0;
  if (progress > 1) return 1;
  return progress;
}
