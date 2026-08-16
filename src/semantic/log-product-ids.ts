export const kpLogProductAnimationId =
  "animation.algebra.log-product.product-to-sum" as const;

export const kpMultiFactorLogProductAnimationId =
  "animation.algebra.log-product.three-factors-to-sum" as const;

export type KpLogProductAnimationId =
  | typeof kpLogProductAnimationId
  | typeof kpMultiFactorLogProductAnimationId;

export const kpLogProductAnimationIds = Object.freeze([
  kpLogProductAnimationId,
  kpMultiFactorLogProductAnimationId
] as const);

export function isKpLogProductAnimationId(
  value: string
): value is KpLogProductAnimationId {
  return (kpLogProductAnimationIds as readonly string[]).includes(value);
}
