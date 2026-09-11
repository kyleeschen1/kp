import { isKpVerifiedComposedProductEvaluation, type KpVerifiedComposedProductEvaluation } from "./composed-algebra-product-evaluation.ts";
import { projectKpComposedDistributedEndpoint } from "./composed-algebra-distribution-projection.ts";
import { scalarEquation, scalarToken } from "./integer-multiple-equation-projection.ts";
import { createKpSemanticTransformation } from "./asset-transformation.ts";
import type { KpSemanticOperationProjection } from "./semantic-operation-projection.ts";

export function projectKpContextualConstantProduct(proof: KpVerifiedComposedProductEvaluation): KpSemanticOperationProjection {
  if (!isKpVerifiedComposedProductEvaluation(proof)) throw new TypeError("Contextual product projection requires issued proof.");
  const source = projectKpComposedDistributedEndpoint(proof.distribution), from = source.object.id, to = proof.target.root.id;
  const local = proof.localEvaluation, localSource = local.bundle.objects[0]!, localTarget = local.bundle.objects[1]!;
  // Reuse the neighboring endpoint verbatim, including punctuation and metadata.
  const context = source.tokens.filter(token => !["factor-1", "member-1", "product-1"].some(role => token.id === `${from}.paint.${role}`));
  const preserved = context.map(token => ({ ...token, id: token.id.replace(`${from}.paint.`, `${to}.paint.`) }));
  const result = scalarToken(to, "result", String(proof.result.value), "term", localTarget.selectors[0]!.metadata);
  const target = scalarEquation(to, [...preserved, result]);
  const operands = proof.distribution.orientation === "left" ? ["factor-1", "member-1"] : ["member-1", "factor-1"];
  const relocated = new Map([[localSource.selectors[0]!.id, `${from}.paint.${operands[0]}`],
    [localSource.selectors[1]!.id, `${from}.paint.product-1`], [localSource.selectors[2]!.id, `${from}.paint.${operands[1]}`],
    [localTarget.selectors[0]!.id, result.id]]);
  const relocate = (id: string) => { const target = relocated.get(id); if (!target) throw new TypeError("Unbound canonical product selector."); return target; };
  const id = `transform.contextual-product.${proof.revisionId.slice(7)}`;
  return Object.freeze({ endpoints: Object.freeze([source, target] as const), transformation: createKpSemanticTransformation({
    ...local.transformation, id, sourceObjectIds: [from], targetObjectIds: [to],
    correspondenceMap: { id: `${id}.correspondence`, records: [
      ...local.transformation.correspondenceMap!.records.map(record => ({ ...record, id: `${id}.${record.id}`,
        sourceSelectorIds: record.sourceSelectorIds.map(relocate), targetSelectorIds: record.targetSelectorIds.map(relocate) })),
      ...context.map((token, index) => ({ id: `${id}.context-${index}`, relation: "identity" as const,
        sourceSelectorIds: [token.id], targetSelectorIds: [preserved[index]!.id], summary: "Preserve the other contribution and sum connector." }))
    ] } }) });
}
