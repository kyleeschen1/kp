import type {
  KpAnimationAsset
} from "./asset.ts";
import type {
  KpAnimationRuntimeClock,
  KpAnimationRuntimeDiagnostic,
  KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";

export interface CreateKpAnimationDecompositionAuthoringRequestInput {
  readonly animation: KpAnimationAsset;
  readonly frame: KpAnimationRuntimeFrame;
  readonly selectedTransformationId: string;
  readonly question?: string | undefined;
}

export interface KpAnimationDecompositionAuthoringRequest {
  readonly id: string;
  readonly kind: "animation-decomposition-authoring-request";
  readonly animationId: string;
  readonly frameId: string;
  readonly clock: KpAnimationRuntimeClock;
  readonly selectedTransformationId: string;
  readonly selectedTransformationKind?: string | undefined;
  readonly question?: string | undefined;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly focusSelectorIds: readonly string[];
  readonly activeTransformationIds: readonly string[];
  readonly promptFacts: readonly string[];
  readonly diagnostics: readonly KpAnimationRuntimeDiagnostic[];
}

export function createKpAnimationDecompositionAuthoringRequest(
  input: CreateKpAnimationDecompositionAuthoringRequestInput
): KpAnimationDecompositionAuthoringRequest {
  const selectedTransformation = input.animation.transformations.find(
    (transformation) => transformation.id === input.selectedTransformationId
  );
  const diagnostics: KpAnimationRuntimeDiagnostic[] = [];

  if (selectedTransformation === undefined) {
    diagnostics.push({
      severity: "error",
      code: "decomposition.transformation-missing",
      path: "selectedTransformationId",
      message:
        `Animation ${input.animation.id} does not contain selected transformation ${input.selectedTransformationId}.`
    });
  }

  return {
    id: `decomposition.${input.animation.id}.${input.selectedTransformationId}`,
    kind: "animation-decomposition-authoring-request",
    animationId: input.animation.id,
    frameId: input.frame.id,
    clock: { ...input.frame.clock },
    selectedTransformationId: input.selectedTransformationId,
    ...(selectedTransformation === undefined
      ? {}
      : { selectedTransformationKind: selectedTransformation.transformType }),
    ...(input.question === undefined ? {} : { question: input.question }),
    sourceObjectIds: selectedTransformation?.sourceObjectIds ?? [],
    targetObjectIds: selectedTransformation?.targetObjectIds ?? [],
    focusSelectorIds: [...input.frame.focusSelectorIds],
    activeTransformationIds: [...input.frame.activeTransformationIds],
    promptFacts: promptFacts({
      animation: input.animation,
      frame: input.frame,
      selectedTransformationId: input.selectedTransformationId,
      selectedTransformationKind: selectedTransformation?.transformType
    }),
    diagnostics
  };
}

function promptFacts(input: {
  readonly animation: KpAnimationAsset;
  readonly frame: KpAnimationRuntimeFrame;
  readonly selectedTransformationId: string;
  readonly selectedTransformationKind?: string | undefined;
}): readonly string[] {
  return [
    `animation:${input.animation.id}`,
    `frame:${input.frame.id}`,
    `progress:${input.frame.clock.progress}`,
    `selected-transformation:${input.selectedTransformationId}`,
    ...(input.selectedTransformationKind === undefined
      ? []
      : [`selected-kind:${input.selectedTransformationKind}`]),
    ...input.frame.activeTransformationIds.map(
      (id) => `active-transformation:${id}`
    ),
    ...input.frame.focusSelectorIds.map((id) => `focus-selector:${id}`)
  ];
}

