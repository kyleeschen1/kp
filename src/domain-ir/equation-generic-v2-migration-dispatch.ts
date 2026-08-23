import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEquationAssetMigrationV2 } from
  "./equation-asset-migration-v2.ts";
import { compileKpFunctionWrapMigrationV2 } from
  "./function-wrap-migration-v2.ts";
import { compileKpGeneratedExponentMigrationV2 } from
  "./generated-exponent-migration-v2.ts";

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
  ]
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
