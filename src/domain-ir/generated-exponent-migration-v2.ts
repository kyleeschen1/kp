import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpAssetSelector } from "../semantic/asset.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationOperationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

export function compileKpGeneratedExponentMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  const operations = animation.transformations.map((transformation) => {
    const source = selectors(animation, transformation.sourceObjectIds);
    const target = selectors(animation, transformation.targetObjectIds);
    if (transformation.transformType === "lowerExponent") {
      return operation({
        transformationId: transformation.id,
        operationId: "kp.algebra.lower-exponent",
        roleBindings: {
          "base-before": ids(source, "term"),
          "exponent-before": ids(source, "exponent"),
          "base-descendants": target
            .filter(({ kind }) => kind === "factor" || kind === "term")
            .map(({ id }) => id),
          "exponent-descendants": target
            .filter(({ kind }) => kind === "exponent" || kind === "operator")
            .map(({ id }) => id)
        }
      });
    }
    if (transformation.transformType === "unwrapUnitExponent") {
      return operation({
        transformationId: transformation.id,
        operationId: "kp.algebra.unwrap-unit-exponent",
        roleBindings: {
          "factors-before": source
            .filter(({ kind }) => kind === "factor" || kind === "term")
            .map(({ id }) => id),
          "product-operators-before": ids(source, "operator"),
          "unit-exponent": ids(source, "exponent"),
          "factors-after": ids(target, "factor"),
          "product-operators-after": ids(target, "operator")
        }
      });
    }
    throw new Error(
      `${animation.id} has unsupported exponent transform ${transformation.transformType}.`
    );
  });
  return compileKpEquationAssetMigrationV2({ animation, operations });
}

function operation(input: {
  readonly transformationId: string;
  readonly operationId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
}): KpEquationAssetMigrationOperationV2 {
  return {
    ...input,
    semanticClass: "transformation",
    projectionIntent: "replacement"
  };
}

function selectors(animation: KpAnimationAsset, objectIds: readonly string[]) {
  return objectIds.flatMap((objectId) => {
    const object = animation.bundle.objects.find(({ id }) => id === objectId);
    if (object === undefined) throw new Error(`Missing object ${objectId}.`);
    return object.selectors;
  });
}

function ids(
  selectors: readonly KpAssetSelector[],
  kind: string
): readonly string[] {
  return selectors.filter((selector) => selector.kind === kind)
    .map(({ id }) => id);
}
