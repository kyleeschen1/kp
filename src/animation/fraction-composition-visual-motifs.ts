import {
  createKpFractionCompositionEvaluationTree
} from "../semantic/fraction-composition-evaluation-tree.ts";
import {
  createTransformTreeVisualMotifTimeline,
  type TransformTreeVisualMotifRule
} from "./motifs/visual-motif-composition.ts";
import {
  equationVisualMotifDescriptors
} from "./motifs/visual-motif.ts";
import {
  requireKpCanonicalOperationEvaluationPresentation,
  ruleFromKpResolvedOperationEvaluationPresentation
} from "./operation-evaluation-presentation-registry.ts";

export type KpFractionCompositionMotifKind =
  | "append-after-shift"
  | "cancelation"
  | "copy-fan-out"
  | "fraction-factor-split"
  | "successor-synthesis";

const rules: readonly TransformTreeVisualMotifRule<string, string, string>[] =
Object.freeze([
  rule("distributeMultiplication", "copy-fan-out", {
    canonicalOperationIds: ["kp.core.persist", "kp.core.fan-out", "kp.core.reorder"],
    trustedMotifIds: ["persist", "fan-out", "reorder"]
  }),
  rule("normalizeFractionNumerators", "fraction-factor-split", {
    canonicalOperationIds: ["kp.core.persist", "kp.core.reorder", "kp.core.wrap"],
    trustedMotifIds: ["persist", "reorder", "wrap"],
    summary:
      "Fraction roles focus while each persistent outside factor reflows under its native numerator bar."
  }),
  successorRule("simplifyConstantProduct"),
  successorRule("simplifyConstantQuotient"),
  balancedRule("subtractBothSides"),
  cancellationRule("cancelAdditiveInverses"),
  successorRule("simplifyConstantDifference"),
  balancedRule("multiplyBothSides"),
  cancellationRule("cancelMultiplicativeInverses"),
  balancedRule("divideBothSides")
]);

export function createKpFractionCompositionVisualMotifTimeline() {
  return createTransformTreeVisualMotifTimeline({
    id: "visual.fraction-composition.canonical",
    tree: createKpFractionCompositionEvaluationTree(),
    rules
  });
}

function balancedRule(
  transformationKind: "subtractBothSides" | "multiplyBothSides" | "divideBothSides"
) {
  return rule(transformationKind, "append-after-shift", {
    canonicalOperationIds: ["kp.core.persist", "kp.core.introduce"],
    trustedMotifIds: ["persist", "introduce"],
    summary:
      "Persistent equation terms reserve space before matched operation tokens enter both sides."
  });
}

function cancellationRule(
  transformationKind: "cancelAdditiveInverses" | "cancelMultiplicativeInverses"
) {
  return rule(transformationKind, "cancelation", {
    canonicalOperationIds: ["kp.core.persist", "kp.core.eliminate"],
    trustedMotifIds: ["persist", "eliminate"],
    summary:
      "Certified inverse contributors meet and collapse while every invariant translates continuously."
  });
}

function successorRule(
  transformationKind:
    | "simplifyConstantProduct"
    | "simplifyConstantQuotient"
    | "simplifyConstantDifference"
): TransformTreeVisualMotifRule<string, string, string> {
  // The nominal certificate prevents this exemplar from silently forking the
  // reviewed arithmetic motif while still letting it compose local operations.
  return ruleFromKpResolvedOperationEvaluationPresentation(
    requireKpCanonicalOperationEvaluationPresentation(transformationKind)
  );
}

function rule(
  transformationKind: string,
  motifKind: Exclude<KpFractionCompositionMotifKind, "successor-synthesis">,
  metadata: {
    readonly canonicalOperationIds: readonly string[];
    readonly trustedMotifIds: readonly string[];
    readonly summary?: string | undefined;
  }
): TransformTreeVisualMotifRule<string, string, string> {
  const descriptor = equationVisualMotifDescriptors.find(
    ({ kind }) => kind === motifKind
  );
  if (descriptor === undefined) {
    throw new Error(`Missing existing equation motif ${motifKind}.`);
  }
  return {
    transformationKind,
    descriptor,
    canonicalOperationIds: metadata.canonicalOperationIds,
    trustedMotifIds: metadata.trustedMotifIds,
    ...(metadata.summary === undefined ? {} : { summary: metadata.summary })
  };
}
