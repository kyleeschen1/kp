import type {
  KpEquationOperationPlanRecipeId,
  KpEquationStructuralRecipeId
} from "../domain-ir/equation-surface-family-declarations.ts";
import type {
  KpExponentLawChoreographyKind
} from "./exponent-law-choreography.ts";
import type {
  KpFractionChoreographyKind
} from "./fraction-choreography.ts";
import type {
  KpIdentityAbsorptionChoreographyKind
} from "./identity-absorption-choreography.ts";

export type KpEquationStructuralChoreographyChannel =
  | "dot-product-traversal"
  | "exponent-law"
  | "fraction-material"
  | "function-wrap"
  | "identity-absorption"
  | "matrix-matrix-composition"
  | "matrix-vector-composition"
  | "radical-succession";

export type KpEquationStructuralOperationKind =
  | KpExponentLawChoreographyKind
  | KpFractionChoreographyKind
  | KpIdentityAbsorptionChoreographyKind;

interface KpEquationStructuralChoreographyDeclarationBase {
  readonly transformType: string;
  readonly recipeId:
    | KpEquationOperationPlanRecipeId
    | KpEquationStructuralRecipeId;
}

export type KpEquationStructuralChoreographyDeclaration =
  | (KpEquationStructuralChoreographyDeclarationBase & {
      readonly channel: "fraction-material";
      readonly operationKind: KpFractionChoreographyKind;
    })
  | (KpEquationStructuralChoreographyDeclarationBase & {
      readonly channel: "exponent-law";
      readonly operationKind: KpExponentLawChoreographyKind;
    })
  | (KpEquationStructuralChoreographyDeclarationBase & {
      readonly channel: "identity-absorption";
      readonly operationKind: KpIdentityAbsorptionChoreographyKind;
    })
  | (KpEquationStructuralChoreographyDeclarationBase & {
      readonly channel: Exclude<
        KpEquationStructuralChoreographyChannel,
        "fraction-material" | "exponent-law" | "identity-absorption"
      >;
      readonly operationKind?: undefined;
    });

export const kpEquationStructuralChoreographyDeclarations:
readonly KpEquationStructuralChoreographyDeclaration[] = Object.freeze([
  structural("wrapFunction", "function-wrap",
    "recipe.equation.function-application.v1"),
  structural("rewritePowerAsRoot", "radical-succession",
    "recipe.equation.radical-succession.v1"),
  structuralOperation("splitFractionFactors", "fraction-material",
    "recipe.equation.fraction-material.v1", "split-factors"),
  structuralOperation("mergeFractionCommonFactor", "fraction-material",
    "recipe.equation.fraction-material.v1", "separate-common-factor"),
  structuralOperation("simplifyUnitFractionFactor", "fraction-material",
    "recipe.equation.fraction-material.v1", "simplify-unit-factor"),
  structuralOperation("lowerExponent", "exponent-law",
    "recipe.equation.exponent-expansion.v1", "peel-one-factor"),
  structuralOperation("unwrapUnitExponent", "exponent-law",
    "recipe.equation.exponent-expansion.v1", "absorb-unit-exponent"),
  structuralOperation("simplify-additive-identity", "identity-absorption",
    "recipe.operation-plan.identity-absorption.v1", "absorb-additive-zero"),
  structuralOperation("simplify-multiplicative-identity", "identity-absorption",
    "recipe.operation-plan.identity-absorption.v1", "absorb-multiplicative-one"),
  structural("computeDotProduct", "dot-product-traversal",
    "recipe.equation.dot-product-traversal.v1"),
  structural("multiplyMatrixVector", "matrix-vector-composition",
    "recipe.equation.matrix-vector-composition.v1"),
  structural("multiplyMatrices", "matrix-matrix-composition",
    "recipe.equation.matrix-matrix-composition.v1")
]);

const structuralByTransformType = Object.freeze(Object.fromEntries(
  kpEquationStructuralChoreographyDeclarations.map((entry) => [
    entry.transformType,
    entry
  ])
)) as Readonly<Record<string, KpEquationStructuralChoreographyDeclaration>>;

export function findKpEquationStructuralChoreographyDeclaration(
  transformType: string
): KpEquationStructuralChoreographyDeclaration | undefined {
  return structuralByTransformType[transformType];
}

function structural(
  transformType: string,
  channel: Exclude<
    KpEquationStructuralChoreographyChannel,
    "fraction-material" | "exponent-law" | "identity-absorption"
  >,
  recipeId: KpEquationStructuralChoreographyDeclaration["recipeId"]
): KpEquationStructuralChoreographyDeclaration {
  return Object.freeze({
    transformType,
    channel,
    recipeId
  });
}

function structuralOperation<
  Channel extends
    | "fraction-material"
    | "exponent-law"
    | "identity-absorption"
>(
  transformType: string,
  channel: Channel,
  recipeId: KpEquationStructuralChoreographyDeclaration["recipeId"],
  operationKind: Channel extends "fraction-material"
    ? KpFractionChoreographyKind
    : Channel extends "exponent-law"
      ? KpExponentLawChoreographyKind
      : KpIdentityAbsorptionChoreographyKind
): KpEquationStructuralChoreographyDeclaration {
  return Object.freeze({
    transformType,
    channel,
    recipeId,
    operationKind
  }) as KpEquationStructuralChoreographyDeclaration;
}
