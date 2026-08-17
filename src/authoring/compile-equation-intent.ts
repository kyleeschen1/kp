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
import {
  kpLogProductSemanticMotionBundles,
  type KpCompiledLogProductSemanticMotionBundle
} from "../semantic/log-product-semantic-motion.ts";
import {
  kpCanonicalCompiledLogQuotientSemanticMotion,
  kpCanonicalLogQuotientSemanticMotionRequest
} from "../semantic/log-quotient-semantic-motion.ts";
import { kpHomomorphicCrossoverCallerDeclarations } from
  "../animation/homomorphic-crossover-caller-declarations.ts";
import { kpHomomorphicCrossoverEquationExtensionPackId } from
  "../animation/equation-extension-packs/homomorphic-crossover.ts";
import { kpHomomorphicCrossoverAuthoringAuthorityId } from
  "./homomorphic-crossover-authoring.ts";

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
    }>
  | Readonly<{
      kind: "homomorphic-crossover-semantic-motion-plan";
      animationId: string;
      operationId:
        | "kp.semantic-motion.log-product"
        | "kp.semantic-motion.quotient";
      extensionPackId: typeof kpHomomorphicCrossoverEquationExtensionPackId;
      operationKind: string;
      recipeId: "recipe.equation.homomorphic-decomposition.v1";
      semanticAuthorityId:
        | "law.logarithm.product"
        | "law.logarithm.quotient";
      callerRegistrationId: string;
      plan: KpCompiledSemanticMotionChoreography;
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
  }),
  ...createHomomorphicSurfaceHandlers()
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

function createHomomorphicSurfaceHandlers():
readonly KpEquationIntentSurfaceHandler[] {
  const productHandlers = kpLogProductSemanticMotionBundles.map((bundle) =>
    homomorphicHandler({
      declaration: requireHomomorphicDeclaration(
        bundle.request.assetId,
        bundle.request.operation.operationId
      ),
      request: bundle.request,
      choreography: bundle.choreography
    })
  );
  return Object.freeze([
    ...productHandlers,
    homomorphicHandler({
      declaration: requireHomomorphicDeclaration(
        kpCanonicalLogQuotientSemanticMotionRequest.assetId,
        kpCanonicalLogQuotientSemanticMotionRequest.operation.operationId
      ),
      request: kpCanonicalLogQuotientSemanticMotionRequest,
      choreography: kpCanonicalCompiledLogQuotientSemanticMotion
    })
  ]);
}

function homomorphicHandler(input: {
  readonly declaration:
    (typeof kpHomomorphicCrossoverCallerDeclarations)[number];
  readonly request:
    KpCompiledLogProductSemanticMotionBundle["request"] |
    typeof kpCanonicalLogQuotientSemanticMotionRequest;
  readonly choreography: KpCompiledSemanticMotionChoreography;
}): KpEquationIntentSurfaceHandler {
  const { declaration, request, choreography } = input;
  return Object.freeze({
    animationId: declaration.callerId,
    operationId: declaration.semanticMotionOperationId,
    describe: () => vocabulary({
      animationId: declaration.callerId,
      operationId: declaration.semanticMotionOperationId,
      authoringAuthorityId: kpHomomorphicCrossoverAuthoringAuthorityId,
      availableSemanticEntityIds: [
        ...request.sourceState.entityIds,
        ...request.targetState.entityIds
      ],
      canonicalRoleBindings: request.operation.roleBindings
    }),
    compile: () => Object.freeze({
      kind: "homomorphic-crossover-semantic-motion-plan" as const,
      animationId: declaration.callerId,
      operationId: declaration.semanticMotionOperationId,
      extensionPackId: kpHomomorphicCrossoverEquationExtensionPackId,
      operationKind: declaration.operationKind,
      recipeId: declaration.recipeId,
      semanticAuthorityId: declaration.semanticAuthorityId,
      callerRegistrationId: declaration.callerRegistrationId,
      plan: choreography
    })
  });
}

function requireHomomorphicDeclaration(
  animationId: string,
  operationId: string
): (typeof kpHomomorphicCrossoverCallerDeclarations)[number] {
  const declaration = kpHomomorphicCrossoverCallerDeclarations.find(
    (candidate) => candidate.callerId === animationId &&
      candidate.semanticMotionOperationId === operationId
  );
  if (declaration === undefined) {
    throw new Error(
      `Missing homomorphic caller declaration for ${animationId} and ${operationId}.`
    );
  }
  return declaration;
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
