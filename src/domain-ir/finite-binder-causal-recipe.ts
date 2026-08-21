import {
  createKpRecipeId,
  type KpOperationKind
} from "./equation-motion-vocabulary.ts";
import type { KpFiniteBinderSemanticId } from
  "./finite-binder-vocabulary.ts";

export const KP_FINITE_BINDER_EXPANSION_RECIPE = createKpRecipeId(
  "recipe.equation.finite-binder-expansion.v1"
);

export type KpFiniteBinderCausalStep =
  | Readonly<{
      id: string;
      kind: "establish-binder-context";
      sourceId: KpFiniteBinderSemanticId;
      dependsOn: readonly [];
    }>
  | Readonly<{
      id: string;
      kind: "instantiate-body";
      ordinal: number;
      indexValue: number;
      sourceTemplateId: KpFiniteBinderSemanticId;
      targetInstanceId: KpFiniteBinderSemanticId;
      dependsOn: readonly string[];
    }>
  | Readonly<{
      id: string;
      kind: "derive-connector";
      ordinal: number;
      sourceOperatorId: KpFiniteBinderSemanticId;
      targetConnectorId: KpFiniteBinderSemanticId;
      betweenInstanceIds: readonly [
        KpFiniteBinderSemanticId,
        KpFiniteBinderSemanticId
      ];
      dependsOn: readonly [string, string];
    }>
  | Readonly<{
      id: string;
      kind: "establish-target-endpoint";
      targetLatex: string;
      dependsOn: readonly string[];
    }>;

export interface KpFiniteBinderCausalRecipe {
  readonly schemaVersion: "kp.finite-binder-causal-recipe.v1";
  readonly kind: "finite-binder-causal-recipe";
  readonly recipe: typeof KP_FINITE_BINDER_EXPANSION_RECIPE;
  readonly operationId: KpOperationKind;
  readonly steps: readonly KpFiniteBinderCausalStep[];
  readonly invariants: readonly [
    "scope-and-range-precede-instantiation",
    "instances-follow-inclusive-range-order",
    "connectors-require-both-neighbor-instances",
    "derivation-never-implies-occurrence-persistence",
    "presentation-remains-caller-owned"
  ];
}

export interface KpFiniteBinderCausalOperation {
  readonly operation: KpOperationKind;
  readonly source: Readonly<{
    semantic: Readonly<{
      id: KpFiniteBinderSemanticId;
      operator: Readonly<{ id: KpFiniteBinderSemanticId }>;
      body: Readonly<{ id: KpFiniteBinderSemanticId }>;
    }>;
  }>;
  readonly target: Readonly<{
    endpoint: Readonly<{ rawLatex: string }>;
    instances: readonly [Readonly<{
      id: KpFiniteBinderSemanticId;
      ordinal: number;
      indexValue: number;
    }>, ...Readonly<{
      id: KpFiniteBinderSemanticId;
      ordinal: number;
      indexValue: number;
    }>[]];
    connectors: readonly Readonly<{
      id: KpFiniteBinderSemanticId;
      ordinal: number;
    }>[];
  }>;
}

/**
 * The recipe orders causes, not frames. A renderer may choose its own holds,
 * paths, or simultaneous presentation so long as these semantic dependencies
 * and the operation's distinct occurrence identities remain intact.
 */
export function createKpFiniteBinderCausalRecipe(
  operation: KpFiniteBinderCausalOperation
): KpFiniteBinderCausalRecipe {
  const contextId = "finite-binder.establish-context";
  const steps: KpFiniteBinderCausalStep[] = [{
    id: contextId,
    kind: "establish-binder-context",
    sourceId: operation.source.semantic.id,
    dependsOn: []
  }];
  const instanceStepIds: string[] = [];
  for (const instance of operation.target.instances) {
    const stepId = `finite-binder.instantiate.${instance.ordinal}`;
    const previousId = instanceStepIds.at(-1);
    steps.push({
      id: stepId,
      kind: "instantiate-body",
      ordinal: instance.ordinal,
      indexValue: instance.indexValue,
      sourceTemplateId: operation.source.semantic.body.id,
      targetInstanceId: instance.id,
      dependsOn: [previousId ?? contextId]
    });
    instanceStepIds.push(stepId);
  }
  const connectorStepIds: string[] = [];
  for (const connector of operation.target.connectors) {
    const left = operation.target.instances[connector.ordinal];
    const right = operation.target.instances[connector.ordinal + 1];
    const leftStep = instanceStepIds[connector.ordinal];
    const rightStep = instanceStepIds[connector.ordinal + 1];
    if (left === undefined || right === undefined ||
        leftStep === undefined || rightStep === undefined) {
      throw new Error(
        `Connector ${connector.id} does not have two neighboring instances.`
      );
    }
    const stepId = `finite-binder.connector.${connector.ordinal}`;
    steps.push({
      id: stepId,
      kind: "derive-connector",
      ordinal: connector.ordinal,
      sourceOperatorId: operation.source.semantic.operator.id,
      targetConnectorId: connector.id,
      betweenInstanceIds: [left.id, right.id],
      dependsOn: [leftStep, rightStep]
    });
    connectorStepIds.push(stepId);
  }
  steps.push({
    id: "finite-binder.establish-target",
    kind: "establish-target-endpoint",
    targetLatex: operation.target.endpoint.rawLatex,
    dependsOn: [...instanceStepIds, ...connectorStepIds]
  });
  validateRecipeSteps(steps);
  return deepFreeze({
    schemaVersion: "kp.finite-binder-causal-recipe.v1" as const,
    kind: "finite-binder-causal-recipe" as const,
    recipe: KP_FINITE_BINDER_EXPANSION_RECIPE,
    operationId: operation.operation,
    steps,
    invariants: [
      "scope-and-range-precede-instantiation",
      "instances-follow-inclusive-range-order",
      "connectors-require-both-neighbor-instances",
      "derivation-never-implies-occurrence-persistence",
      "presentation-remains-caller-owned"
    ]
  });
}

function validateRecipeSteps(steps: readonly KpFiniteBinderCausalStep[]): void {
  const ids = steps.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Finite-binder causal step ids must be unique.");
  }
  const visited = new Set<string>();
  for (const step of steps) {
    if (step.dependsOn.some((dependency) => !visited.has(dependency))) {
      throw new Error(
        `Finite-binder causal step ${step.id} has an unresolved or cyclic dependency.`
      );
    }
    visited.add(step.id);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
