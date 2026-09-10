import { isKpVerifiedComposedAlgebraChain, type KpVerifiedComposedAlgebraChain } from "./composed-algebra-chain.ts";
import { isKpVerifiedComposedFactoring } from "./composed-algebra-factoring.ts";
import { isKpVerifiedComposedEvaluation } from "./composed-algebra-evaluation.ts";
import { projectKpIntegerMultipleFactoring } from "./integer-multiple-factoring-projection.ts";
import { projectKpContextualConstantSum } from "./contextual-constant-sum-projection.ts";
import { defineKpSemanticOperationProjector, composeKpSemanticOperationProjections } from "./semantic-operation-projection.ts";

// The bounded task selects extensions. Dispatch and assembly know neither the
// operation kinds nor their correspondence, notation or presentation internals.
const project = defineKpSemanticOperationProjector<KpVerifiedComposedAlgebraChain["steps"][number]>({
  "verified-composed-factoring": { accepts: isKpVerifiedComposedFactoring, project: projectKpIntegerMultipleFactoring },
  "verified-composed-evaluation": { accepts: isKpVerifiedComposedEvaluation, project: projectKpContextualConstantSum }
});

export function createKpComposedAlgebraSemanticAsset(chain: KpVerifiedComposedAlgebraChain) {
  if (!isKpVerifiedComposedAlgebraChain(chain)) throw new TypeError("Composed assets require issued chain evidence.");
  return composeKpSemanticOperationProjections(`composed-algebra.${chain.revisionId.slice(7)}`, chain.steps.map(project));
}
