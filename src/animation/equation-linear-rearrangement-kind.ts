import type {
  KpEquationOperationPlanRecipeId
} from "../domain-ir/equation-surface-family-declarations.ts";

export type KpEquationLinearRearrangementKind =
  | "balanced-introduction"
  | "divide-both-sides"
  | "certified-fraction-transfer"
  | "split-fraction-sum"
  | "merge-fractions"
  | "cancel-additive-inverses"
  | "cancel-multiplicative-inverses"
  | "simplify-constant-difference"
  | "simplify-constant-quotient"
  | "simplify-constant-product";

export interface KpEquationLinearRearrangementDeclaration {
  readonly transformType: string;
  readonly kind: KpEquationLinearRearrangementKind;
  readonly recipeId: Extract<
    KpEquationOperationPlanRecipeId,
    "recipe.operation-plan.linear-rearrangement.v1"
  >;
  /**
   * The legacy equation surface creates one sequence if any trigger is
   * present, then includes every declared rearrangement step in that asset.
   * Keeping the trigger distinct preserves that behavior during migration.
   */
  readonly activatesLegacySurfaceSequence: boolean;
}

export const kpEquationLinearRearrangementDeclarations:
readonly KpEquationLinearRearrangementDeclaration[] = Object.freeze([
  rearrangement("subtractBothSides", "balanced-introduction", true),
  rearrangement("multiplyBothSides", "balanced-introduction", false),
  rearrangement("applyNaturalLogBothSides", "balanced-introduction", false),
  rearrangement("divideBothSides", "divide-both-sides", false),
  rearrangement(
    "projectCertifiedFractionTransfer",
    "certified-fraction-transfer",
    false
  ),
  rearrangement("splitFractionSum", "split-fraction-sum", false),
  rearrangement("mergeFractions", "merge-fractions", false),
  rearrangement("cancelAdditiveInverses", "cancel-additive-inverses", true),
  rearrangement(
    "cancelMultiplicativeInverses",
    "cancel-multiplicative-inverses",
    false
  ),
  rearrangement(
    "simplifyConstantDifference",
    "simplify-constant-difference",
    true
  ),
  rearrangement(
    "simplifyConstantQuotient",
    "simplify-constant-quotient",
    false
  ),
  rearrangement(
    "simplifyConstantProduct",
    "simplify-constant-product",
    false
  )
]);

const rearrangementByTransformType = Object.freeze(Object.fromEntries(
  kpEquationLinearRearrangementDeclarations.map((entry) => [
    entry.transformType,
    entry
  ])
)) as Readonly<Record<string, KpEquationLinearRearrangementDeclaration>>;

export function kpEquationLinearRearrangementKindForTransformType(
  transformType: string
): KpEquationLinearRearrangementKind | undefined {
  return rearrangementByTransformType[transformType]?.kind;
}

export function kpEquationLinearRearrangementActivatesLegacySurface(
  transformType: string
): boolean {
  return rearrangementByTransformType[transformType]
    ?.activatesLegacySurfaceSequence ?? false;
}

function rearrangement(
  transformType: string,
  kind: KpEquationLinearRearrangementKind,
  activatesLegacySurfaceSequence: boolean
): KpEquationLinearRearrangementDeclaration {
  return Object.freeze({
    transformType,
    kind,
    recipeId: "recipe.operation-plan.linear-rearrangement.v1",
    activatesLegacySurfaceSequence
  });
}
