import { isKpVerifiedLikeDenominatorCombination, type KpVerifiedLikeDenominatorCombination } from "./fraction-like-denominator-combination.ts";
import { createKpConstantSumEvaluationAsset, createKpConstantDifferenceEvaluationAsset } from "./constant-sum-evaluation-asset.ts";
import { createKpAssetBundle, createKpSemanticAssetObject } from "./asset.ts";
import { createKpSemanticTransformation } from "./asset-transformation.ts";

/** Arithmetic owns only the numerator. The fraction rule and denominator are
 * persistent context, not contributors to the sum. */
export function createVerifiedFractionNumeratorEvaluation(proof: KpVerifiedLikeDenominatorCombination) {
  if (!isKpVerifiedLikeDenominatorCombination(proof) ||
      proof.source.terms.some(term => term.numerator.value <= 0n || term.numerator.value > 1000000n || term.denominator.value > 1000000n))
    throw new TypeError("Fraction numerator evaluation requires issued bounded positive operand authority.");
  const left = proof.source.terms[0].numerator.value, right = proof.source.terms[1].numerator.value;
  const denominator = proof.target.term.denominator.value;
  const evaluate = proof.operator === "+" ? createKpConstantSumEvaluationAsset : createKpConstantDifferenceEvaluationAsset;
  const local = evaluate({ id: proof.id.replaceAll(".", "-"), left: Number(left), right: Number(right) });
  const objects = local.bundle.objects.map((object, index) => createKpSemanticAssetObject({ ...object,
    value: { latex: `\\frac{${index === 0 ? `${left}${proof.operator}${right}` : proof.target.term.numerator.value}}{${denominator}}` },
    selectors: [...object.selectors,
      { id: `${object.id}.fraction.rule`, kind: "artifact", label: "fraction rule", metadata: { equationStructureRole: "fraction-rule" } },
      { id: `${object.id}.denominator`, kind: "term", label: String(denominator), metadata: { equationStructureRole: "denominator" } }] }));
  const source = objects[0]!, target = objects[1]!;
  return { id: local.id, title: "Combine the ordered numerators; retain the denominator",
    bundle: createKpAssetBundle({ ...local.bundle, objects }),
    transformation: createKpSemanticTransformation({ ...local.transformation,
      correspondenceMap: { id: local.transformation.correspondenceMap!.id,
        records: [...local.transformation.correspondenceMap!.records,
          ...["fraction.rule", "denominator"].map(role => ({ id: `${local.transformation.id}.${role}`, relation: "identity" as const,
            sourceSelectorIds: [`${source.id}.${role}`], targetSelectorIds: [`${target.id}.${role}`], summary: "Retain the common denominator structure." }))] } }) };
}
