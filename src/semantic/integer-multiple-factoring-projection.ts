import { isKpVerifiedComposedFactoring, type KpVerifiedComposedFactoring } from "./composed-algebra-factoring.ts";
import { createGeneratedAlgebraSemanticTransformation } from "./generated-algebra-transform-definition-registry.ts";
import { createKpFactoringCorrespondenceMap } from "./factoring-correspondence.ts";
import { projectKpStructuredScalarLatex, KpScalarLatexProjectionGap } from "./structured-scalar-latex.ts";
import { scalarToken, scalarEquation, orderedScalarProduct, projectKpIntegerCoefficientSum } from "./integer-multiple-equation-projection.ts";
import type { KpSemanticOperationProjection } from "./semantic-operation-projection.ts";

export function projectKpIntegerMultipleFactoring(proof: KpVerifiedComposedFactoring): KpSemanticOperationProjection {
  if (!isKpVerifiedComposedFactoring(proof)) throw new TypeError("Factoring projection requires issued proof.");
  if (proof.factor.kind !== "sum" && proof.factor.kind !== "product")
    throw new KpScalarLatexProjectionGap("This compound-factor projection requires a grouped sum or product; atomic numeric factors need explicit-product notation.");
  const from = proof.source.root.id, to = proof.target.root.id, [left, right] = proof.coefficients;
  const factor = projectKpStructuredScalarLatex(proof.factor, "display");
  const source = scalarEquation(from, [
    ...orderedScalarProduct(scalarToken(from, "left-factor", factor, "factor"), [scalarToken(from, "left-term", String(left.value), "term")], proof.orientation),
    scalarToken(from, "plus", "+", "operator"),
    ...orderedScalarProduct(scalarToken(from, "right-factor", factor, "factor"), [scalarToken(from, "right-term", String(right.value), "term")], proof.orientation)
  ]);
  const target = projectKpIntegerCoefficientSum({ id: to, factor: proof.factor, left: left.value, right: right.value, orientation: proof.orientation });
  const id = `transform.integer-multiple.${proof.revisionId.slice(7)}.factor`;
  return Object.freeze({ endpoints: Object.freeze([source, target] as const),
    transformation: createGeneratedAlgebraSemanticTransformation({ familyId: "generated.distribution", transformType: "factorCommonTerm",
      id, title: "Group equal whole expressions", sourceObjectIds: [from], targetObjectIds: [to],
      correspondenceMap: createKpFactoringCorrespondenceMap(`${id}.correspondence`, {
        factorCopies: [`${from}.paint.left-factor`, `${from}.paint.right-factor`], commonFactor: `${to}.paint.factor`,
        leftTerm: [`${from}.paint.left-term`, `${to}.paint.left-term`], rightTerm: [`${from}.paint.right-term`, `${to}.paint.right-term`],
        plus: [`${from}.paint.plus`, `${to}.paint.plus`], grouping: [`${to}.paint.left-paren`, `${to}.paint.right-paren`]
      }) }) });
}
