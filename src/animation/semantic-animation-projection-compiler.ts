import {
  compileKpAnimationAssetSemanticRefs,
  validateKpAnimationAsset,
  type KpAnimationAssetSemanticRefCompilation,
  type KpAnimationAssetValidationIssue
} from "./asset.ts";
import {
  createKpSemanticAnimationCompatibilityAsset,
  type KpSemanticAnimationAssetProjection
} from "./asset-projections.ts";

export function validateKpSemanticAnimationAssetProjection(
  projection: KpSemanticAnimationAssetProjection
): readonly KpAnimationAssetValidationIssue[] {
  return validateKpAnimationAsset(
    createKpSemanticAnimationCompatibilityAsset(projection)
  );
}

export function compileKpSemanticAnimationAssetProjectionRefs(
  projection: KpSemanticAnimationAssetProjection
): KpAnimationAssetSemanticRefCompilation {
  return compileKpAnimationAssetSemanticRefs(
    createKpSemanticAnimationCompatibilityAsset(projection)
  );
}
