import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpCompiledLogProductSemanticMotionBundle } from
  "../semantic/log-product-semantic-motion.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

export function compileKpLogProductMigrationV2(input: {
  readonly animation: KpAnimationAsset;
  readonly semanticMotion: KpCompiledLogProductSemanticMotionBundle;
}): KpEquationAssetMigrationV2 {
  const request = input.semanticMotion.request;
  if (request.assetId !== input.animation.id) {
    throw new Error(
      `${input.animation.id} cannot consume ${request.assetId} log-product authority.`
    );
  }
  return compileKpEquationAssetMigrationV2({
    animation: input.animation,
    operations: [{
      transformationId: request.operation.transformationId,
      operationId: request.operation.operationId,
      semanticClass: "transformation",
      roleBindings: request.operation.roleBindings,
      projectionIntent: "replacement"
    }]
  });
}
