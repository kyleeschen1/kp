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
import {
  resolveDefaultEquationTransformVisualMotifRule
} from "../../animation/motifs/equation-visual-motif-defaults.ts";
import {
  compileKpEquationStructuralSuccessionIntent,
  type KpEquationVisualMotifIntent
} from "../../animation/structural-succession-presentation.ts";
import {
  compileKpAnimationTransformationPhaseCohorts,
  findKpAnimationTransformationPhaseCohort
} from "../../animation/transformation-phase-cohorts.ts";
import {
  createKpEquationSuccessorSynthesisBindings
} from "../../rendering/equation-linear-rearrangement-bindings.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentation
} from "../../animation/successor-synthesis-presentation-plan.ts";
import {
  compileKpFactorCommonTermMotifBinding
} from "../../animation/factoring-motif-binding.ts";
import {
  findKpRegisteredOperationPresentationPlan,
  hasKpOperationPresentationPlanResolution,
  registerKpOperationPresentationPlan,
  registerKpOperationPresentationPlanAbsence,
  type KpVerifiedDistributionPresentationPlan,
  type KpVerifiedFactoringPresentationPlan,
  type KpVerifiedFractionMaterialPresentationPlan,
  type KpVerifiedOperationPresentationPlan,
  type KpVerifiedStructuralSuccessionPresentationPlan
} from "../../animation/operation-presentation-plan-types.ts";
import {
  compileKpDistributionFactoringPresentationPlan
} from "../../animation/distribution-factoring-presentation-plan.ts";
import {
  compileKpFractionMaterialPresentationPlan
} from "../../animation/fraction-material-presentation-plan.ts";
import {
  compileKpStructuralSuccessionOperationPresentationPlan
} from "../../animation/structural-succession-operation-presentation-plan.ts";
import {
  compileKpBalancedIntroductionPresentationPlan
} from "../../animation/balanced-introduction-presentation-plan.ts";
import {
  decideKpEquationOperationChoreography
} from "./equation-operation-choreography-compiler.ts";
import {
  createKpReaderEquationTransitionPresentationPlan,
  projectKpReaderEquationTransitionPresentation,
  type KpReaderEquationTransitionPresentationPlan
} from "./equation-transition-presentation-plan.ts";

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
  readonly presentationPlan: KpReaderEquationTransitionPresentationPlan;
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
      bundle: input.animation.bundle
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
    const visualMotifRule = resolveDefaultEquationTransformVisualMotifRule(
      transformation.transformType
    );
    const visualMotif = visualMotifRule === undefined
      ? undefined
      : {
          kind: visualMotifRule.descriptor.kind,
          motionPrimitiveIds: [
            ...visualMotifRule.descriptor.motionPrimitiveIds
          ],
          phaseIds: [...visualMotifRule.descriptor.phaseIds],
          summary:
            visualMotifRule.summary ?? visualMotifRule.descriptor.summary
        };
    const structuralSuccession = visualMotif === undefined
      ? undefined
      : compileKpEquationStructuralSuccessionIntent({
          transformation,
          motif: visualMotif,
          direction: input.runtimeFrame.clock.direction
        });
    const successorSynthesisBindings =
      createKpEquationSuccessorSynthesisBindings({
        animation: input.animation,
        transformation
      });
    const successorSynthesisDecisions =
      successorSynthesisBindings.map((binding) => ({
        binding,
        decision: compileKpRegisteredSuccessorSynthesisPresentation({
          transformationId: transformation.id,
          transformationKind: transformation.transformType,
          binding
        })
      }));
    const successorSyntheses = successorSynthesisDecisions.flatMap(
      ({ binding, decision }) =>
        decision.status === "compiled"
          ? [Object.freeze({
              ...binding,
              operationPresentationPlan:
                decision.operationPresentationPlan,
              paintContinuityPlan: decision.paintContinuityPlan,
              continuityProgram: decision.continuityProgram
            })]
          : []
    );
    const successorExecutablePrograms = successorSynthesisDecisions.flatMap(
      ({ decision }) =>
        decision.status === "compiled"
          ? [decision.executableProgram]
          : []
    );
    const successorExecutableProgram =
      requireSharedSuccessorExecutableProgram(
        transformation.id,
        successorExecutablePrograms
      );
    const successorStaticCheckpoint = successorSynthesisDecisions.find(
      ({ decision }) => decision.status === "explicit-static"
    )?.decision;
    const choreographyDecision =
      decideKpEquationOperationChoreography({
        animation: input.animation,
        transformation,
        motifKind: visualMotif?.kind,
        direction: input.runtimeFrame.clock.direction
      });
    const compiledOperationChoreography =
      choreographyDecision.status === "verified"
        ? choreographyDecision.choreography
        : undefined;
    const operationChoreography =
      compiledOperationChoreography?.kind ===
        "synchronized-balanced-introduction"
        ? Object.freeze({
            ...compiledOperationChoreography,
            operationPresentationPlan:
              compileKpBalancedIntroductionPresentationPlan(
                compiledOperationChoreography
              )
          })
        : compiledOperationChoreography;
    const relations = compiled.ir.relations.map((relation) =>
      projectRelation(relation, forward)
    );
    const sourceSelectorIds = compiled.ir.source.flatMap(
      ({ selectors }) => selectors.map(({ id }) => id)
    );
    const targetSelectorIds = compiled.ir.target.flatMap(
      ({ selectors }) => selectors.map(({ id }) => id)
    );
    if (!hasKpOperationPresentationPlanResolution(transformation)) {
      const compiledPlan =
        compileKpDistributionFactoringPresentationPlan({
          transformation,
          sourceSelectorIds,
          targetSelectorIds
        }) ??
        compileKpFractionMaterialPresentationPlan({
          transformation,
          sourceSelectorIds,
          targetSelectorIds
        }) ??
        compileKpStructuralSuccessionOperationPresentationPlan({
          transformation,
          sourceSelectorIds,
          targetSelectorIds
        });
      if (compiledPlan === undefined) {
        registerKpOperationPresentationPlanAbsence(transformation);
      } else {
        registerKpOperationPresentationPlan(
          transformation,
          compiledPlan
        );
      }
    }
    const registeredOperationPlan =
      findKpRegisteredOperationPresentationPlan(transformation);
    const distributionOperationPlans =
      transformation.transformType === "distributeMultiplication" &&
      transformation.definitionId ===
        "definition.generated.distribution.distribute-multiplication"
        ? [
            requireRegisteredDistributionPlan({
              transformationId: transformation.id,
              motifKind: visualMotif?.kind,
              semanticStatus:
                compiled.status === "semantic" ? "ready" : "fallback",
              plan: registeredOperationPlan
            })
          ]
        : [];
    const baseFactoringMotifBinding =
      compileKpFactorCommonTermMotifBinding({
      transitionId: transformation.id,
      transformType: transformation.transformType,
      motifKind: visualMotif?.kind,
      direction: input.runtimeFrame.clock.direction,
      semanticStatus: compiled.status === "semantic" ? "ready" : "fallback",
      successorSynthesisCount: successorSyntheses.length,
      relations
    });
    const factoringMotifBinding =
      baseFactoringMotifBinding === undefined ||
      transformation.definitionId !==
        "definition.generated.distribution.factor-common-term"
        ? undefined
        : Object.freeze({
            ...baseFactoringMotifBinding,
            operationPresentationPlan:
              requireRegisteredFactoringPlan(
                transformation.id,
                registeredOperationPlan
              )
          });
    const fractionMaterialPresentationPlan =
      isFractionMaterialTransformation(transformation)
        ? requireRegisteredFractionMaterialPlan(
            transformation.id,
            registeredOperationPlan
          )
        : undefined;
    const registeredStructuralSuccession =
      structuralSuccession === undefined
        ? undefined
        : Object.freeze({
            ...structuralSuccession,
            operationPresentationPlan:
              requireRegisteredStructuralSuccessionPlan(
                transformation.id,
                registeredOperationPlan
              )
          });
    const presentationPlan =
      createKpReaderEquationTransitionPresentationPlan({
        transitionId: transformation.id,
        visualMotif,
        factoringMotifBinding,
        distributionOperationPlans,
        fractionMaterialPresentationPlan,
        structuralSuccession: registeredStructuralSuccession,
        successorSyntheses,
        executableProgram: successorExecutableProgram,
        operationChoreography,
        ...(choreographyDecision.status === "explicit-static"
          ? { staticCheckpoint: choreographyDecision.checkpoint }
          : successorStaticCheckpoint?.status === "explicit-static"
            ? { staticCheckpoint: successorStaticCheckpoint.checkpoint }
            : {})
      });
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
      relations,
      presentationPlan,
      semanticStatus: compiled.status === "semantic" ? "ready" : "fallback",
      semanticDiagnostics: compiled.diagnostics.map((diagnostic) => ({
        ...diagnostic
      }))
    });
  }

  const cohort = findKpAnimationTransformationPhaseCohort({
    cohorts: compileKpAnimationTransformationPhaseCohorts(input.animation),
    transformationIds: input.runtimeFrame.activeTransformationIds
  });
  const projectedTransitions =
    cohort !== undefined && transitions.length > 1
      ? [mergeParallelTransitions(cohort.id, transitions)]
      : transitions;

  if (projectedTransitions.length === 0) {
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
    transitions: projectedTransitions,
    diagnostics
  };
}

function requireRegisteredDistributionPlan(input: {
  readonly transformationId: string;
  readonly motifKind?: string | undefined;
  readonly semanticStatus: "ready" | "fallback";
  readonly plan?: KpVerifiedOperationPresentationPlan | undefined;
}): KpVerifiedDistributionPresentationPlan {
  if (
    input.semanticStatus !== "ready" ||
    input.motifKind !== "copy-fan-out"
  ) {
    throw new Error(
      `Distribution transition ${input.transformationId} requires ` +
      "semantic lineage and copy-fan-out."
    );
  }
  if (input.plan?.planKind !== "distribution") {
    throw new Error(
      `Distribution transition ${input.transformationId} is missing its ` +
      "verified distribution plan."
    );
  }
  return input.plan;
}

function requireRegisteredFactoringPlan(
  transformationId: string,
  plan: KpVerifiedOperationPresentationPlan | undefined
): KpVerifiedFactoringPresentationPlan {
  if (plan?.planKind !== "factoring") {
    throw new Error(
      `Factoring transition ${transformationId} is missing its verified ` +
      "factoring plan."
    );
  }
  return plan;
}

function requireRegisteredFractionMaterialPlan(
  transformationId: string,
  plan: KpVerifiedOperationPresentationPlan | undefined
): KpVerifiedFractionMaterialPresentationPlan {
  if (plan?.planKind !== "fraction-material") {
    throw new Error(
      `Fraction transition ${transformationId} is missing its verified ` +
      "fission/fusion plan."
    );
  }
  return plan;
}

function requireRegisteredStructuralSuccessionPlan(
  transformationId: string,
  plan: KpVerifiedOperationPresentationPlan | undefined
): KpVerifiedStructuralSuccessionPresentationPlan {
  if (plan?.planKind !== "structural-succession") {
    throw new Error(
      `Structural transition ${transformationId} is missing its verified ` +
      "succession plan."
    );
  }
  return plan;
}

function isFractionMaterialTransformation(
  transformation: KpAnimationAsset["transformations"][number]
): boolean {
  return (
    transformation.transformType === "splitFractionSum" &&
    transformation.definitionId ===
      "definition.symbolic.algebra.split-fraction-sum"
  ) || (
    transformation.transformType === "mergeFractions" &&
    transformation.definitionId ===
      "definition.symbolic.algebra.merge-fractions"
  );
}

function mergeParallelTransitions(
  cohortId: string,
  transitions: readonly KpReaderEquationTransitionPlan[]
): KpReaderEquationTransitionPlan {
  const recordIds = new Set<string>();
  for (const relation of transitions.flatMap(({ relations }) => relations)) {
    if (recordIds.has(relation.recordId)) {
      throw new Error(
        `Parallel equation cohort ${cohortId} repeats relation ${relation.recordId}.`
      );
    }
    recordIds.add(relation.recordId);
  }
  const visualMotif = sharedParallelVisualMotif(transitions);
  const successorSyntheses = transitions.flatMap((transition) =>
    projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    ).successorSyntheses ?? []
  );
  const successorExecutablePrograms = transitions.flatMap((transition) => {
    const presentation = projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    );
    return presentation.executableProgram === undefined
      ? []
      : [presentation.executableProgram];
  });
  const successorExecutableProgram =
    requireSharedSuccessorExecutableProgram(
      cohortId,
      successorExecutablePrograms
    );
  const distributionOperationPlans = transitions.flatMap((transition) =>
    projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    ).distributionOperationPlans ?? []
  );
  return {
    id: cohortId,
    title: transitions.map(({ title }) => title).join(" and "),
    // A homogeneous cohort keeps its common motif; a mixed cohort cannot let
    // one branch's specialized intent claim ownership of every other branch.
    transformType: "parallelSemanticCohort",
    source: mergeStates(transitions.flatMap(({ source }) => source)),
    target: mergeStates(transitions.flatMap(({ target }) => target)),
    relations: transitions.flatMap(({ relations }) => relations),
    presentationPlan: createKpReaderEquationTransitionPresentationPlan({
      transitionId: cohortId,
      visualMotif,
      successorSyntheses,
      executableProgram: successorExecutableProgram,
      distributionOperationPlans
    }),
    semanticStatus: transitions.every(
      ({ semanticStatus }) => semanticStatus === "ready"
    )
      ? "ready"
      : "fallback",
    semanticDiagnostics: transitions.flatMap(
      ({ semanticDiagnostics }) => semanticDiagnostics
    )
  };
}

function requireSharedSuccessorExecutableProgram(
  transitionId: string,
  programs: readonly import(
    "../../animation/motifs/executable-successor-motif-program.ts"
  ).KpVerifiedExecutableSuccessorMotifProgram[]
) {
  const first = programs[0];
  if (
    first !== undefined &&
    programs.some((program) => program !== first)
  ) {
    throw new Error(
      `Reader transition ${transitionId} resolved competing executable ` +
      "successor programs."
    );
  }
  return first;
}

function sharedParallelVisualMotif(
  transitions: readonly KpReaderEquationTransitionPlan[]
): KpEquationVisualMotifIntent | undefined {
  const presentations = transitions.map((transition) =>
    projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    )
  );
  const first = presentations[0]?.visualMotif;
  if (
    first === undefined ||
    !presentations.every(({ visualMotif }) =>
      visualMotif !== undefined &&
      visualMotif.kind === first.kind &&
      visualMotif.summary === first.summary &&
      sameOrderedValues(
        visualMotif.motionPrimitiveIds,
        first.motionPrimitiveIds
      ) &&
      sameOrderedValues(visualMotif.phaseIds, first.phaseIds)
    )
  ) {
    return undefined;
  }
  return {
    kind: first.kind,
    motionPrimitiveIds: [...first.motionPrimitiveIds],
    phaseIds: [...first.phaseIds],
    summary: first.summary
  };
}

function sameOrderedValues(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function mergeStates(
  states: readonly KpReaderEquationStatePlan[]
): readonly KpReaderEquationStatePlan[] {
  const byObjectId = new Map<string, {
    latex: string;
    selectors: Map<string, KpReaderEquationSelectorPlan>;
  }>();
  for (const state of states) {
    const existing = byObjectId.get(state.objectId);
    if (existing !== undefined && existing.latex !== state.latex) {
      throw new Error(
        `Parallel equation state ${state.objectId} has conflicting LaTeX.`
      );
    }
    const entry = existing ?? {
      latex: state.latex,
      selectors: new Map<string, KpReaderEquationSelectorPlan>()
    };
    for (const selector of state.selectors) {
      entry.selectors.set(selector.id, selector);
    }
    byObjectId.set(state.objectId, entry);
  }
  return [...byObjectId].map(([objectId, state]) => ({
    objectId,
    latex: state.latex,
    selectors: [...state.selectors.values()]
  }));
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
