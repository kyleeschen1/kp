import {
  kpEquationSeriesOperationRegistry,
  type KpEquationSeriesOperationRegistry
} from "./equation-series-operation-declarations.ts";

export interface KpEquationSeriesOperationAlias {
  readonly aliasId: string;
  readonly canonicalOperationId: string;
}

export interface KpEquationSeriesOperationAliasRegistry {
  readonly schemaVersion: "kp.equation-series-operation-alias-registry.v1";
  readonly kind: "equation-series-operation-alias-registry";
  readonly aliases: readonly KpEquationSeriesOperationAlias[];
  readonly byAliasId: Readonly<Record<string, KpEquationSeriesOperationAlias>>;
}

export type KpEquationSeriesOperationIdNormalization =
  | Readonly<{
      readonly status: "canonical";
      readonly requestedOperationId: string;
      readonly canonicalOperationId: string;
    }>
  | Readonly<{
      readonly status: "alias";
      readonly requestedOperationId: string;
      readonly canonicalOperationId: string;
    }>
  | Readonly<{
      readonly status: "unknown";
      readonly requestedOperationId: string;
    }>;

/**
 * Alias knowledge is projected from declarations so adding an operation pack
 * never requires a central normalization switch.
 */
export function createKpEquationSeriesOperationAliasRegistry(
  operationRegistry: KpEquationSeriesOperationRegistry
): KpEquationSeriesOperationAliasRegistry {
  const aliases = operationRegistry.declarations.flatMap((declaration) =>
    declaration.plannerExposure.kind === "alias"
      ? [{
          aliasId: declaration.operationId,
          canonicalOperationId:
            declaration.plannerExposure.canonicalOperationId
        }]
      : []
  );
  const byAliasId: Record<string, KpEquationSeriesOperationAlias> = {};
  aliases.forEach((alias) => {
    if (byAliasId[alias.aliasId] !== undefined) {
      throw new Error(`Duplicate equation series operation alias ${alias.aliasId}.`);
    }
    if (operationRegistry.plannerById[alias.aliasId] !== undefined) {
      throw new Error(
        `Equation series alias ${alias.aliasId} collides with a canonical planner operation.`
      );
    }
    if (operationRegistry.plannerById[alias.canonicalOperationId] === undefined) {
      throw new Error(
        `Equation series alias ${alias.aliasId} targets unknown canonical ` +
        `operation ${alias.canonicalOperationId}.`
      );
    }
    byAliasId[alias.aliasId] = Object.freeze({ ...alias });
  });
  return deepFreeze({
    schemaVersion: "kp.equation-series-operation-alias-registry.v1" as const,
    kind: "equation-series-operation-alias-registry" as const,
    aliases: Object.values(byAliasId),
    byAliasId
  });
}

export const kpEquationSeriesOperationAliasRegistry =
  createKpEquationSeriesOperationAliasRegistry(
    kpEquationSeriesOperationRegistry
  );

export function normalizeKpEquationSeriesOperationId(input: {
  readonly operationId: string;
  readonly operationRegistry?: KpEquationSeriesOperationRegistry | undefined;
  readonly aliasRegistry?:
    KpEquationSeriesOperationAliasRegistry | undefined;
}): KpEquationSeriesOperationIdNormalization {
  const operationRegistry = input.operationRegistry ??
    kpEquationSeriesOperationRegistry;
  if (operationRegistry.plannerById[input.operationId] !== undefined) {
    return Object.freeze({
      status: "canonical" as const,
      requestedOperationId: input.operationId,
      canonicalOperationId: input.operationId
    });
  }
  const aliasRegistry = input.aliasRegistry ??
    (input.operationRegistry === undefined
      ? kpEquationSeriesOperationAliasRegistry
      : createKpEquationSeriesOperationAliasRegistry(operationRegistry));
  const alias = aliasRegistry.byAliasId[input.operationId];
  if (alias === undefined) {
    return Object.freeze({
      status: "unknown" as const,
      requestedOperationId: input.operationId
    });
  }
  return Object.freeze({
    status: "alias" as const,
    requestedOperationId: input.operationId,
    canonicalOperationId: alias.canonicalOperationId
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
