import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  requireKpFunctionWrapAssetBinding
} from "../animation/function-wrap-asset-binding.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

export function compileKpFunctionWrapMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  const binding = requireKpFunctionWrapAssetBinding(animation);
  return compileKpEquationAssetMigrationV2({
    animation,
    operations: [{
      transformationId: binding.transformationId,
      operationId: "kp.algebra.wrap-function",
      semanticClass: "transformation",
      roleBindings: {
        "content-before": binding.sourceArgumentEntityIds,
        "content-after": binding.targetArgumentEntityIds,
        wrapper: binding.wrapperEntityIds
      },
      projectionIntent: "replacement"
    }]
  });
}
