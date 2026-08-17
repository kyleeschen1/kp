import type {
  KpNativeKatexHorizontalSqueezeTreatment
} from "./native-katex-function-wrap-reception.ts";

export interface KpNativeKatexLogProductHomomorphicProfile {
  readonly id: "profile.native-katex.log-product.homomorphic-decomposition.v1";
  readonly operatorPointScale: number;
  readonly horizontalSqueeze: KpNativeKatexHorizontalSqueezeTreatment;
}

/**
 * Native KaTeX owns optical geometry, but every log-product cardinality must
 * read as the same motif. Keeping its treatment here makes later tuning
 * propagate without leaking renderer measurements into semantic plans.
 */
export const kpNativeKatexLogProductHomomorphicProfile = Object.freeze({
  id: "profile.native-katex.log-product.homomorphic-decomposition.v1" as const,
  operatorPointScale: 0.04,
  horizontalSqueeze: Object.freeze({
    outwardOffsetInNativeHeights: 0.46
  })
}) satisfies KpNativeKatexLogProductHomomorphicProfile;
