import type { KpAnimationAsset } from "../animation/asset.ts";
import type {
  KpExponentialHomomorphismCorrespondenceAuthority
} from "../semantic/exponential-homomorphism-correspondence.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

export function compileKpExponentialHomomorphismMigrationV2(input: {
  readonly animation: KpAnimationAsset;
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly operationId:
    | "operation.equation.exponential-sum-to-product.v1"
    | "operation.equation.exponential-difference-to-quotient.v1";
}): KpEquationAssetMigrationV2 {
  const transformation = input.animation.transformations[0];
  if (input.animation.transformations.length !== 1 ||
      transformation?.transformType !== input.operationId) {
    throw new Error(
      `${input.animation.id} does not expose ${input.operationId}.`
    );
  }
  const sourcePower = input.authority.occurrences
    .filter(({ endpoint }) => endpoint === "source")
    .map(({ id }) => id);
  const targetPowers = input.authority.occurrences
    .filter(({ endpoint, role }) => endpoint === "target" &&
      role !== "combination-root" && role !== "combination-connector")
    .map(({ id }) => id);
  const targetCombination = input.authority.occurrences
    .filter(({ endpoint, role }) => endpoint === "target" &&
      (role === "combination-root" || role === "combination-connector"))
    .map(({ id }) => id);
  return compileKpEquationAssetMigrationV2({
    animation: input.animation,
    operations: [{
      transformationId: transformation.id,
      operationId: input.operationId,
      semanticClass: "transformation",
      roleBindings: {
        "source-power": sourcePower,
        "target-powers": targetPowers,
        "target-combination": targetCombination
      },
      projectionIntent: "replacement"
    }]
  });
}
