import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";
import {
  listKpEquationMigrationEndpointEntityIds,
  requireKpEquationMigrationTransformation
} from "./equation-asset-migration-role-bindings-v2.ts";

export function compileKpLogQuotientMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  const transformation = requireKpEquationMigrationTransformation(
    animation,
    kpCanonicalCompiledLogQuotientOperation.transformation.id
  );
  return compileKpEquationAssetMigrationV2({
    animation,
    operations: [{
      transformationId: transformation.id,
      operationId: "kp.semantic-motion.log-quotient",
      semanticClass: "transformation",
      roleBindings: {
        "source-difference": listKpEquationMigrationEndpointEntityIds({
          animation,
          transformation,
          endpoint: "source"
        }),
        "target-quotient": listKpEquationMigrationEndpointEntityIds({
          animation,
          transformation,
          endpoint: "target"
        })
      },
      projectionIntent: "replacement"
    }]
  });
}
