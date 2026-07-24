import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  inferKpCancellationPresentationIntent,
  kpCancellationOperationIdForTransformType,
  kpCancellationTeachingGoalMetadataKey,
  type KpCancellationTeachingGoal
} from "../semantic/cancellation-presentation-authoring.ts";
import { resolveKpCancellationPresentation } from "./cancellation-presentation-resolver.ts";
import type {
  KpEquationCancellationPresentationRecipe
} from "../animation/cancellation-presentation-contract.ts";
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

const defaultProfile: KpEquationPresentationProfile = {
  recipe: "semantic-material-v2",
  handoff: "crossfade-v1",
  cancellation: "witnessed-annihilation-v1",
  zeroWitness: "embedded-v1",
  successor: "successor-synthesis-v1",
  depth: "flat-v1",
  continuants: "concurrent-v1"
};

const continuityProfile: KpEquationPresentationProfile = {
  recipe: "continuity-v1",
  handoff: "crossfade-v1",
  cancellation: "native-handoff-v1",
  zeroWitness: "none",
  successor: "native-handoff-v1",
  depth: "flat-v1",
  continuants: "concurrent-v1"
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
    handoff: readRecipe(
      animation,
      "equationNativeHandoffRecipe",
      ["crossfade-v1", "atomic-v1"] as const,
      baseline.handoff
    ),
    cancellation: inferredCancellationRecipe(animation) ?? readRecipe(
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
      [
        "native-handoff-v1",
        "successor-synthesis-v1",
        "convergence-v1",
        "counter-convergence-v1"
      ] as const,
      baseline.successor
    ),
    depth: readRecipe(
      animation,
      "equationDepthPresentationRecipe",
      ["flat-v1", "semantic-depth-v1"] as const,
      baseline.depth
    ),
    continuants: readRecipe(
      animation,
      "equationContinuantPresentationRecipe",
      ["concurrent-v1", "reserve-then-transit-v1", "transit-then-reflow-v1"] as const,
      baseline.continuants
    )
  });
}

function inferredCancellationRecipe(
  animation: KpAnimationAsset
): KpEquationCancellationPresentationRecipe | undefined {
  const goalValue = animation.metadata?.[kpCancellationTeachingGoalMetadataKey];
  if (goalValue === undefined) return undefined;
  if (animation.metadata?.["equationCancellationPresentationRecipe"] !== undefined) {
    throw new Error(
      "Cancellation authoring cannot combine a teaching goal with a renderer recipe id."
    );
  }
  if (goalValue !== "preserve-flow" && goalValue !== "make-identity-visible") {
    throw new Error(`Unknown cancellation teaching goal ${String(goalValue)}.`);
  }
  const teachingGoal: KpCancellationTeachingGoal = goalValue;
  const operationIds = animation.transformations.flatMap((transformation) => {
    const operationId = kpCancellationOperationIdForTransformType(
      transformation.transformType
    );
    return operationId === undefined ? [] : [operationId];
  });
  if (operationIds.length === 0) {
    throw new Error(
      `Animation ${animation.id} declares cancellation teaching intent without a cancellation transform.`
    );
  }
  const recipes = operationIds.map((operationId) => {
    const result = resolveKpCancellationPresentation({
      intent: inferKpCancellationPresentationIntent({ operationId, teachingGoal }),
      // Asset-level policy is deliberately conservative. Runtime measurement
      // may prove a shared baseline, but only a two-axis-safe recipe is valid
      // before geometry exists.
      topology: { sourceCount: 2, sourceBaselines: "distinct" }
    });
    if (result.kind !== "resolved") {
      throw new Error(
        `Cancellation policy for ${animation.id} requires ${result.kind}.`
      );
    }
    return result.recipe;
  });
  const recipe = recipes[0]!;
  if (recipes.some((candidate) => candidate !== recipe)) {
    throw new Error(`Animation ${animation.id} has incompatible cancellation intents.`);
  }
  return recipe;
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
