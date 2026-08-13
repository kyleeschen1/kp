import type { KpAnimationAsset } from "./asset.ts";
import type {
  KpEquationCancellationPresentationRecipe
} from "./cancellation-presentation-contract.ts";
import type {
  KpEquationContinuantPresentationRecipe,
  KpEquationDepthPresentationRecipe,
  KpEquationMotionPresentationRecipe,
  KpEquationNativeHandoffRecipe,
  KpEquationPresentationProfileV1,
  KpEquationSuccessorPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "./equation-presentation-profile.ts";
import {
  validateKpEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import type {
  KpBalancedBranchPresentationStrategy
} from "./equation-balanced-branch-scheduling.ts";

export type KpEquationPresentationRecipe =
  KpEquationMotionPresentationRecipe;

export type {
  KpEquationCancellationPresentationRecipe
} from "./cancellation-presentation-contract.ts";
export type {
  KpEquationContinuantPresentationRecipe,
  KpEquationDepthPresentationRecipe,
  KpEquationSuccessorPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "./equation-presentation-profile.ts";

export interface KpEquationPresentationProfile {
  readonly recipe: KpEquationPresentationRecipe;
  readonly handoff: KpEquationNativeHandoffRecipe;
  readonly cancellation: KpEquationCancellationPresentationRecipe;
  readonly zeroWitness: KpEquationZeroWitnessPresentationRecipe;
  readonly successor: KpEquationSuccessorPresentationRecipe;
  readonly depth: KpEquationDepthPresentationRecipe;
  readonly continuants: KpEquationContinuantPresentationRecipe;
}

export interface KpEquationPresentationPolicy
  extends KpEquationPresentationProfile {
  readonly applyWitnessedAnnihilation: boolean;
  readonly applySuccessorSynthesis: boolean;
}

export function requireKpEquationPresentationProfile(
  animation: KpAnimationAsset
): KpEquationPresentationProfileV1 {
  const profile = animation.presentationProfile;
  if (profile === undefined || profile.domain !== "equation") {
    throw new Error(
      `Animation ${animation.id} has an equation surface but no typed equation presentation profile.`
    );
  }
  const issues = validateKpEquationPresentationProfileV1(profile);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  return profile;
}

export function kpEquationPresentationProfile(
  animation: KpAnimationAsset
): KpEquationPresentationProfile {
  const payload = requireKpEquationPresentationProfile(animation).payload;
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
    applyWitnessedAnnihilation:
      profile.cancellation === "witnessed-annihilation-v1",
    applySuccessorSynthesis:
      profile.successor === "successor-synthesis-v1"
  });
}

export function resolveKpEquationPresentationBranchStrategy(
  animation: KpAnimationAsset
): KpBalancedBranchPresentationStrategy | undefined {
  return requireKpEquationPresentationProfile(animation)
    .payload.branchStrategy;
}
