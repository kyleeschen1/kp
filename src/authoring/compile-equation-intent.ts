import { createDistributionExpansionAnimationAsset } from
  "../animation/distribution-adapter.ts";
import { createFunctionWrapAnimationAsset } from
  "../animation/function-wrap-adapter.ts";
import {
  requireKpFunctionWrapAssetBinding,
  type KpFunctionWrapAssetBinding
} from "../animation/function-wrap-asset-binding.ts";
import {
  validateKpEquationLlmAuthoringRequest,
  validateKpEquationLlmEntityClosure,
  type KpEquationLlmAuthoringRequest,
  type KpEquationLlmRepairDiagnostic,
  type KpEquationLlmSurfaceDefinition
} from "./equation-llm-authoring-catalogue.ts";
import type {
  KpLlmPromotedOperationAuthoringDefinition
} from "../animation/llm-semantic-motion-operation-authoring.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../semantic/cancellation-pressure-contract.ts";
import {
  kpCanonicalCompiledCancellationPressureSemanticMotion
} from "../semantic/cancellation-pressure-semantic-motion.ts";
import type {
  KpCompiledSemanticMotionChoreography
} from "../domain-ir/semantic-motion-choreography-compiler.ts";
import type {
  KpCanonicalOperationExecutionResult
} from "../semantic/transformation-definition-binding.ts";
import {
  kpDistributionCanonicalOperationSpec
} from "../semantic/distribution-canonical-operation.ts";
import {
  kpCanonicalDistributionPressureContract
} from "../semantic/distribution-pressure-contract.ts";

export type KpEquationIntentRepairCode =
  | "equation-intent.surface.unsupported"
  | "equation-intent.surface-operation.mismatch"
  | "equation-intent.role-binding.mismatch";

export interface KpEquationIntentRepairDiagnostic {
  readonly code: KpEquationIntentRepairCode;
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export interface KpEquationIntentSurfaceVocabulary {
  readonly animationId: string;
  readonly operationId: string;
  readonly authoringAuthorityId: string;
  readonly availableSemanticEntityIds: readonly string[];
  readonly canonicalRoleBindings:
    Readonly<Record<string, readonly string[]>>;
}

export type KpCompiledEquationIntentPlan =
  | Readonly<{
      kind: "function-wrap-motif-plan";
      animationId: "animation.generated.function-wrap.apply-f";
      operationId: "kp.algebra.wrap-function";
      extensionPackId: string;
      recipeId: string;
      plan: KpFunctionWrapAssetBinding["compiledMotifPlan"];
    }>
  | Readonly<{
      kind: "cancellation-semantic-motion-plan";
      animationId: "animation.generated.cancellation.additive-inverses";
      operationId: "kp.algebra.cancel-additive-inverses";
      contractId: typeof kpCanonicalCancellationPressureContract.id;
      plan: KpCompiledSemanticMotionChoreography;
    }>
  | Readonly<{
      kind: "distribution-operation-plan";
      animationId: "animation.generated.distribution.expand-a-sum";
      operationId: "kp.algebra.distribute-multiplication";
      operationSpecId: typeof kpDistributionCanonicalOperationSpec.id;
      inverseOperationId: string;
      plan: KpCanonicalOperationExecutionResult;
    }>;

export type KpCompileEquationIntentResult =
  | Readonly<{
      status: "accepted";
      request: KpEquationLlmAuthoringRequest;
      surface: KpEquationLlmSurfaceDefinition;
      operation: KpLlmPromotedOperationAuthoringDefinition;
      plan: KpCompiledEquationIntentPlan;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      diagnostics: readonly (
        KpEquationLlmRepairDiagnostic | KpEquationIntentRepairDiagnostic
      )[];
    }>;

interface KpEquationIntentSurfaceHandler {
  readonly animationId: string;
  readonly operationId: string;
  readonly describe: () => KpEquationIntentSurfaceVocabulary;
  readonly compile: () => KpCompiledEquationIntentPlan;
}

const surfaceHandlers = Object.freeze([
  Object.freeze({
    animationId: "animation.generated.function-wrap.apply-f",
    operationId: "kp.algebra.wrap-function",
    describe: describeFunctionWrap,
    compile: compileFunctionWrap
  }),
  Object.freeze({
    animationId: "animation.generated.cancellation.additive-inverses",
    operationId: "kp.algebra.cancel-additive-inverses",
    describe: describeCancellation,
    compile: compileCancellation
  }),
  Object.freeze({
    animationId: "animation.generated.distribution.expand-a-sum",
    operationId: "kp.algebra.distribute-multiplication",
    describe: describeDistribution,
    compile: compileDistribution
  })
] as const satisfies readonly KpEquationIntentSurfaceHandler[]);

export function listKpEquationIntentSurfaceVocabularies():
readonly KpEquationIntentSurfaceVocabulary[] {
  return Object.freeze(surfaceHandlers.map((handler) => handler.describe()));
}

export function compileEquationIntent(
  value: unknown
): KpCompileEquationIntentResult {
  const validated = validateKpEquationLlmAuthoringRequest(value);
  if (validated.status !== "accepted") {
    return repair(validated.diagnostics);
  }
  const handler = surfaceHandlers.find(({ animationId }) =>
    animationId === validated.request.animationId
  );
  if (handler === undefined) {
    return repair([intentDiagnostic(
      "equation-intent.surface.unsupported",
      "$.animationId",
      `The narrow intent facade does not support ${validated.request.animationId}.`,
      "Choose a surface from listKpEquationIntentSurfaceVocabularies()."
    )]);
  }
  if (validated.request.operation.operationId !== handler.operationId) {
    return repair([intentDiagnostic(
      "equation-intent.surface-operation.mismatch",
      "$.operation.operationId",
      `${validated.request.animationId} requires ${handler.operationId}.`,
      "Use the operation declared by the selected surface vocabulary."
    )]);
  }

  const vocabulary = handler.describe();
  const closureDiagnostics = validateKpEquationLlmEntityClosure({
    request: validated.request,
    availableEntityIds: vocabulary.availableSemanticEntityIds
  });
  if (closureDiagnostics.length > 0) return repair(closureDiagnostics);
  const bindingDiagnostics = validateExactRoleBindings(
    validated.request,
    vocabulary
  );
  if (bindingDiagnostics.length > 0) return repair(bindingDiagnostics);

  return Object.freeze({
    status: "accepted" as const,
    request: validated.request,
    surface: validated.surface,
    operation: validated.operation,
    plan: handler.compile(),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function describeFunctionWrap(): KpEquationIntentSurfaceVocabulary {
  const animation = createFunctionWrapAnimationAsset();
  const binding = requireKpFunctionWrapAssetBinding(animation);
  return vocabulary({
    animationId: "animation.generated.function-wrap.apply-f",
    operationId: "kp.algebra.wrap-function",
    authoringAuthorityId: "compiler.equation.intent.function-wrap.v1",
    availableSemanticEntityIds: animation.bundle.objects.flatMap(
      ({ selectors }) => selectors.map(({ id }) => id)
    ),
    canonicalRoleBindings: {
      "content-before": binding.sourceArgumentEntityIds,
      "content-after": binding.targetArgumentEntityIds,
      wrapper: binding.wrapperEntityIds
    }
  });
}

function compileFunctionWrap(): KpCompiledEquationIntentPlan {
  const binding = requireKpFunctionWrapAssetBinding(
    createFunctionWrapAnimationAsset()
  );
  return Object.freeze({
    kind: "function-wrap-motif-plan" as const,
    animationId: "animation.generated.function-wrap.apply-f" as const,
    operationId: "kp.algebra.wrap-function" as const,
    extensionPackId: binding.packId,
    recipeId: binding.recipeId,
    plan: binding.compiledMotifPlan
  });
}

function describeCancellation(): KpEquationIntentSurfaceVocabulary {
  const contract = kpCanonicalCancellationPressureContract;
  return vocabulary({
    animationId: contract.animationId,
    operationId: contract.operationId,
    authoringAuthorityId:
      "compiler.equation.intent.additive-cancellation.v1",
    availableSemanticEntityIds: [
      contract.source.objectId,
      ...contract.source.selectorIds,
      contract.target.objectId,
      ...contract.target.selectorIds
    ],
    canonicalRoleBindings: {
      "context-before": [contract.source.objectId],
      "inverse-terms": contract.inversePair.sourceSelectorIds,
      "context-after": [contract.target.objectId]
    }
  });
}

function compileCancellation(): KpCompiledEquationIntentPlan {
  const contract = kpCanonicalCancellationPressureContract;
  return Object.freeze({
    kind: "cancellation-semantic-motion-plan" as const,
    animationId: contract.animationId,
    operationId: contract.operationId,
    contractId: contract.id,
    plan: kpCanonicalCompiledCancellationPressureSemanticMotion
  });
}

function describeDistribution(): KpEquationIntentSurfaceVocabulary {
  const animation = createDistributionExpansionAnimationAsset();
  const contract = kpCanonicalDistributionPressureContract;
  return vocabulary({
    animationId: contract.animationId,
    operationId: "kp.algebra.distribute-multiplication",
    authoringAuthorityId: "compiler.equation.intent.distribution.v1",
    availableSemanticEntityIds: [
      ...animation.bundle.objects.flatMap((object) => [
        object.id,
        ...object.selectors.map(({ id }) => id)
      ]),
      ...contract.productAttachments.map(({ id }) => id)
    ],
    canonicalRoleBindings: {
      "factor-before": [contract.source.factorSelectorId],
      "addends-before": [
        contract.source.leftAddendSelectorId,
        contract.source.rightAddendSelectorId
      ],
      "factor-copies": contract.factorFanOut.targetFactorSelectorIds,
      "products-after": contract.productAttachments.map(({ id }) => id)
    }
  });
}

function compileDistribution(): KpCompiledEquationIntentPlan {
  const contract = kpCanonicalDistributionPressureContract;
  return Object.freeze({
    kind: "distribution-operation-plan" as const,
    animationId: contract.animationId,
    operationId: "kp.algebra.distribute-multiplication" as const,
    operationSpecId: kpDistributionCanonicalOperationSpec.id,
    inverseOperationId: kpDistributionCanonicalOperationSpec.rewind.operationId,
    plan: contract.operationExecution
  });
}

function vocabulary(
  input: KpEquationIntentSurfaceVocabulary
): KpEquationIntentSurfaceVocabulary {
  return Object.freeze({
    ...input,
    availableSemanticEntityIds: Object.freeze([
      ...input.availableSemanticEntityIds
    ]),
    canonicalRoleBindings: Object.freeze(Object.fromEntries(
      Object.entries(input.canonicalRoleBindings).map(([roleId, entityIds]) => [
        roleId,
        Object.freeze([...entityIds])
      ])
    ))
  });
}

function validateExactRoleBindings(
  request: KpEquationLlmAuthoringRequest,
  vocabulary: KpEquationIntentSurfaceVocabulary
): readonly KpEquationIntentRepairDiagnostic[] {
  const diagnostics: KpEquationIntentRepairDiagnostic[] = [];
  for (const [roleId, expectedEntityIds] of Object.entries(
    vocabulary.canonicalRoleBindings
  )) {
    const actualEntityIds = request.operation.roleBindings[roleId] ?? [];
    if (sameArray(actualEntityIds, expectedEntityIds)) continue;
    diagnostics.push(intentDiagnostic(
      "equation-intent.role-binding.mismatch",
      `$.operation.roleBindings.${roleId}`,
      `Role ${roleId} does not match ${request.animationId}'s canonical ownership.`,
      "Use the exact role binding from the selected surface vocabulary."
    ));
  }
  return Object.freeze(diagnostics);
}

function repair(
  diagnostics: readonly (
    KpEquationLlmRepairDiagnostic | KpEquationIntentRepairDiagnostic
  )[]
): KpCompileEquationIntentResult {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([...diagnostics])
  });
}

function intentDiagnostic(
  code: KpEquationIntentRepairCode,
  path: string,
  message: string,
  repairInstruction: string
): KpEquationIntentRepairDiagnostic {
  return Object.freeze({
    code,
    path,
    message,
    repair: repairInstruction
  });
}

function sameArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
