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

export function kpEquationLinearRearrangementKindForTransformType(
  transformType: string
): KpEquationLinearRearrangementKind | undefined {
  switch (transformType) {
    case "subtractBothSides":
    case "multiplyBothSides":
    case "applyNaturalLogBothSides":
      return "balanced-introduction";
    case "divideBothSides":
      return "divide-both-sides";
    case "projectCertifiedFractionTransfer":
      return "certified-fraction-transfer";
    case "splitFractionSum":
      return "split-fraction-sum";
    case "mergeFractions":
      return "merge-fractions";
    case "cancelAdditiveInverses":
      return "cancel-additive-inverses";
    case "cancelMultiplicativeInverses":
      return "cancel-multiplicative-inverses";
    case "simplifyConstantDifference":
      return "simplify-constant-difference";
    case "simplifyConstantQuotient":
      return "simplify-constant-quotient";
    case "simplifyConstantProduct":
      return "simplify-constant-product";
    default:
      return undefined;
  }
}
