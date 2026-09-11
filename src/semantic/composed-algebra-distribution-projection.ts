import { isKpVerifiedComposedDistribution, type KpVerifiedComposedDistribution } from "./composed-algebra-distribution.ts";
import { bindKpComposedGroupEndpointHandoff } from "./equation-endpoint-handoff.ts";
import { scalarEquation, scalarToken } from "./integer-multiple-equation-projection.ts";
import { projectKpStructuredScalarLatex } from "./structured-scalar-latex.ts";
import { createKpConstantProductEvaluationAsset } from "./constant-product-evaluation-asset.ts";
import { createKpDistributionCorrespondenceMap } from "./distribution-correspondence.ts";
import { createGeneratedAlgebraSemanticTransformation } from "./generated-algebra-transform-definition-registry.ts";

export function projectKpComposedDistributedEndpoint(proof: KpVerifiedComposedDistribution) {
  if (!isKpVerifiedComposedDistribution(proof)) throw new TypeError("Distribution projection requires issued proof.");
  const id = proof.target.root.id, value = proof.partition.evaluation.result.value;
  const terms = proof.partition.members.map((member, index) => {
    const numeric = member.kind === "number";
    const local = numeric ? createKpConstantProductEvaluationAsset({ id: `distribution-${proof.revisionId.slice(7)}-${index}`,
      left: proof.orientation === "left" ? value : member.value, right: proof.orientation === "left" ? member.value : value }) : undefined;
    const metadata = local?.bundle.objects[0]?.selectors;
    const fi = proof.orientation === "left" ? 0 : 2, ai = 2 - fi;
    const factor = scalarToken(id, `factor-${index}`, String(value), "factor", metadata?.[fi]?.metadata);
    const addend = scalarToken(id, `member-${index}`, projectKpStructuredScalarLatex(member, "display"), "term", metadata?.[ai]?.metadata);
    const punctuation = numeric ? [scalarToken(id, `product-${index}`, "\\cdot", "operator", metadata?.[1]?.metadata)] : [];
    return proof.orientation === "left" ? [factor, ...punctuation, addend] : [addend, ...punctuation, factor];
  });
  return scalarEquation(id, [...terms[0]!, scalarToken(id, "sum-plus", "+", "operator"), ...terms[1]!]);
}

export function projectKpComposedDistribution(proof: KpVerifiedComposedDistribution) {
  if (!isKpVerifiedComposedDistribution(proof)) throw new TypeError("Distribution projection requires issued proof.");
  const handoff = bindKpComposedGroupEndpointHandoff(proof.partition), source = handoff.target;
  const target = projectKpComposedDistributedEndpoint(proof), from = source.object.id, to = target.object.id;
  const id = `transform.composed-distribution.${proof.revisionId.slice(7)}`;
  return Object.freeze({ endpoints: Object.freeze([source, target] as const), handoff,
    transformation: createGeneratedAlgebraSemanticTransformation({ familyId: "generated.distribution", transformType: "distributeMultiplication",
      id, title: "Account for every contribution", sourceObjectIds: [from], targetObjectIds: [to],
      correspondenceMap: createKpDistributionCorrespondenceMap(`${id}.correspondence`, {
        commonFactor: `${from}.paint.coefficient`, factorCopies: [`${to}.paint.factor-0`, `${to}.paint.factor-1`],
        leftTerm: [`${from}.paint.member-0`, `${to}.paint.member-0`], rightTerm: [`${from}.paint.member-1`, `${to}.paint.member-1`],
        plus: [`${from}.paint.group-plus`, `${to}.paint.sum-plus`], grouping: [`${from}.paint.group-open`, `${from}.paint.group-close`],
        productArtifacts: target.tokens.filter(token => token.id === `${to}.paint.product-0` || token.id === `${to}.paint.product-1`).map(token => token.id)
      }) }) });
}
