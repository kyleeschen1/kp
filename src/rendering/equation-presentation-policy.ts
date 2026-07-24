import type { KpAnimationAsset } from "../animation/asset.ts";
import { resolveKpCancellationPresentation } from "./cancellation-presentation-resolver.ts";
import type {
  KpEquationCancellationPresentationRecipe
} from "../animation/cancellation-presentation-contract.ts";
import {
  decodeKpEquationPresentationProfile
} from "../animation/equation-presentation-profile-decoder.ts";
import type {
  KpEquationContinuantPresentationRecipe,
  KpEquationDepthPresentationRecipe,
  KpEquationMotionPresentationRecipe,
  KpEquationNativeHandoffRecipe,
  KpEquationSuccessorPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "../animation/equation-presentation-profile.ts";

export type KpEquationPresentationRecipe =
  KpEquationMotionPresentationRecipe;

export type {
  KpEquationCancellationPresentationRecipe
} from "../animation/cancellation-presentation-contract.ts";
export type {
  KpEquationContinuantPresentationRecipe,
  KpEquationDepthPresentationRecipe,
  KpEquationSuccessorPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "../animation/equation-presentation-profile.ts";

export interface KpEquationPresentationProfile {
  readonly recipe: KpEquationPresentationRecipe;
  readonly handoff: KpEquationNativeHandoffRecipe;
  readonly cancellation: KpEquationCancellationPresentationRecipe;
  readonly zeroWitness: KpEquationZeroWitnessPresentationRecipe;
  readonly successor: KpEquationSuccessorPresentationRecipe;
  readonly depth: KpEquationDepthPresentationRecipe;
  readonly continuants: KpEquationContinuantPresentationRecipe;
}

export interface KpEquationPresentationPolicy extends KpEquationPresentationProfile {
  readonly applyWitnessedAnnihilation: boolean;
  readonly applySuccessorSynthesis: boolean;
}

export function kpEquationPresentationProfile(
  animation: KpAnimationAsset
): KpEquationPresentationProfile {
  const result = decodeKpEquationPresentationProfile({
    animation,
    resolveCancellation: resolveKpCancellationPresentation
  });
  if (result.status === "rejected") {
    throw new Error(result.diagnostics.map(({ message }) => message).join(" "));
  }
  const payload = result.profile.payload;
  return Object.freeze({
    recipe: payload.motion,
    handoff: payload.nativeHandoff,
    cancellation: payload.cancellation,
    zeroWitness: payload.zeroWitness,
    successor: payload.successor,
    depth: payload.depth,
    continuants: payload.continuants
  });
}

export function kpEquationPresentationPolicy(
  animation: KpAnimationAsset
): KpEquationPresentationPolicy {
  const profile = kpEquationPresentationProfile(animation);
  return Object.freeze({
    ...profile,
    // These compatibility flags keep the existing editor runtime stable while
    // the independent recipes gain dedicated renderers one exemplar at a time.
    applyWitnessedAnnihilation:
      profile.cancellation === "witnessed-annihilation-v1",
    applySuccessorSynthesis:
      profile.successor === "successor-synthesis-v1"
  });
}
