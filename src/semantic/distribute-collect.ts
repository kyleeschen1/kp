import { isKpVerifiedComposedFactoring, type KpVerifiedComposedFactoring } from "./composed-algebra-factoring.ts";
import { verifyKpCommonFactorRewrite } from "./common-factor-rewrite.ts";
import type { KpStructuredExpression } from "./structured-expression.ts";
import { projectKpIntegerMultipleFactoring } from "./integer-multiple-factoring-projection.ts";
import { scalarEquation, scalarToken } from "./integer-multiple-equation-projection.ts";
import { createKpDistributionCorrespondenceMap } from "./distribution-correspondence.ts";
import { createGeneratedAlgebraSemanticTransformation } from "./generated-algebra-transform-definition-registry.ts";

const brand = Symbol("distribution-before-collection");
const issued = new WeakSet<object>();
export interface KpDistributionBeforeCollection {
  readonly [brand]: true;
  readonly distribution: ReturnType<typeof verifyKpCommonFactorRewrite>;
  readonly collection: KpVerifiedComposedFactoring;
  readonly revisionId: string;
}

/** The shared endpoint is supplied by the next checked operation. Equal-looking
 * strings cannot authorize a handoff with unrelated occurrence identities. */
export function verifyKpDistributionBeforeCollection(source: KpStructuredExpression,
  collection: KpVerifiedComposedFactoring): KpDistributionBeforeCollection {
  if (!isKpVerifiedComposedFactoring(collection)) throw new TypeError("Use issued collection evidence.");
  if (collection.orientation !== "right" || collection.factor.kind !== "symbol")
    throw new TypeError("This bounded presentation collects integer multiples of one scalar symbol.");
  const distribution = verifyKpCommonFactorRewrite({ domain: "real-scalars", symbols: collection.symbols,
    source: collection.source, target: source });
  if (distribution.factor.kind !== "number" || distribution.addends.some(a => a.kind !== "symbol"))
    throw new TypeError("Distribute an integer over two scalar symbols.");
  const proof: KpDistributionBeforeCollection = Object.freeze({ [brand]: true as const, distribution, collection,
    revisionId: distribution.revisionId });
  issued.add(proof);
  return proof;
}

export function projectKpDistributionBeforeCollection(proof: KpDistributionBeforeCollection) {
  if (!issued.has(proof)) throw new TypeError("Use issued distribution-before-collection evidence.");
  const verified = proof.distribution, from = verified.target.root.id;
  const target = projectKpIntegerMultipleFactoring(proof.collection).endpoints[0], to = target.object.id;
  const source = scalarEquation(from, [
    scalarToken(from, "coefficient", verified.factor.kind === "number" ? String(verified.factor.value) : verified.factor.name, "factor"),
    scalarToken(from, "open", "(", "delimiter"),
    ...verified.addends.flatMap((atom, index) => [
      ...(index ? [scalarToken(from, "plus", "+", "operator")] : []),
      scalarToken(from, `member-${index}`, atom.kind === "symbol" ? atom.name : String(atom.value), "term")]),
    scalarToken(from, "close", ")", "delimiter")]);
  const id = `transform.distribute-collect.${proof.revisionId.slice(7)}`;
  return Object.freeze({ endpoints: Object.freeze([source, target] as const),
    transformation: createGeneratedAlgebraSemanticTransformation({ familyId: "generated.distribution", transformType: "distributeMultiplication",
      id, title: "Distribute to both occurrences", sourceObjectIds: [from], targetObjectIds: [to],
      correspondenceMap: createKpDistributionCorrespondenceMap(`${id}.correspondence`, {
        commonFactor: `${from}.paint.coefficient`, factorCopies: [`${to}.paint.left-term`, `${to}.paint.right-term`],
        leftTerm: [`${from}.paint.member-0`, `${to}.paint.left-factor`],
        rightTerm: [`${from}.paint.member-1`, `${to}.paint.right-factor`],
        plus: [`${from}.paint.plus`, `${to}.paint.plus`], grouping: [`${from}.paint.open`, `${from}.paint.close`]
      }) }) });
}
