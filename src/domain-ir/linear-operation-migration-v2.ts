import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import type { KpAssetSelector } from "../semantic/asset.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationOperationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

type RoleBindings = Readonly<Record<string, readonly string[]>>;

interface KpLinearOperationMigrationContextV2 {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
  readonly sourceSelectors: readonly KpAssetSelector[];
  readonly targetSelectors: readonly KpAssetSelector[];
}

interface KpLinearOperationMigrationProtocolV2 {
  readonly operationId: string;
  readonly semanticClass: "evaluation" | "transformation";
  readonly bindRoles: (
    context: KpLinearOperationMigrationContextV2
  ) => RoleBindings;
}

const protocols = new Map<string, KpLinearOperationMigrationProtocolV2>([
  ...[
    ["subtractBothSides", "kp.algebra.subtract-both-sides"],
    ["addBothSides", "kp.algebra.add-both-sides"],
    ["divideBothSides", "kp.algebra.divide-both-sides"]
  ].map(([transformType, operationId]) => protocolEntry(
    transformType!,
    operationId!,
    "transformation",
    bindBalancedOperation
  )),
  ...[
    ["cancelAdditiveInverses", "kp.algebra.cancel-additive-inverses"],
    [
      "cancelMultiplicativeInverses",
      "kp.algebra.cancel-multiplicative-inverses"
    ]
  ].map(([transformType, operationId]) => protocolEntry(
    transformType!,
    operationId!,
    "evaluation",
    bindCancellation
  )),
  ...[
    ["simplifyConstantDifference", "kp.algebra.simplify-constant-difference"],
    ["simplifyConstantSum", "kp.algebra.simplify-constant-sum"],
    ["simplifyConstantQuotient", "kp.algebra.simplify-constant-quotient"]
  ].map(([transformType, operationId]) => protocolEntry(
    transformType!,
    operationId!,
    "evaluation",
    bindEvaluation
  )),
  protocolEntry(
    "distributeMultiplication",
    "kp.algebra.distribute-multiplication",
    "transformation",
    bindDistribution
  ),
  protocolEntry(
    "factorCommonTerm",
    "kp.algebra.factor-common-term",
    "transformation",
    bindFactoring
  )
]);

/**
 * Linear-operation migration is registry-driven: adding a caller never adds a
 * renderer branch, while a new semantic operation must declare one protocol.
 */
export function compileKpLinearOperationMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  const operations = animation.transformations.map((transformation) => {
    const protocol = protocols.get(transformation.transformType);
    if (protocol === undefined) {
      throw new Error(
        `${animation.id} has unsupported linear operation ` +
        `${transformation.transformType}.`
      );
    }
    const context = {
      animation,
      transformation,
      sourceSelectors: selectorsFor(
        animation,
        transformation.sourceObjectIds
      ),
      targetSelectors: selectorsFor(
        animation,
        transformation.targetObjectIds
      )
    };
    return Object.freeze({
      transformationId: transformation.id,
      operationId: protocol.operationId,
      semanticClass: protocol.semanticClass,
      roleBindings: protocol.bindRoles(context),
      projectionIntent: "replacement" as const
    } satisfies KpEquationAssetMigrationOperationV2);
  });
  return compileKpEquationAssetMigrationV2({ animation, operations });
}

function bindBalancedOperation(
  context: KpLinearOperationMigrationContextV2
): RoleBindings {
  return Object.freeze({
    "equation-before": context.transformation.sourceObjectIds,
    // Some authored traces expose the operation value only through the
    // introduced inverse. The canonical role intentionally permits omission.
    "operation-value": Object.freeze([]),
    "equation-after": context.transformation.targetObjectIds,
    "introduced-terms": correspondenceIds(context, "introduction", "target")
      .filter((id) => selectorById(context.targetSelectors, id)?.kind !==
        "artifact")
  });
}

function bindCancellation(
  context: KpLinearOperationMigrationContextV2
): RoleBindings {
  return Object.freeze({
    "context-before": context.transformation.sourceObjectIds,
    "inverse-terms": correspondenceIds(context, "cancelation", "source"),
    "context-after": context.transformation.targetObjectIds
  });
}

function bindEvaluation(
  context: KpLinearOperationMigrationContextV2
): RoleBindings {
  return Object.freeze({
    "operands-before": correspondenceIds(context, "fan-in", "source"),
    "result-after": correspondenceIds(context, "fan-in", "target")
  });
}

function bindDistribution(
  context: KpLinearOperationMigrationContextV2
): RoleBindings {
  return Object.freeze({
    "factor-before": correspondenceIds(context, "fan-out", "source"),
    "addends-before": correspondenceIds(context, "identity", "source")
      .filter((id) => selectorById(context.sourceSelectors, id)?.kind ===
        "term"),
    "factor-copies": correspondenceIds(context, "fan-out", "target"),
    "products-after": context.transformation.targetObjectIds
  });
}

function bindFactoring(
  context: KpLinearOperationMigrationContextV2
): RoleBindings {
  return Object.freeze({
    "products-before": context.transformation.sourceObjectIds,
    "common-factor-after": correspondenceIds(context, "fan-in", "target"),
    "grouped-terms-after": correspondenceIds(context, "identity", "target")
      .filter((id) => selectorById(context.targetSelectors, id)?.kind ===
        "term")
  });
}

function protocolEntry(
  transformType: string,
  operationId: string,
  semanticClass: KpLinearOperationMigrationProtocolV2["semanticClass"],
  bindRoles: KpLinearOperationMigrationProtocolV2["bindRoles"]
): readonly [string, KpLinearOperationMigrationProtocolV2] {
  return [transformType, Object.freeze({
    operationId,
    semanticClass,
    bindRoles
  })];
}

function selectorsFor(
  animation: KpAnimationAsset,
  objectIds: readonly string[]
): readonly KpAssetSelector[] {
  return objectIds.flatMap((objectId) => {
    const object = animation.bundle.objects.find(({ id }) => id === objectId);
    if (object === undefined) {
      throw new Error(`${animation.id} has no object ${objectId}.`);
    }
    return object.selectors;
  });
}

function correspondenceIds(
  context: KpLinearOperationMigrationContextV2,
  relation: string,
  endpoint: "source" | "target"
): readonly string[] {
  const records = context.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(`${context.transformation.id} requires correspondence.`);
  }
  return Object.freeze([...new Set(records
    .filter((record) => record.relation === relation)
    .flatMap((record) => endpoint === "source"
      ? record.sourceSelectorIds
      : record.targetSelectorIds))]);
}

function selectorById(
  selectors: readonly KpAssetSelector[],
  id: string
): KpAssetSelector | undefined {
  return selectors.find((selector) => selector.id === id);
}
