import type { KpAnimationAsset } from "../animation/asset.ts";

export type KpEquationPresentationRecipe =
  | "semantic-material-v2"
  | "continuity-v1";

export interface KpEquationPresentationPolicy {
  readonly recipe: KpEquationPresentationRecipe;
  readonly applyWitnessedAnnihilation: boolean;
  readonly applySuccessorSynthesis: boolean;
}

const defaultPolicy: KpEquationPresentationPolicy = {
  recipe: "semantic-material-v2",
  applyWitnessedAnnihilation: true,
  applySuccessorSynthesis: true
};

const continuityPolicy: KpEquationPresentationPolicy = {
  recipe: "continuity-v1",
  applyWitnessedAnnihilation: false,
  applySuccessorSynthesis: false
};

export function kpEquationPresentationPolicy(
  animation: KpAnimationAsset
): KpEquationPresentationPolicy {
  const recipe = animation.metadata?.["equationMotionPresentationRecipe"];
  if (recipe === undefined || recipe === "semantic-material-v2") {
    return defaultPolicy;
  }
  if (recipe === "continuity-v1") return continuityPolicy;
  throw new Error(`Unknown equation motion presentation recipe ${String(recipe)}.`);
}

