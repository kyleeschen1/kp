import {
  createKpAnimationAsset,
  type CreateKpAnimationAssetInput,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpEquationLinearRearrangementKindForTransformType
} from "./equation-linear-rearrangement-kind.ts";

export type CreateKpCanonicalBalancedSolveAnimationAssetInput =
  Omit<CreateKpAnimationAssetInput, "presentationProfile"> & {
    /**
     * The profile is factory-owned so callers cannot split synchronized
     * branch entry from the counter-orbit cancellation that completes it.
     */
    readonly presentationProfile?: never;
  };

export function createKpCanonicalBalancedSolveAnimationAsset(
  input: CreateKpCanonicalBalancedSolveAnimationAssetInput
): KpAnimationAsset {
  const kinds = input.transformations.map(({ transformType }) =>
    kpEquationLinearRearrangementKindForTransformType(transformType)
  );
  if (!kinds.includes("balanced-introduction")) {
    throw new Error(
      `Canonical balanced solve animation ${input.id} requires a balanced introduction.`
    );
  }
  if (
    !kinds.includes("cancel-additive-inverses") &&
    !kinds.includes("cancel-multiplicative-inverses")
  ) {
    throw new Error(
      `Canonical balanced solve animation ${input.id} requires inverse cancellation.`
    );
  }
  return createKpAnimationAsset({
    ...input,
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1()
  });
}
