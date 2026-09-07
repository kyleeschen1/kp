import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  kpCanonicalLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";
import {
  requireKpEquationMigrationTransformation
} from "./equation-asset-migration-role-bindings-v2.ts";

export function compileKpLogarithmChangeOfBaseMigrationV2(
  animation: KpAnimationAsset,
  semantic = kpCanonicalLogarithmChangeOfBase
): KpEquationAssetMigrationV2 {
  const transformation = requireKpEquationMigrationTransformation(
    animation,
    semantic.id
  );
  return compileKpEquationAssetMigrationV2({
    animation,
    operations: [{
      transformationId: transformation.id,
      operationId: "kp.algebra.change-logarithm-base",
      semanticClass: "transformation",
      roleBindings: {
        "source-application": [
          semantic.source.applicationEntityId,
          semantic.source.operatorEntityId,
          semantic.source.base.entityId,
          semantic.source.argument.entityId
        ],
        "target-quotient": [
          semantic.target.quotientEntityId,
          semantic.target.divisionEntityId,
          semantic.target.numerator.applicationEntityId,
          semantic.target.numerator.operatorEntityId,
          semantic.target.numerator.argument.entityId,
          semantic.target.denominator.applicationEntityId,
          semantic.target.denominator.operatorEntityId,
          semantic.target.denominator.argument.entityId
        ]
      },
      projectionIntent: "replacement"
    }]
  });
}
