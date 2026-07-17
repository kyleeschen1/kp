import {
  registerKpCanonicalReverseRuntimePlans,
  type KpCanonicalReverseRuntimeRegistration
} from "../canonical-reverse-runtime.ts";

const authoredHistory = {
  validity: "authored-history-only" as const,
  traversal: "target-to-source" as const,
  interpretation:
    "Reconstruct the exact authored predecessor without exposing this path as a mathematical inverse."
};

const neutralPair = {
  ...authoredHistory,
  choreographyKind: "introduce-neutral-pair" as const,
  causalEmphasis: "witness" as const,
  narration:
    "The neutral witness opens into the authored inverse pair; this reconstructs the recorded step, not a unique algebraic inverse."
};

export const kpAlgebraReverseRuntimeRegistrations:
  readonly KpCanonicalReverseRuntimeRegistration[] = [
  registration("cancelAdditiveInverses", "kp.algebra.cancel-additive-inverses", neutralPair),
  registration(
    "cancelMultiplicativeInverses",
    "kp.algebra.cancel-multiplicative-inverses",
    neutralPair
  ),
  registration(
    "simplifyUnitFractionFactor",
    "kp.algebra.simplify-unit-fraction-factor",
    neutralPair
  ),
  registration("distributeMultiplication", "kp.algebra.distribute-multiplication", {
    inverseOperationId: "kp.algebra.factor-common-term",
    validity: "mathematical-inverse",
    choreographyKind: "fusion",
    causalEmphasis: "junction",
    traversal: "target-to-source",
    interpretation: "Collect the descendants into their shared semantic origin.",
    narration: "The descendants meet and become their shared origin at the junction."
  }),
  registration("factorCommonTerm", "kp.algebra.factor-common-term", {
    inverseOperationId: "kp.algebra.distribute-multiplication",
    validity: "mathematical-inverse",
    choreographyKind: "fission",
    causalEmphasis: "junction",
    traversal: "target-to-source",
    interpretation: "Split the joined origin into its lineage-bearing descendants.",
    narration: "The shared origin splits into complete descendants at the junction."
  }),
  registration("simplifyConstantDifference", "kp.algebra.simplify-constant-difference", {
    ...authoredHistory,
    choreographyKind: "decompose-successor",
    causalEmphasis: "predecessor",
    narration:
      "The successor separates into its authored inputs and catalyst; this is historical reconstruction, not free inversion."
  }),
  registration("rewritePowerAsRoot", "kp.algebra.rewrite-power-as-root", {
    ...authoredHistory,
    choreographyKind: "restore-predecessor",
    causalEmphasis: "predecessor",
    narration:
      "The authored predecessor representation is restored from this recorded transformation."
  }),
  registration("wrapFunction", "kp.algebra.wrap-function", {
    ...authoredHistory,
    choreographyKind: "historical-reconstruction",
    causalEmphasis: "continuants",
    narration:
      "Rewind reconstructs the authored prior state without claiming a mathematical inverse."
  })
];

registerKpCanonicalReverseRuntimePlans(kpAlgebraReverseRuntimeRegistrations);

function registration(
  transformType: string,
  sourceOperationId: string,
  plan: Omit<KpCanonicalReverseRuntimeRegistration["plan"], "kind" | "sourceOperationId">
): KpCanonicalReverseRuntimeRegistration {
  return {
    transformType,
    plan: {
      kind: "canonical-reverse-choreography-plan",
      sourceOperationId,
      ...plan
    }
  };
}
