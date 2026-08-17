import { kpAlgebraChoreographyCapabilities } from
  "../algebra-choreography-capabilities.ts";
import type { KpAnimationAsset } from "../asset.ts";
import { createLinearSolveAnimationAsset } from
  "../linear-solve-adapter.ts";
import type { KpAnimationRuntimeCapabilities } from
  "../runtime-capabilities.ts";
import { createKpVerifiedGeneratedLinearSolveRuntimeAsset } from
  "../verified-generated-linear-solve-runtime-asset.ts";

export interface KpAlgebraLinearSolveAnimationPack {
  readonly catalog: readonly KpAnimationAsset[];
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
}

export function createKpAlgebraLinearSolveAnimationPack():
KpAlgebraLinearSolveAnimationPack {
  return Object.freeze({
    catalog: Object.freeze([
      createLinearSolveAnimationAsset(),
      createKpVerifiedGeneratedLinearSolveRuntimeAsset()
    ]),
    runtimeCapabilities: kpAlgebraChoreographyCapabilities
  });
}

