import { isKpVerifiedComposedEvaluation, type KpVerifiedComposedEvaluation } from "./composed-algebra-evaluation.ts";
import { createKpSemanticTransformation } from "./asset-transformation.ts";
import { scalarToken, scalarEquation, orderedScalarProduct, projectKpIntegerCoefficientSum } from "./integer-multiple-equation-projection.ts";
import { projectKpStructuredScalarLatex } from "./structured-scalar-latex.ts";
import type { KpSemanticOperationProjection } from "./semantic-operation-projection.ts";

export function projectKpContextualConstantSum(proof: KpVerifiedComposedEvaluation): KpSemanticOperationProjection {
  if (!isKpVerifiedComposedEvaluation(proof)) throw new TypeError("Contextual evaluation projection requires issued proof.");
  const factoring = proof.factoring, [left, right] = factoring.coefficients;
  const from = proof.source.root.id, to = proof.target.root.id;
  const source = projectKpIntegerCoefficientSum({ id: from, factor: factoring.factor, left: left.value, right: right.value, orientation: factoring.orientation });
  const local = proof.localEvaluation, localSource = local.bundle.objects[0]!, localTarget = local.bundle.objects[1]!;
  const result = scalarToken(to, "result", String(proof.result.value), "term", localTarget.selectors[0]!.metadata);
  const target = scalarEquation(to, orderedScalarProduct(scalarToken(to, "factor", projectKpStructuredScalarLatex(proof.preservedContext, "display"), "factor"), [result], factoring.orientation));
  const id = `transform.contextual-sum.${proof.revisionId.slice(7)}`;
  const relocated = new Map([[localSource.selectors[0]!.id, `${from}.paint.left-term`],
    [localSource.selectors[1]!.id, `${from}.paint.plus`], [localSource.selectors[2]!.id, `${from}.paint.right-term`],
    [localTarget.selectors[0]!.id, result.id]]);
  const relocate = (id: string) => { const target = relocated.get(id); if (!target) throw new TypeError("Unbound canonical evaluation selector."); return target; };
  return Object.freeze({ endpoints: Object.freeze([source, target] as const), transformation: createKpSemanticTransformation({
    ...local.transformation, id, sourceObjectIds: [from], targetObjectIds: [to],
    correspondenceMap: { id: `${id}.correspondence`, records: [
      ...local.transformation.correspondenceMap!.records.map(record => ({ ...record, id: `${id}.${record.id}`,
        sourceSelectorIds: record.sourceSelectorIds.map(relocate), targetSelectorIds: record.targetSelectorIds.map(relocate) })),
      { id: `${id}.context`, relation: "identity", sourceSelectorIds: [`${from}.paint.factor`], targetSelectorIds: [`${to}.paint.factor`], summary: "Preserve the complete common factor." },
      { id: `${id}.grouping`, relation: "removal", sourceSelectorIds: [`${from}.paint.left-paren`, `${from}.paint.right-paren`], targetSelectorIds: [], summary: "The evaluated coefficient no longer needs sum grouping." }
    ] } }) });
}
