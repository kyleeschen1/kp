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
  type KpCompiledEquationGrammarV2
} from "./equation-grammar-v2.ts";
import {
  compileKpEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2
} from "./equation-presentation-plan-v2.ts";

export const kpEquationEvaluationMigrationCompilerV2Id =
  "kp.equation-evaluation-migration-compiler.v2" as const;

export interface KpEquationEvaluationMigrationV2 {
  readonly schemaVersion: "kp.equation-evaluation-migration.v2";
  readonly kind: "compiled-equation-evaluation-migration-v2";
  readonly compilerId: typeof kpEquationEvaluationMigrationCompilerV2Id;
  readonly assetId: string;
  readonly operationId: string;
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly presentationPlan: KpCompiledEquationPresentationPlanV2;
}

export class KpEquationEvaluationMigrationV2Error extends Error {
  override readonly name = "KpEquationEvaluationMigrationV2Error";
}

/**
 * This is a migration boundary, not a second authoring format. It certifies
 * that one existing semantic asset can enter grammar v2 without importing its
 * renderer, inventing timing, or weakening the canonical operation contract.
 */
export function compileKpEquationEvaluationMigrationV2(input: {
  readonly animation: KpAnimationAsset;
  readonly operationId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
}): KpEquationEvaluationMigrationV2 {
  const transformation = only(input.animation.transformations,
    `${input.animation.id} requires exactly one semantic transformation`);
  const correspondenceMap = transformation.correspondenceMap;
  if (correspondenceMap === undefined) {
    throw new KpEquationEvaluationMigrationV2Error(
      `${transformation.id} requires semantic correspondence.`
    );
  }
  const entry = requiredOperation(input.operationId);
  const pack = kpCanonicalOperationRegistry.packs.find(
    ({ id }) => id === entry.packId
  )!;
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
  validateRoleBindings({
    entry,
    roleBindings: input.roleBindings,
    sourceEntityIds: new Set(sourceEntityIds),
    targetEntityIds: new Set(targetEntityIds)
  });
  const operationPacks = [pack, ...pack.dependencies.map((dependency) => {
    const dependencyPack = kpCanonicalOperationRegistry.packs.find(
      ({ id }) => id === dependency.packId &&
        id !== pack.id && dependency.version.length > 0
    );
    if (dependencyPack === undefined ||
        dependencyPack.version !== dependency.version) {
      throw new KpEquationEvaluationMigrationV2Error(
        `${pack.id} has an unresolved exact dependency ${dependency.packId}@${dependency.version}.`
      );
    }
    return dependencyPack;
  })];
  const transitionId = `transition.${transformation.id}`;
  const grammarResult = compileKpEquationGrammarV2({
    schemaVersion: "kp.equation-grammar.v2",
    id: `grammar.${input.animation.id}.v2`,
    assetId: input.animation.id,
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: input.animation.bundle.id,
      revisionId: `${input.animation.id}@${input.animation.version}`,
      operationPacks: operationPacks.map(({ id, version }) => ({
        packId: id,
        version
      }))
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states: [{
      id: `state.${input.animation.id}.source`,
      objectIds: transformation.sourceObjectIds,
      entityIds: sourceEntityIds
    }, {
      id: `state.${input.animation.id}.target`,
      objectIds: transformation.targetObjectIds,
      entityIds: targetEntityIds
    }],
    transitions: [{
      id: transitionId,
      transformationId: transformation.id,
      sourceStateId: `state.${input.animation.id}.source`,
      targetStateId: `state.${input.animation.id}.target`,
      operation: {
        operationId: input.operationId,
        semanticClass: "evaluation",
        roleBindings: input.roleBindings,
        correspondenceMap,
        semanticAuthorityIds: [
          transformation.id,
          ...(transformation.lawRefs ?? []).map(({ id }) => id)
        ]
      },
      projection: { intent: "replacement" },
      typographyPolicyId: "typography.equation.stage.v2",
      typographyRequirements: { largeOperators: [] },
      teachingIntent: {
        kind: "cause",
        primaryEntityIds: targetEntityIds,
        secondaryEntityIds: sourceEntityIds,
        summary: transformation.title
      }
    }]
  });
  if (grammarResult.status !== "compiled") {
    throw new KpEquationEvaluationMigrationV2Error(
      grammarResult.diagnostics.map(({ message }) => message).join("\n")
    );
  }
  const presentation = compileKpEquationPresentationPlanV2({
    grammar: grammarResult.grammar
  });
  if (presentation.status !== "compiled") {
    throw new KpEquationEvaluationMigrationV2Error(
      presentation.diagnostics.map(({ message }) => message).join("\n")
    );
  }
  const transition = only(presentation.plan.transitions,
    `${input.animation.id} requires one v2 presentation transition`);
  if (transition.evaluationAuthority === undefined ||
      transition.semanticOperation.operationId !== input.operationId ||
      transition.semanticOperation.transformationId !== transformation.id) {
    throw new KpEquationEvaluationMigrationV2Error(
      `${input.animation.id} lost evaluation authority during v2 compilation.`
    );
  }
  return Object.freeze({
    schemaVersion: "kp.equation-evaluation-migration.v2" as const,
    kind: "compiled-equation-evaluation-migration-v2" as const,
    compilerId: kpEquationEvaluationMigrationCompilerV2Id,
    assetId: input.animation.id,
    operationId: input.operationId,
    grammar: grammarResult.grammar,
    presentationPlan: presentation.plan
  });
}

export function compileKpDirectArithmeticEvaluationMigrationV2(
  animation: KpAnimationAsset
): KpEquationEvaluationMigrationV2 {
  const transformation = only(animation.transformations,
    `${animation.id} requires exactly one semantic transformation`);
  const sourceObjects = objectsById(
    animation,
    transformation.sourceObjectIds,
    "source"
  );
  const targetObjects = objectsById(
    animation,
    transformation.targetObjectIds,
    "target"
  );
  const sourceSelectors = sourceObjects.flatMap(({ selectors }) => selectors);
  const targetSelectors = targetObjects.flatMap(({ selectors }) => selectors);
  const operationIds = new Set(
    [...sourceSelectors, ...targetSelectors].map(({ metadata, id }) => {
      const operationId = metadata?.["successorOperationId"];
      if (typeof operationId !== "string") {
        throw new KpEquationEvaluationMigrationV2Error(
          `${animation.id} selector ${id} lacks successor operation authority.`
        );
      }
      return operationId;
    })
  );
  const operationId = only([...operationIds],
    `${animation.id} must declare one direct arithmetic operation`);
  if (!operationId.startsWith("kp.arithmetic.")) {
    throw new KpEquationEvaluationMigrationV2Error(
      `${animation.id} declares non-arithmetic successor ${operationId}.`
    );
  }
  return compileKpEquationEvaluationMigrationV2({
    animation,
    operationId,
    roleBindings: {
      "operands-before": sourceSelectors.map(({ id }) => id),
      "result-after": targetSelectors.map(({ id }) => id)
    }
  });
}

function requiredOperation(operationId: string):
KpCanonicalOperationRegistryEntry {
  const entry = kpCanonicalOperationRegistry.entries.find(
    ({ id }) => id === operationId
  );
  if (entry === undefined) {
    throw new KpEquationEvaluationMigrationV2Error(
      `Unknown canonical evaluation operation ${operationId}.`
    );
  }
  return entry;
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
      throw new KpEquationEvaluationMigrationV2Error(
        `${animation.id} has an unresolved ${endpoint} object ${id}.`
      );
    }
    return object;
  });
}

function validateRoleBindings(input: {
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
    throw new KpEquationEvaluationMigrationV2Error(
      `${input.entry.id} role mismatch; missing [${missing.join(", ")}], ` +
      `unexpected [${unexpected.join(", ")}].`
    );
  }
  for (const role of input.entry.contract.roles) {
    const entityIds = input.roleBindings[role.id]!;
    validateCardinality(role, entityIds.length);
    const endpoint = role.endpoint === "source"
      ? input.sourceEntityIds
      : input.targetEntityIds;
    const foreign = entityIds.filter((id) => !endpoint.has(id));
    if (foreign.length > 0) {
      throw new KpEquationEvaluationMigrationV2Error(
        `${input.entry.id} role ${role.id} binds foreign ${role.endpoint} ` +
        `entities ${foreign.join(", ")}.`
      );
    }
  }
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
  if (!valid) {
    throw new KpEquationEvaluationMigrationV2Error(
      `${role.id} requires ${role.cardinality}; received ${count}.`
    );
  }
}

function only<T>(values: readonly T[], message: string): T {
  if (values.length !== 1) {
    throw new KpEquationEvaluationMigrationV2Error(message);
  }
  return values[0]!;
}
