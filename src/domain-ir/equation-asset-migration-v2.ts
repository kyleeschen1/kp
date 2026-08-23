import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  kpCanonicalOperationRegistry,
  type KpCanonicalOperationRegistryEntry
} from "../semantic/canonical-operation-registry.ts";
import type {
  KpCanonicalOperationRole
} from "../semantic/canonical-operation.ts";
import {
  compileKpEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarOperationV2,
  type KpEquationProjectionIntentV2
} from "./equation-grammar-v2.ts";
import {
  compileKpEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2
} from "./equation-presentation-plan-v2.ts";

export const kpEquationAssetMigrationCompilerV2Id =
  "kp.equation-asset-migration-compiler.v2" as const;

export interface KpEquationAssetMigrationOperationV2 {
  readonly transformationId: string;
  readonly operationId: string;
  readonly semanticClass: KpEquationGrammarOperationV2["semanticClass"];
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly projectionIntent: KpEquationProjectionIntentV2;
}

export interface KpEquationAssetMigrationV2 {
  readonly schemaVersion: "kp.equation-asset-migration.v2";
  readonly kind: "compiled-equation-asset-migration-v2";
  readonly compilerId: typeof kpEquationAssetMigrationCompilerV2Id;
  readonly assetId: string;
  readonly operationIds: readonly string[];
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly presentationPlan: KpCompiledEquationPresentationPlanV2;
}

export class KpEquationAssetMigrationV2Error extends Error {
  override readonly name = "KpEquationAssetMigrationV2Error";
}

/**
 * Existing assets join governance v2 by naming semantic operations and roles.
 * This boundary deliberately owns no renderer, timing, path, or family profile.
 */
export function compileKpEquationAssetMigrationV2(input: {
  readonly animation: KpAnimationAsset;
  readonly operations: readonly KpEquationAssetMigrationOperationV2[];
}): KpEquationAssetMigrationV2 {
  const transformationsById = new Map(
    input.animation.transformations.map((transformation) => [
      transformation.id,
      transformation
    ] as const)
  );
  const operationsByTransformationId = new Map<string,
    KpEquationAssetMigrationOperationV2>();
  for (const operation of input.operations) {
    if (operationsByTransformationId.has(operation.transformationId)) {
      fail(`Duplicate migration operation for ${operation.transformationId}.`);
    }
    if (!transformationsById.has(operation.transformationId)) {
      fail(`${input.animation.id} has no transformation ${operation.transformationId}.`);
    }
    operationsByTransformationId.set(operation.transformationId, operation);
  }
  const missing = input.animation.transformations
    .filter(({ id }) => !operationsByTransformationId.has(id))
    .map(({ id }) => id);
  if (missing.length > 0 || input.operations.length === 0) {
    fail(`${input.animation.id} requires one v2 operation for every transformation; missing [${missing.join(", ")}].`);
  }

  const operationPacks = new Map<string,
    (typeof kpCanonicalOperationRegistry.packs)[number]>();
  const states: Array<{
    readonly id: string;
    readonly objectIds: readonly string[];
    readonly entityIds: readonly string[];
  }> = [];
  const transitions = input.animation.transformations.map(
    (transformation, index) => {
      const correspondenceMap = transformation.correspondenceMap;
      if (correspondenceMap === undefined) {
        fail(`${transformation.id} requires semantic correspondence.`);
      }
      const operation = operationsByTransformationId.get(transformation.id)!;
      const entry = requiredOperation(operation.operationId);
      collectOperationPack(entry.packId, operationPacks);
      const sourceObjects = objectsById(
        input.animation,
        transformation.sourceObjectIds,
        "source"
      );
      const targetObjects = objectsById(
        input.animation,
        transformation.targetObjectIds,
        "target"
      );
      const sourceEntityIds = sourceObjects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id));
      const targetEntityIds = targetObjects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id));
      validateKpEquationMigrationRoleBindings({
        entry,
        roleBindings: operation.roleBindings,
        sourceEntityIds: new Set(sourceEntityIds),
        targetEntityIds: new Set(targetEntityIds)
      });
      const sourceStateId = `state.${input.animation.id}.migration.${index}.source`;
      const targetStateId = `state.${input.animation.id}.migration.${index}.target`;
      states.push({
        id: sourceStateId,
        objectIds: transformation.sourceObjectIds,
        entityIds: sourceEntityIds
      }, {
        id: targetStateId,
        objectIds: transformation.targetObjectIds,
        entityIds: targetEntityIds
      });
      return {
        id: `transition.${transformation.id}`,
        transformationId: transformation.id,
        sourceStateId,
        targetStateId,
        operation: {
          operationId: operation.operationId,
          semanticClass: operation.semanticClass,
          roleBindings: operation.roleBindings,
          correspondenceMap,
          semanticAuthorityIds: [
            transformation.id,
            ...(transformation.lawRefs ?? []).map(({ id }) => id)
          ]
        },
        projection: { intent: operation.projectionIntent },
        typographyPolicyId: "typography.equation.stage.v2" as const,
        typographyRequirements: { largeOperators: [] },
        teachingIntent: {
          kind: "cause" as const,
          primaryEntityIds: targetEntityIds,
          secondaryEntityIds: sourceEntityIds,
          summary: transformation.title
        }
      };
    }
  );
  const grammarResult = compileKpEquationGrammarV2({
    schemaVersion: "kp.equation-grammar.v2",
    id: `grammar.${input.animation.id}.v2`,
    assetId: input.animation.id,
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: input.animation.bundle.id,
      revisionId: `${input.animation.id}@${input.animation.version}`,
      operationPacks: [...operationPacks.values()].map(({ id, version }) => ({
        packId: id,
        version
      }))
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states,
    transitions
  });
  if (grammarResult.status !== "compiled") {
    fail(grammarResult.diagnostics.map(({ message }) => message).join("\n"));
  }
  const presentation = compileKpEquationPresentationPlanV2({
    grammar: grammarResult.grammar
  });
  if (presentation.status !== "compiled") {
    fail(presentation.diagnostics.map(({ message }) => message).join("\n"));
  }
  input.operations.forEach((operation) => {
    const transition = presentation.plan.transitions.find(
      ({ semanticOperation }) =>
        semanticOperation.transformationId === operation.transformationId
    );
    if (transition?.semanticOperation.operationId !== operation.operationId) {
      fail(`${operation.transformationId} lost canonical operation authority during v2 compilation.`);
    }
  });
  return Object.freeze({
    schemaVersion: "kp.equation-asset-migration.v2" as const,
    kind: "compiled-equation-asset-migration-v2" as const,
    compilerId: kpEquationAssetMigrationCompilerV2Id,
    assetId: input.animation.id,
    operationIds: Object.freeze(input.operations.map(({ operationId }) =>
      operationId)),
    grammar: grammarResult.grammar,
    presentationPlan: presentation.plan
  });
}

export function validateKpEquationMigrationRoleBindings(input: {
  readonly entry: KpCanonicalOperationRegistryEntry;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly sourceEntityIds: ReadonlySet<string>;
  readonly targetEntityIds: ReadonlySet<string>;
}): void {
  const rolesById = new Map(input.entry.contract.roles.map((role) =>
    [role.id, role]));
  const supplied = Object.keys(input.roleBindings);
  const unexpected = supplied.filter((id) => !rolesById.has(id));
  const missing = [...rolesById.keys()].filter((id) =>
    input.roleBindings[id] === undefined);
  if (unexpected.length > 0 || missing.length > 0) {
    fail(`${input.entry.id} role mismatch; missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}].`);
  }
  for (const role of input.entry.contract.roles) {
    const entityIds = input.roleBindings[role.id]!;
    validateCardinality(role, entityIds.length);
    const endpoint = role.endpoint === "source"
      ? input.sourceEntityIds
      : input.targetEntityIds;
    const foreign = entityIds.filter((id) => !endpoint.has(id));
    if (foreign.length > 0) {
      fail(`${input.entry.id} role ${role.id} binds foreign ${role.endpoint} entities ${foreign.join(", ")}.`);
    }
  }
}

function requiredOperation(operationId: string):
KpCanonicalOperationRegistryEntry {
  const entry = kpCanonicalOperationRegistry.entries.find(
    ({ id }) => id === operationId
  );
  if (entry === undefined) fail(`Unknown canonical operation ${operationId}.`);
  return entry;
}

function collectOperationPack(
  packId: string,
  result: Map<string, (typeof kpCanonicalOperationRegistry.packs)[number]>
): void {
  if (result.has(packId)) return;
  const pack = kpCanonicalOperationRegistry.packs.find(({ id }) => id === packId);
  if (pack === undefined) fail(`Unknown canonical operation pack ${packId}.`);
  result.set(pack.id, pack);
  pack.dependencies.forEach((dependency) => {
    const resolved = kpCanonicalOperationRegistry.packs.find(
      ({ id, version }) => id === dependency.packId &&
        version === dependency.version
    );
    if (resolved === undefined) {
      fail(`${pack.id} has an unresolved exact dependency ${dependency.packId}@${dependency.version}.`);
    }
    collectOperationPack(resolved.id, result);
  });
}

function objectsById(
  animation: KpAnimationAsset,
  ids: readonly string[],
  endpoint: string
) {
  return ids.map((id) => {
    const object = animation.bundle.objects.find((candidate) =>
      candidate.id === id);
    if (object === undefined) {
      fail(`${animation.id} has an unresolved ${endpoint} object ${id}.`);
    }
    return object;
  });
}

function validateCardinality(
  role: KpCanonicalOperationRole,
  count: number
): void {
  const valid = role.cardinality === "exactly-one"
    ? count === 1
    : role.cardinality === "zero-or-one"
      ? count <= 1
      : count >= 1;
  if (!valid) fail(`${role.id} requires ${role.cardinality}; received ${count}.`);
}

function fail(message: string): never {
  throw new KpEquationAssetMigrationV2Error(message);
}
