import type { KpAnimationAsset } from "../animation/asset.ts";

export type KpEquationPresentationRecipe =
  | "semantic-material-v2"
  | "continuity-v1";

export type KpEquationCancellationPresentationRecipe =
  | "native-handoff-v1"
  | "witnessed-annihilation-v1"
  | "counter-orbit-v1";

export type KpEquationZeroWitnessPresentationRecipe =
  | "none"
  | "embedded-v1"
  | "independent-zero-v1";

export type KpEquationSuccessorPresentationRecipe =
  | "native-handoff-v1"
  | "successor-synthesis-v1"
  | "convergence-v1";

export type KpEquationDepthPresentationRecipe =
  | "flat-v1"
  | "semantic-depth-v1";

export interface KpEquationPresentationProfile {
  readonly recipe: KpEquationPresentationRecipe;
  readonly cancellation: KpEquationCancellationPresentationRecipe;
  readonly zeroWitness: KpEquationZeroWitnessPresentationRecipe;
  readonly successor: KpEquationSuccessorPresentationRecipe;
  readonly depth: KpEquationDepthPresentationRecipe;
}

export interface KpEquationPresentationPolicy extends KpEquationPresentationProfile {
  readonly applyWitnessedAnnihilation: boolean;
  readonly applySuccessorSynthesis: boolean;
}

const defaultProfile: KpEquationPresentationProfile = {
  recipe: "semantic-material-v2",
  cancellation: "witnessed-annihilation-v1",
  zeroWitness: "embedded-v1",
  successor: "successor-synthesis-v1",
  depth: "flat-v1"
};

const continuityProfile: KpEquationPresentationProfile = {
  recipe: "continuity-v1",
  cancellation: "native-handoff-v1",
  zeroWitness: "none",
  successor: "native-handoff-v1",
  depth: "flat-v1"
};

export function kpEquationPresentationProfile(
  animation: KpAnimationAsset
): KpEquationPresentationProfile {
  const recipe = readRecipe(
    animation,
    "equationMotionPresentationRecipe",
    ["semantic-material-v2", "continuity-v1"] as const,
    "semantic-material-v2"
  );
  const baseline = recipe === "continuity-v1" ? continuityProfile : defaultProfile;
  return Object.freeze({
    recipe,
    cancellation: readRecipe(
      animation,
      "equationCancellationPresentationRecipe",
      ["native-handoff-v1", "witnessed-annihilation-v1", "counter-orbit-v1"] as const,
      baseline.cancellation
    ),
    zeroWitness: readRecipe(
      animation,
      "equationZeroWitnessPresentationRecipe",
      ["none", "embedded-v1", "independent-zero-v1"] as const,
      baseline.zeroWitness
    ),
    successor: readRecipe(
      animation,
      "equationSuccessorPresentationRecipe",
      ["native-handoff-v1", "successor-synthesis-v1", "convergence-v1"] as const,
      baseline.successor
    ),
    depth: readRecipe(
      animation,
      "equationDepthPresentationRecipe",
      ["flat-v1", "semantic-depth-v1"] as const,
      baseline.depth
    )
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

function readRecipe<const TRecipe extends string>(
  animation: KpAnimationAsset,
  key: string,
  allowed: readonly TRecipe[],
  fallback: TRecipe
): TRecipe {
  const value = animation.metadata?.[key];
  if (value === undefined) return fallback;
  if (typeof value === "string" && allowed.includes(value as TRecipe)) {
    return value as TRecipe;
  }
  throw new Error(`Unknown ${key} recipe ${String(value)}.`);
}
