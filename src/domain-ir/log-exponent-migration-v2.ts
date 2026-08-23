import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../semantic/log-exponent-transformation-tree.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";
import {
  listKpEquationMigrationCorrespondenceEntityIds,
  listKpEquationMigrationEndpointEntityIds,
  requireKpEquationMigrationTransformation
} from "./equation-asset-migration-role-bindings-v2.ts";

const operationIds = Object.freeze({
  applyNaturalLogBothSides: "kp.algebra.apply-natural-log-both-sides",
  extractLogPowerExponent: "kp.algebra.extract-log-power-exponent",
  divideBothSidesByLogBase: "kp.algebra.divide-both-sides-by-log-base"
} as const);

export function compileKpLogExponentMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  const operations = kpCanonicalLogExponentTransformationTree.operations.map(
    ({ transformation }) => {
      const assetTransformation = requireKpEquationMigrationTransformation(
        animation,
        transformation.id
      );
      const source = listKpEquationMigrationEndpointEntityIds({
        animation,
        transformation: assetTransformation,
        endpoint: "source"
      });
      const target = listKpEquationMigrationEndpointEntityIds({
        animation,
        transformation: assetTransformation,
        endpoint: "target"
      });
      if (transformation.transformType === "applyNaturalLogBothSides") {
        return {
          transformationId: transformation.id,
          operationId: operationIds.applyNaturalLogBothSides,
          semanticClass: "transformation" as const,
          roleBindings: {
            "equation-before": source,
            "equation-after": target,
            "log-wrappers-after":
              listKpEquationMigrationCorrespondenceEntityIds({
                transformation: assetTransformation,
                relations: ["introduction"],
                endpoint: "target"
              })
          },
          projectionIntent: "replacement" as const
        };
      }
      if (transformation.transformType === "extractLogPowerExponent") {
        return {
          transformationId: transformation.id,
          operationId: operationIds.extractLogPowerExponent,
          semanticClass: "transformation" as const,
          roleBindings: {
            "logged-power-before": source,
            "extracted-product-after": target
          },
          projectionIntent: "replacement" as const
        };
      }
      if (transformation.transformType === "divideBothSidesByLogBase") {
        return {
          transformationId: transformation.id,
          operationId: operationIds.divideBothSidesByLogBase,
          semanticClass: "transformation" as const,
          roleBindings: {
            "product-equation-before": source,
            "quotient-equation-after": target
          },
          projectionIntent: "replacement" as const
        };
      }
      throw new Error(
        `Unsupported log-exponent transformation ${transformation.transformType}.`
      );
    }
  );
  return compileKpEquationAssetMigrationV2({ animation, operations });
}
