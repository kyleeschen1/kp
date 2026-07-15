import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpAnimationRuntimeFrame } from "../animation/runtime-sampler.ts";
import type { KpSemanticAssetObject } from "../semantic/asset.ts";

export interface KpEditorEquationRuntimeFrameProjection {
  readonly kind: "editor-equation-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly direction: KpAnimationRuntimeFrame["clock"]["direction"];
  readonly progress: number;
  readonly focusSelectorIds: readonly string[];
  readonly transitions: readonly KpEditorEquationTransitionProjection[];
  readonly diagnostics: readonly KpEditorEquationProjectionDiagnostic[];
}

export interface KpEditorEquationTransitionProjection {
  readonly id: string;
  readonly title: string;
  readonly transformType: string;
  readonly source: readonly KpEditorEquationObjectProjection[];
  readonly target: readonly KpEditorEquationObjectProjection[];
  readonly correspondence: readonly KpEditorEquationSelectorCorrespondenceProjection[];
}

export interface KpEditorEquationObjectProjection {
  readonly id: string;
  readonly title: string;
  readonly objectType: string;
  readonly latex: string;
  readonly selectors: readonly KpEditorEquationSelectorProjection[];
}

export interface KpEditorEquationSelectorProjection {
  readonly id: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly focused: boolean;
}

export interface KpEditorEquationSelectorCorrespondenceProjection {
  readonly sourceSelectorId: string;
  readonly targetSelectorId: string;
  readonly preserves: readonly string[];
  readonly summary?: string | undefined;
}

export interface KpEditorEquationProjectionDiagnostic {
  readonly code: "equation-frame.no-active-transition" | "equation-frame.object-without-latex";
  readonly message: string;
  readonly objectId?: string | undefined;
}

export function projectKpEditorEquationRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): KpEditorEquationRuntimeFrameProjection {
  if (input.animation.id !== input.runtimeFrame.animationId) {
    throw new Error(
      `Equation projection animation ${input.animation.id} does not match runtime frame ${input.runtimeFrame.animationId}.`
    );
  }

  const diagnostics: KpEditorEquationProjectionDiagnostic[] = [];
  const activeTransformationIds = new Set(
    input.runtimeFrame.activeTransformationIds
  );
  const transitions = input.animation.transformations
    .filter((transformation) => activeTransformationIds.has(transformation.id))
    .flatMap((transformation) => {
      const forward = input.runtimeFrame.clock.direction === "forward";
      const sourceIds = forward
        ? transformation.sourceObjectIds
        : transformation.targetObjectIds;
      const targetIds = forward
        ? transformation.targetObjectIds
        : transformation.sourceObjectIds;
      const source = projectEquationObjects(
        input.animation.bundle.objects,
        sourceIds,
        input.runtimeFrame.focusSelectorIds,
        diagnostics
      );
      const target = projectEquationObjects(
        input.animation.bundle.objects,
        targetIds,
        input.runtimeFrame.focusSelectorIds,
        diagnostics
      );

      if (source.length === 0 && target.length === 0) return [];

      return [{
        id: transformation.id,
        title: transformation.title,
        transformType: transformation.transformType,
        source,
        target,
        correspondence: transformation.correspondence.map((correspondence) => ({
          sourceSelectorId: forward
            ? correspondence.sourceSelectorId
            : correspondence.targetSelectorId,
          targetSelectorId: forward
            ? correspondence.targetSelectorId
            : correspondence.sourceSelectorId,
          preserves: [...correspondence.preserves],
          ...(correspondence.summary === undefined
            ? {}
            : { summary: correspondence.summary })
        }))
      }];
    });

  if (transitions.length === 0) {
    diagnostics.push({
      code: "equation-frame.no-active-transition",
      message:
        `Runtime phase ${input.runtimeFrame.phase.phaseId} has no active equation transition.`
    });
  }

  return {
    kind: "editor-equation-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    phaseId: input.runtimeFrame.phase.phaseId,
    direction: input.runtimeFrame.clock.direction,
    progress: input.runtimeFrame.clock.progress,
    focusSelectorIds: [...input.runtimeFrame.focusSelectorIds],
    transitions,
    diagnostics
  };
}

function projectEquationObjects(
  objects: readonly KpSemanticAssetObject[],
  objectIds: readonly string[],
  focusSelectorIds: readonly string[],
  diagnostics: KpEditorEquationProjectionDiagnostic[]
): readonly KpEditorEquationObjectProjection[] {
  return objectIds.flatMap((objectId) => {
    const object = objects.find((candidate) => candidate.id === objectId);
    if (object === undefined) return [];

    const latex = latexValue(object);
    if (latex !== undefined) {
      return [projectEquationObject(object, latex, focusSelectorIds)];
    }

    const formIds = comparisonFormIds(object);
    if (formIds.length > 0) {
      return projectEquationObjects(
        objects,
        formIds,
        focusSelectorIds,
        diagnostics
      );
    }

    diagnostics.push({
      code: "equation-frame.object-without-latex",
      message: `Semantic object ${object.id} does not expose equation LaTeX.`,
      objectId: object.id
    });
    return [];
  });
}

function projectEquationObject(
  object: KpSemanticAssetObject,
  latex: string,
  focusSelectorIds: readonly string[]
): KpEditorEquationObjectProjection {
  return {
    id: object.id,
    title: object.title,
    objectType: object.objectType,
    latex,
    selectors: object.selectors.map((selector) => ({
      id: selector.id,
      kind: selector.kind,
      ...(selector.label === undefined ? {} : { label: selector.label }),
      focused: focusSelectorIds.includes(selector.id)
    }))
  };
}

function latexValue(object: KpSemanticAssetObject): string | undefined {
  if (!isRecord(object.value)) return undefined;
  const latex = object.value["latex"];
  return typeof latex === "string" && latex.length > 0 ? latex : undefined;
}

function comparisonFormIds(object: KpSemanticAssetObject): readonly string[] {
  if (!isRecord(object.value)) return [];
  const formIds = object.value["formIds"];
  return Array.isArray(formIds)
    ? formIds.filter((value): value is string => typeof value === "string")
    : [];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
