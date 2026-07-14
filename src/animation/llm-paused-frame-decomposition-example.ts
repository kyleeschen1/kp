import {
  createKpAnimationDecompositionAuthoringRequest,
  type KpAnimationDecompositionAuthoringRequest
} from "./llm-decomposition-authoring.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "./runtime-sampler.ts";

export interface LlmPausedFrameDecompositionExample {
  readonly id: string;
  readonly kind: "llm-paused-frame-decomposition-example";
  readonly animationId: string;
  readonly pausedFrameId: string;
  readonly progress: number;
  readonly request: KpAnimationDecompositionAuthoringRequest;
  readonly drillDownBlueprint: LlmPausedFrameDrillDownBlueprint;
  readonly searchFields: readonly string[];
}

export interface LlmPausedFrameDrillDownBlueprint {
  readonly animationId: string;
  readonly title: string;
  readonly sourceTransformationId: string;
  readonly requiredSelectorIds: readonly string[];
  readonly suggestedTransformTypes: readonly string[];
}

const selectedCancellationTransformationId =
  "transform.linear-solve.cancel-left-additive-inverse";

export function createLinearSolvePausedFrameDecompositionExample():
  LlmPausedFrameDecompositionExample {
  const animation = createLinearSolveAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.paused-cancel",
    animation,
    progress: 0.5
  });
  const request = createKpAnimationDecompositionAuthoringRequest({
    animation,
    frame,
    selectedTransformationId: selectedCancellationTransformationId,
    question: "Why do the +3 and -3 disappear?"
  });
  const drillDownBlueprint: LlmPausedFrameDrillDownBlueprint = {
    animationId:
      "animation.drilldown.linear-solve.cancel-left-additive-inverse",
    title: "Drill down into additive inverse cancellation",
    sourceTransformationId: selectedCancellationTransformationId,
    requiredSelectorIds: [...request.focusSelectorIds],
    suggestedTransformTypes: [
      "focusSelectors",
      "pairAdditiveInverses",
      "vanishToZero",
      "restoreParentFrame"
    ]
  };

  return {
    id:
      "llm-decomposition-example.animation.linear-solve.solve-x.cancel-additive-inverse",
    kind: "llm-paused-frame-decomposition-example",
    animationId: animation.id,
    pausedFrameId: frame.id,
    progress: frame.clock.progress,
    request,
    drillDownBlueprint,
    searchFields: searchFields(request, drillDownBlueprint)
  };
}

function searchFields(
  request: KpAnimationDecompositionAuthoringRequest,
  blueprint: LlmPausedFrameDrillDownBlueprint
): readonly string[] {
  return [
    "llm-paused-frame-decomposition",
    "llm-authoring",
    request.animationId,
    request.frameId,
    `selected-transformation:${request.selectedTransformationId}`,
    ...(request.selectedTransformationKind === undefined
      ? []
      : [`selected-kind:${request.selectedTransformationKind}`]),
    ...request.sourceObjectIds,
    ...request.targetObjectIds,
    ...request.focusSelectorIds,
    ...request.promptFacts,
    blueprint.animationId,
    blueprint.sourceTransformationId,
    ...blueprint.requiredSelectorIds,
    ...blueprint.suggestedTransformTypes.map((kind) => `drilldown-step:${kind}`)
  ];
}
