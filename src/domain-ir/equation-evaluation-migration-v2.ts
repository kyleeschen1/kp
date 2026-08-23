import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  compileKpEquationAssetMigrationV2,
  KpEquationAssetMigrationV2Error,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

export const kpEquationEvaluationMigrationCompilerV2Id =
  "kp.equation-evaluation-migration-compiler.v2" as const;

export interface KpEquationEvaluationMigrationV2 {
  readonly schemaVersion: "kp.equation-evaluation-migration.v2";
  readonly kind: "compiled-equation-evaluation-migration-v2";
  readonly compilerId: typeof kpEquationEvaluationMigrationCompilerV2Id;
  readonly assetId: string;
  readonly operationId: string;
  readonly grammar: KpEquationAssetMigrationV2["grammar"];
  readonly presentationPlan: KpEquationAssetMigrationV2["presentationPlan"];
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
  let migration: KpEquationAssetMigrationV2;
  try {
    migration = compileKpEquationAssetMigrationV2({
      animation: input.animation,
      operations: [{
        transformationId: transformation.id,
        operationId: input.operationId,
        semanticClass: "evaluation",
        roleBindings: input.roleBindings,
        projectionIntent: "replacement"
      }]
    });
  } catch (error) {
    if (error instanceof KpEquationAssetMigrationV2Error) {
      throw new KpEquationEvaluationMigrationV2Error(error.message);
    }
    throw error;
  }
  const transition = only(migration.presentationPlan.transitions,
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
    grammar: migration.grammar,
    presentationPlan: migration.presentationPlan
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

function only<T>(values: readonly T[], message: string): T {
  if (values.length !== 1) {
    throw new KpEquationEvaluationMigrationV2Error(message);
  }
  return values[0]!;
}
