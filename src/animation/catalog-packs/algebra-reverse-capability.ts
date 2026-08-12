import {
  createKpCanonicalReverseChoreographyCapability,
  type KpCanonicalReverseChoreographyEntry
} from "../canonical-reverse-capability.ts";

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

export const kpAlgebraReverseChoreographyEntries = Object.freeze([
  entry("cancelAdditiveInverses", "kp.algebra.cancel-additive-inverses", neutralPair),
  entry(
    "cancelMultiplicativeInverses",
    "kp.algebra.cancel-multiplicative-inverses",
    neutralPair
  ),
  entry(
    "simplifyUnitFractionFactor",
    "kp.algebra.simplify-unit-fraction-factor",
    neutralPair
  ),
  entry("distributeMultiplication", "kp.algebra.distribute-multiplication", {
    inverseOperationId: "kp.algebra.factor-common-term",
    validity: "mathematical-inverse",
    choreographyKind: "fusion",
    causalEmphasis: "junction",
    traversal: "target-to-source",
    interpretation: "Collect the descendants into their shared semantic origin.",
    narration: "The descendants meet and become their shared origin at the junction."
  }),
  entry("factorCommonTerm", "kp.algebra.factor-common-term", {
    inverseOperationId: "kp.algebra.distribute-multiplication",
    validity: "mathematical-inverse",
    choreographyKind: "fission",
    causalEmphasis: "junction",
    traversal: "target-to-source",
    interpretation: "Split the joined origin into its lineage-bearing descendants.",
    narration: "The shared origin splits into complete descendants at the junction."
  }),
  entry("simplifyConstantDifference", "kp.algebra.simplify-constant-difference", {
    ...authoredHistory,
    choreographyKind: "decompose-successor",
    causalEmphasis: "predecessor",
    narration:
      "The successor separates into its authored inputs and catalyst; this is historical reconstruction, not free inversion."
  }),
  entry("rewritePowerAsRoot", "kp.algebra.rewrite-power-as-root", {
    ...authoredHistory,
    choreographyKind: "restore-predecessor",
    causalEmphasis: "predecessor",
    narration:
      "The authored predecessor representation is restored from this recorded transformation."
  }),
  entry("wrapFunction", "kp.algebra.wrap-function", {
    ...authoredHistory,
    choreographyKind: "historical-reconstruction",
    causalEmphasis: "continuants",
    narration:
      "Rewind reconstructs the authored prior state without claiming a mathematical inverse."
  })
] satisfies readonly KpCanonicalReverseChoreographyEntry[]);

export const kpAlgebraReverseChoreographyCapability =
  createKpCanonicalReverseChoreographyCapability(
    kpAlgebraReverseChoreographyEntries
  );

function entry(
  transformType: string,
  sourceOperationId: string,
  plan: Omit<KpCanonicalReverseChoreographyEntry["plan"], "kind" | "sourceOperationId">
): KpCanonicalReverseChoreographyEntry {
  return Object.freeze({
    transformType,
    plan: Object.freeze({
      kind: "canonical-reverse-choreography-plan",
      sourceOperationId,
      ...plan
    })
  });
}
