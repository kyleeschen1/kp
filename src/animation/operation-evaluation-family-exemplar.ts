export const kpOperationEvaluationFamilyIds = [
  "punctuated-substitution",
  "result-reception",
  "contributor-fusion"
] as const;

export type KpOperationEvaluationFamilyId =
  (typeof kpOperationEvaluationFamilyIds)[number];

export type KpOperationEvaluationHandoffKind =
  | "discrete-cut"
  | "progressive-replacement"
  | "contact-occlusion";

interface KpOperationEvaluationFamilyRecipeBase {
  readonly kind: "operation-evaluation-family-exemplar-recipe";
  readonly status: "provisional-human-checkpoint";
  readonly id: string;
  readonly family: KpOperationEvaluationFamilyId;
  readonly label: string;
  readonly summary: string;
}

export type KpOperationEvaluationFamilyRecipe =
  | (KpOperationEvaluationFamilyRecipeBase & {
      readonly family: "punctuated-substitution";
      readonly handoff: "discrete-cut";
      readonly punctuationStart: number;
      readonly punctuationPeak: number;
      readonly replacementAt: number;
    })
  | (KpOperationEvaluationFamilyRecipeBase & {
      readonly family: "result-reception";
      readonly handoff: "progressive-replacement";
      readonly sourceProgressRange: readonly [number, number];
      readonly resultLead: number;
    })
  | (KpOperationEvaluationFamilyRecipeBase & {
      readonly family: "contributor-fusion";
      readonly handoff: "contact-occlusion";
      readonly synthesisSampling: "canonical-successor";
    });

/**
 * These recipes are review evidence, not catalogue authority. Keeping their
 * family/handoff pairing closed prevents a visual experiment from silently
 * becoming the default operation-evaluation compiler.
 */
export const kpOperationEvaluationFamilyExemplarRecipes:
readonly KpOperationEvaluationFamilyRecipe[] = Object.freeze([
  Object.freeze({
    kind: "operation-evaluation-family-exemplar-recipe" as const,
    status: "provisional-human-checkpoint" as const,
    id: "kp.evaluation-recipe.punctuated-substitution.review-v1",
    family: "punctuated-substitution" as const,
    handoff: "discrete-cut" as const,
    label: "Punctuated substitution",
    summary:
      "Hold the expression, signal a completed evaluation, then substitute " +
      "the result at one stable anchor without implying material lineage.",
    punctuationStart: 0.24,
    punctuationPeak: 0.46,
    replacementAt: 0.62
  }),
  Object.freeze({
    kind: "operation-evaluation-family-exemplar-recipe" as const,
    status: "provisional-human-checkpoint" as const,
    id: "kp.evaluation-recipe.result-reception.review-v1",
    family: "result-reception" as const,
    handoff: "progressive-replacement" as const,
    label: "Result reception",
    summary:
      "Let the native result destination receive attention slightly before " +
      "the contributors finish their handoff.",
    sourceProgressRange: Object.freeze([0.1, 0.92] as const),
    resultLead: 0.1
  }),
  Object.freeze({
    kind: "operation-evaluation-family-exemplar-recipe" as const,
    status: "provisional-human-checkpoint" as const,
    id: "kp.evaluation-recipe.contributor-fusion.review-v1",
    family: "contributor-fusion" as const,
    handoff: "contact-occlusion" as const,
    label: "Contributor fusion",
    summary:
      "Gather both operands and the operator into one bounded contact before " +
      "the result becomes recognizable.",
    synthesisSampling: "canonical-successor" as const
  })
]);

const recipeByFamily = new Map(
  kpOperationEvaluationFamilyExemplarRecipes.map((recipe) => [
    recipe.family,
    recipe
  ])
);

export function resolveKpOperationEvaluationFamilyExemplarRecipe(
  family: KpOperationEvaluationFamilyId
): KpOperationEvaluationFamilyRecipe {
  const recipe = recipeByFamily.get(family);
  if (recipe === undefined) {
    throw new Error(`Unknown operation-evaluation family ${family}.`);
  }
  return recipe;
}

export function isKpOperationEvaluationFamilyId(
  value: string
): value is KpOperationEvaluationFamilyId {
  return kpOperationEvaluationFamilyIds.some((family) => family === value);
}
