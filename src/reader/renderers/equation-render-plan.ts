import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpReaderAnimationFrame } from "../runtime/public-api.ts";
import type {
  KpEquationTransitionLifecycleKind,
  KpEquationTransitionIrRelation,
  KpEquationTransitionIrSelector,
  KpEquationTransitionIrState
} from "../../domain-ir/public-api.ts";
import {
  compileKpSemanticEquationTransitionResult,
  type KpSemanticEquationTransitionCompileDiagnostic
} from "../../domain-ir/public-api.ts";

export interface KpReaderEquationRenderPlan {
  readonly id: string;
  readonly kind: "reader-equation-render-plan";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly direction: KpReaderAnimationFrame["clock"]["direction"];
  readonly progress: number;
  readonly focusSelectorIds: readonly string[];
  readonly transitions: readonly KpReaderEquationTransitionPlan[];
  readonly diagnostics: readonly KpReaderEquationRenderPlanDiagnostic[];
}

export interface KpReaderEquationTransitionPlan {
  readonly id: string;
  readonly title: string;
  readonly transformType: string;
  readonly source: readonly KpReaderEquationStatePlan[];
  readonly target: readonly KpReaderEquationStatePlan[];
  readonly relations: readonly KpReaderEquationRelationPlan[];
  readonly semanticStatus: "ready" | "fallback";
  readonly semanticDiagnostics: readonly KpSemanticEquationTransitionCompileDiagnostic[];
}

export interface KpReaderEquationStatePlan {
  readonly objectId: string;
  readonly latex: string;
  readonly selectors: readonly KpReaderEquationSelectorPlan[];
}

export interface KpReaderEquationSelectorPlan {
  readonly id: string;
  readonly kind: KpEquationTransitionIrSelector["kind"];
  readonly semanticKind?: string | undefined;
  readonly label?: string | undefined;
  readonly focused: boolean;
}

export interface KpReaderEquationRelationPlan {
  readonly recordId: string;
  readonly relation: KpEquationTransitionIrRelation["relation"];
  readonly lifecycle: KpEquationTransitionLifecycleKind;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly summary: string;
}

export interface KpReaderEquationRenderPlanDiagnostic {
  readonly code:
    | "equation-plan.no-active-transition"
    | "equation-plan.missing-transformation"
    | "equation-plan.unrenderable-transition";
  readonly message: string;
  readonly transformationId?: string | undefined;
}

type KpReaderEquationAnimationFrame = Pick<
  KpReaderAnimationFrame,
  | "id"
  | "animationId"
  | "clock"
  | "phase"
  | "activeTransformationIds"
  | "focusSelectorIds"
>;

export function projectKpReaderEquationRenderPlan(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpReaderEquationAnimationFrame;
}): KpReaderEquationRenderPlan {
  if (input.animation.id !== input.runtimeFrame.animationId) {
    throw new Error(
      `Equation render plan animation ${input.animation.id} does not match runtime frame ${input.runtimeFrame.animationId}.`
    );
  }

  const diagnostics: KpReaderEquationRenderPlanDiagnostic[] = [];
  const transformationsById = new Map(
    input.animation.transformations.map((transformation) => [
      transformation.id,
      transformation
    ])
  );
  const transitions: KpReaderEquationTransitionPlan[] = [];

  for (const transformationId of input.runtimeFrame.activeTransformationIds) {
    const transformation = transformationsById.get(transformationId);
    if (transformation === undefined) {
      diagnostics.push({
        code: "equation-plan.missing-transformation",
        message: `Runtime frame ${input.runtimeFrame.id} references missing transformation ${transformationId}.`,
        transformationId
      });
      continue;
    }

    const compiled = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: input.animation.bundle,
      unsupportedPolicy: "typed-gap"
    });
    if (compiled.ir === undefined) {
      diagnostics.push({
        code: "equation-plan.unrenderable-transition",
        message:
          compiled.diagnostics[0]?.message ??
          `Transformation ${transformationId} did not produce equation transition IR.`,
        transformationId
      });
      continue;
    }

    const forward = input.runtimeFrame.clock.direction === "forward";
    transitions.push({
      id: transformation.id,
      title: transformation.title,
      transformType: transformation.transformType,
      source: projectStates(
        forward ? compiled.ir.source : compiled.ir.target,
        input.runtimeFrame.focusSelectorIds
      ),
      target: projectStates(
        forward ? compiled.ir.target : compiled.ir.source,
        input.runtimeFrame.focusSelectorIds
      ),
      relations: compiled.ir.relations.map((relation) =>
        projectRelation(relation, forward)
      ),
      semanticStatus: compiled.status === "semantic" ? "ready" : "fallback",
      semanticDiagnostics: compiled.diagnostics.map((diagnostic) => ({
        ...diagnostic
      }))
    });
  }

  if (transitions.length === 0) {
    diagnostics.push({
      code: "equation-plan.no-active-transition",
      message: `Runtime phase ${input.runtimeFrame.phase.phaseId} has no renderable equation transition.`
    });
  }

  return {
    id: `equation-plan.${input.runtimeFrame.id}`,
    kind: "reader-equation-render-plan",
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

function projectStates(
  states: readonly KpEquationTransitionIrState[],
  focusSelectorIds: readonly string[]
): readonly KpReaderEquationStatePlan[] {
  const focused = new Set(focusSelectorIds);
  return states.map((state) => ({
    objectId: state.objectId,
    latex: state.latex,
    selectors: state.selectors.map((selector) => ({
      id: selector.id,
      kind: selector.kind,
      ...(selector.semanticKind === undefined
        ? {}
        : { semanticKind: selector.semanticKind }),
      ...(selector.label === undefined ? {} : { label: selector.label }),
      focused: focused.has(selector.id)
    }))
  }));
}

function projectRelation(
  relation: KpEquationTransitionIrRelation,
  forward: boolean
): KpReaderEquationRelationPlan {
  return {
    recordId: relation.recordId,
    relation: relation.relation,
    lifecycle: forward
      ? relation.lifecycle
      : reverseLifecycle(relation.lifecycle),
    sourceSelectorIds: [
      ...(forward ? relation.sourceSelectorIds : relation.targetSelectorIds)
    ],
    targetSelectorIds: [
      ...(forward ? relation.targetSelectorIds : relation.sourceSelectorIds)
    ],
    summary: relation.summary
  };
}

function reverseLifecycle(
  lifecycle: KpEquationTransitionLifecycleKind
): KpEquationTransitionLifecycleKind {
  switch (lifecycle) {
    case "enter": return "exit";
    case "exit": return "enter";
    case "cancel": return "enter";
    case "merge": return "split";
    case "split": return "merge";
    case "persist":
    case "role-change":
    case "artifact":
    case "focus":
      return lifecycle;
  }
}
