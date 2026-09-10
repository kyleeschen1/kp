import { createKpSemanticAssetObject } from "./asset.ts";
import type { KpSemanticEquationProjection, KpSemanticEquationToken } from "./semantic-operation-projection.ts";
import type { KpDistributionOrientation } from "./structured-expression-rewrite.ts";
import type { KpStructuredExpressionNode } from "./structured-expression.ts";
import { projectKpStructuredScalarLatex } from "./structured-scalar-latex.ts";
import { createKpConstantSumEvaluationAsset } from "./constant-sum-evaluation-asset.ts";

export function scalarToken(state: string, role: string, latex: string, kind: KpSemanticEquationToken["kind"],
  metadata?: KpSemanticEquationToken["metadata"]): KpSemanticEquationToken {
  return Object.freeze({ id: `${state}.paint.${role}`, latex, kind, ...(metadata ? { metadata } : {}) });
}
export function scalarEquation(id: string, tokens: readonly KpSemanticEquationToken[]): KpSemanticEquationProjection {
  return Object.freeze({ tokens: Object.freeze([...tokens]), object: createKpSemanticAssetObject({ id, objectType: "expression", title: "Scalar expression",
    value: { latex: tokens.map(t => t.kind === "operator" ? ` ${t.latex} ` : t.latex).join("") },
    selectors: tokens.map(t => ({ id: t.id, kind: t.kind, label: t.latex, ...(t.metadata ? { metadata: t.metadata } : {}) })) }) });
}
export function orderedScalarProduct(factor: KpSemanticEquationToken, coefficient: readonly KpSemanticEquationToken[], orientation: KpDistributionOrientation) {
  return orientation === "left" ? [factor, ...coefficient] : [...coefficient, factor];
}
/** Both neighboring operations share this endpoint projection. Arithmetic
 * annotations come from the constant-sum owner, never the lesson. */
export function projectKpIntegerCoefficientSum(input: {
  readonly id: string; readonly factor: KpStructuredExpressionNode;
  readonly left: number; readonly right: number; readonly orientation: KpDistributionOrientation;
}): KpSemanticEquationProjection {
  const local = createKpConstantSumEvaluationAsset({ id: "coefficient-sum", left: input.left, right: input.right });
  const source = local.bundle.objects[0]!;
  const coefficient = [scalarToken(input.id, "left-paren", "(", "delimiter"),
    scalarToken(input.id, "left-term", String(input.left), "term", source.selectors[0]!.metadata),
    scalarToken(input.id, "plus", "+", "operator", source.selectors[1]!.metadata),
    scalarToken(input.id, "right-term", String(input.right), "term", source.selectors[2]!.metadata),
    scalarToken(input.id, "right-paren", ")", "delimiter")];
  return scalarEquation(input.id, orderedScalarProduct(
    scalarToken(input.id, "factor", projectKpStructuredScalarLatex(input.factor, "display"), "factor"), coefficient, input.orientation));
}
