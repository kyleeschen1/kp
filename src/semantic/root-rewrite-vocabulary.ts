export const KP_ROOT_REWRITE_VOCABULARY_AUTHORITY =
  "vocabulary.equation.root-rewrite.v1" as const;

export type KpRootRewriteClass =
  | "closed-evaluation"
  | "inverse-normalization"
  | "compound-carrier-normalization"
  | "assumption-qualified-cancellation"
  | "exponent-index-composition"
  | "mixed-evaluation"
  | "partial-extraction"
  | "nested-root-composition"
  | "blocked-rewrite"
  | "composed-derivation";

export type KpRootRewriteEvidenceKind =
  | "closed-value"
  | "exact-root"
  | "even-positive-integer-power"
  | "real-valued-carrier"
  | "nonnegative-domain"
  | "positive-integer-root-index"
  | "perfect-power-factor"
  | "residual-radicand"
  | "nested-index-product"
  | "no-valid-root-law"
  | "prior-factoring-state";

export type KpRootRewriteCarrierPolicy =
  | "consume-closed-body"
  | "preserve-largest-shared-subtree"
  | "retain-residual-enclosure"
  | "no-motion";

export interface KpRootRewriteVocabularyCase {
  readonly id: string;
  readonly operationClass: KpRootRewriteClass;
  readonly sourceLatex: string;
  readonly targetLatex?: string | undefined;
  readonly disposition:
    | "verified-plan-required"
    | "typed-gap"
    | "ordered-composition-required";
  readonly requiredEvidence: readonly KpRootRewriteEvidenceKind[];
  readonly carrierPolicy: KpRootRewriteCarrierPolicy;
  readonly pressureRole: "visual-exemplar" | "pressure" | "fixture";
  readonly rationale: string;
}

export interface KpRootRewriteVocabulary {
  readonly schemaVersion: "kp.root-rewrite-vocabulary.v1";
  readonly kind: "root-rewrite-vocabulary";
  readonly authority: typeof KP_ROOT_REWRITE_VOCABULARY_AUTHORITY;
  readonly cases: readonly KpRootRewriteVocabularyCase[];
}

const cases = [
  rootCase("closed-evaluation", "\\sqrt{144}", "12",
    "verified-plan-required", ["closed-value", "exact-root"],
    "consume-closed-body", "pressure",
    "A closed radical may evaluate as one cohort; no symbolic carrier survives."),
  rootCase("inverse-normalization", "\\sqrt{x^2}", "\\lvert x \\rvert",
    "verified-plan-required",
    ["even-positive-integer-power", "real-valued-carrier"],
    "preserve-largest-shared-subtree", "fixture",
    "The variable survives while the inverse exponent and radical are consumed."),
  rootCase("compound-carrier-normalization", "\\sqrt{(x+1)^2}",
    "\\lvert x+1 \\rvert", "verified-plan-required",
    ["even-positive-integer-power", "real-valued-carrier"],
    "preserve-largest-shared-subtree",
    "visual-exemplar",
    "The complete x+1 expression is one persistent semantic carrier."),
  rootCase("assumption-qualified-cancellation", "\\sqrt{x^2}", "x",
    "verified-plan-required",
    ["even-positive-integer-power", "nonnegative-domain"],
    "preserve-largest-shared-subtree", "fixture",
    "Removing absolute-value structure requires explicit nonnegative-domain evidence."),
  rootCase("exponent-index-composition", "\\sqrt[3]{x^2}", "x^{2/3}",
    "verified-plan-required", ["positive-integer-root-index"],
    "preserve-largest-shared-subtree", "pressure",
    "The base survives while exponent and root index compose with exact lineage."),
  rootCase("mixed-evaluation", "\\sqrt{4x^2}",
    "2\\lvert x \\rvert", "verified-plan-required",
    ["closed-value", "exact-root", "even-positive-integer-power",
      "real-valued-carrier"],
    "preserve-largest-shared-subtree", "pressure",
    "The coefficient evaluates independently of the persistent symbolic carrier."),
  rootCase("partial-extraction", "\\sqrt{x^2y}",
    "\\lvert x \\rvert\\sqrt{y}", "verified-plan-required",
    ["perfect-power-factor", "residual-radicand", "real-valued-carrier"],
    "retain-residual-enclosure", "pressure",
    "Only the proved perfect-power factor exits; the residual radicand stays enclosed."),
  rootCase("nested-root-composition", "\\sqrt{\\sqrt{x}}",
    "\\sqrt[4]{x}", "verified-plan-required", ["nested-index-product"],
    "preserve-largest-shared-subtree", "fixture",
    "The nested operators compose while x retains semantic identity."),
  rootCase("blocked-rewrite", "\\sqrt{x^2+y^2}", undefined, "typed-gap",
    ["no-valid-root-law"], "no-motion", "pressure",
    "A radical does not distribute across a sum and no termwise cancellation is licensed."),
  rootCase("composed-derivation", "\\sqrt{x^2+2x+1}",
    "\\lvert x+1 \\rvert", "ordered-composition-required",
    ["prior-factoring-state", "even-positive-integer-power",
      "real-valued-carrier"],
    "preserve-largest-shared-subtree", "fixture",
    "Factoring must be represented as a prior semantic state before root normalization.")
] as const;

/**
 * This declaration is intentionally semantic-only: it tells later compilers
 * which proof obligation exists, not how a radical should move or be painted.
 */
export const kpRootRewriteVocabulary = defineKpRootRewriteVocabulary({
  schemaVersion: "kp.root-rewrite-vocabulary.v1",
  kind: "root-rewrite-vocabulary",
  authority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
  cases
});

export const kpRootRewriteNegativeCorpus = Object.freeze(
  kpRootRewriteVocabulary.cases.filter(({ disposition }) =>
    disposition !== "verified-plan-required"
  )
);

export function defineKpRootRewriteVocabulary(
  value: KpRootRewriteVocabulary
): KpRootRewriteVocabulary {
  const ids = new Set<string>();
  const classes = new Set<KpRootRewriteClass>();
  for (const entry of value.cases) {
    if (ids.has(entry.id)) throw new Error(`Duplicate root case ${entry.id}.`);
    if (classes.has(entry.operationClass)) {
      throw new Error(`Duplicate root class ${entry.operationClass}.`);
    }
    if (entry.sourceLatex.trim().length === 0) {
      throw new Error(`Root case ${entry.id} requires source LaTeX.`);
    }
    if (entry.disposition === "verified-plan-required" &&
      entry.targetLatex === undefined) {
      throw new Error(`Root case ${entry.id} requires target LaTeX.`);
    }
    if (entry.disposition === "typed-gap" && entry.carrierPolicy !== "no-motion") {
      throw new Error(`Blocked root case ${entry.id} cannot authorize motion.`);
    }
    ids.add(entry.id);
    classes.add(entry.operationClass);
  }
  return deepFreeze({ ...value, cases: [...value.cases] });
}

function rootCase(
  operationClass: KpRootRewriteClass,
  sourceLatex: string,
  targetLatex: string | undefined,
  disposition: KpRootRewriteVocabularyCase["disposition"],
  requiredEvidence: readonly KpRootRewriteEvidenceKind[],
  carrierPolicy: KpRootRewriteCarrierPolicy,
  pressureRole: KpRootRewriteVocabularyCase["pressureRole"],
  rationale: string
): KpRootRewriteVocabularyCase {
  return Object.freeze({
    id: `root-rewrite.${operationClass}`,
    operationClass,
    sourceLatex,
    ...(targetLatex === undefined ? {} : { targetLatex }),
    disposition,
    requiredEvidence: Object.freeze([...requiredEvidence]),
    carrierPolicy,
    pressureRole,
    rationale
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
