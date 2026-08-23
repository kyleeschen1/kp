import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEquationAssetMigrationV2 } from
  "./equation-asset-migration-v2.ts";
import { compileKpFunctionWrapMigrationV2 } from
  "./function-wrap-migration-v2.ts";
import { compileKpFractionRootMigrationV2 } from
  "./fraction-root-migration-v2.ts";
import { compileKpGeneratedExponentMigrationV2 } from
  "./generated-exponent-migration-v2.ts";
import { compileKpLinearOperationMigrationV2 } from
  "./linear-operation-migration-v2.ts";
import { compileKpTerminalEquationMigrationV2 } from
  "./terminal-equation-migration-v2.ts";

type Compiler = (animation: KpAnimationAsset) =>
  KpEquationAssetMigrationV2;

const compilers = new Map<string, Compiler>([
  [
    "animation.generated.exponent.square-as-product",
    compileKpGeneratedExponentMigrationV2
  ],
  [
    "animation.generated.function-wrap.apply-f",
    compileKpFunctionWrapMigrationV2
  ],
  ...[
    "animation.generated.cancellation.additive-inverses",
    "animation.generated.distribution.expand-a-sum",
    "animation.generated.distribution.factor-common-a",
    "animation.generated.linear-solve.linear-68c15d41",
    "animation.linear-solve.solve-x"
  ].map((assetId): [string, Compiler] => [
    assetId,
    compileKpLinearOperationMigrationV2
  ]),
  ...[
    "animation.generated.fraction-expression.two-fourths",
    "animation.generated.radical.square-root-as-power"
  ].map((assetId): [string, Compiler] => [
    assetId,
    compileKpFractionRootMigrationV2
  ]),
  ...[
    "animation.comparison.jacobian-hessian",
    "animation.comparison.linear-solve-programming",
    "animation.generated.calculus.derivative.sum-rule-polynomial",
    "animation.generated.calculus.integral.power-rule-quadratic",
    "animation.generated.linear-algebra.dot-product.three-vector",
    "animation.generated.linear-algebra.matrix-matrix.two-by-two",
    "animation.generated.linear-algebra.matrix-vector.two-by-two",
    "animation.generated.substitute-three",
    "animation.inequality.sign-flip.basic",
    "animation.sample.fourier-transform-pair",
    "animation.sample.fundamental-theorem-calculus"
  ].map((assetId): [string, Compiler] => [
    assetId,
    compileKpTerminalEquationMigrationV2
  ])
]);
const cache = new WeakMap<KpAnimationAsset, KpEquationAssetMigrationV2>();

/** Generic-surface migrations stay data-driven and asset-scoped. */
export function requireKpGenericEquationMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 | undefined {
  const compiler = compilers.get(animation.id);
  if (compiler === undefined) return undefined;
  const cached = cache.get(animation);
  if (cached !== undefined) return cached;
  const migration = compiler(animation);
  cache.set(animation, migration);
  return migration;
}
