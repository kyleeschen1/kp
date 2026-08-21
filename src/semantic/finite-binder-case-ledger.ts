export const KP_FINITE_BINDER_CASE_LEDGER_AUTHORITY =
  "coverage.equation.finite-binder-expansion-cases.v1" as const;

export type KpFiniteBinderCaseClass =
  | "canonical-sum"
  | "singleton-sum"
  | "negative-bound-sum"
  | "finite-product-pressure"
  | "unbounded-binder"
  | "symbolic-upper-bound"
  | "descending-range"
  | "mismatched-body-reference"
  | "compound-body-template"
  | "oversized-expansion"
  | "nested-binder";

export type KpFiniteBinderCaseDisposition =
  | "verified-direct-expansion"
  | "pressure-required"
  | "typed-gap";

export interface KpFiniteBinderCaseLedgerEntry {
  readonly id: string;
  readonly operationClass: KpFiniteBinderCaseClass;
  readonly title: string;
  readonly sourceLatex: string;
  readonly targetLatex?: string | undefined;
  readonly disposition: KpFiniteBinderCaseDisposition;
  readonly requiredEvidenceIds: readonly string[];
  readonly rationale: string;
}

export interface KpFiniteBinderCaseLedger {
  readonly schemaVersion: "kp.finite-binder-case-ledger.v1";
  readonly kind: "finite-binder-case-ledger";
  readonly authority: typeof KP_FINITE_BINDER_CASE_LEDGER_AUTHORITY;
  readonly cases: readonly KpFiniteBinderCaseLedgerEntry[];
}

const entries = [
  entry("canonical-sum", "Expand a canonical finite sum",
    "\\sum_{i=1}^{3} a_i", "a_1+a_2+a_3",
    "verified-direct-expansion",
    ["explicit-integer-bounds", "local-reference", "ordered-target"],
    "Canonical visual exemplar and semantic proof surface."),
  entry("singleton-sum", "Expand a singleton finite sum",
    "\\sum_{i=2}^{2} a_i", "a_2", "verified-direct-expansion",
    ["explicit-integer-bounds", "singleton-range", "local-reference"],
    "A closed one-value range yields one instance and no connector."),
  entry("negative-bound-sum", "Expand across negative integer bounds",
    "\\sum_{i=-2}^{1} a_i", "a_{-2}+a_{-1}+a_0+a_1",
    "verified-direct-expansion",
    ["explicit-integer-bounds", "ascending-inclusive-range", "local-reference"],
    "Signed integers pressure order without changing binder semantics."),
  entry("finite-product-pressure", "Expand a canonical finite product",
    "\\prod_{k=0}^{2} x_k", "x_0x_1x_2", "pressure-required",
    ["explicit-integer-bounds", "local-reference", "product-owned-connectors"],
    "The post-checkpoint caller must prove sharing without inheriting sum choreography."),
  gap("unbounded-binder", "Refuse an unbounded sum", "\\sum_i a_i",
    ["explicit-integer-bounds"],
    "An unbounded operator cannot authorize finite enumeration."),
  gap("symbolic-upper-bound", "Refuse a symbolic upper bound",
    "\\sum_{i=1}^{n} a_i", ["closed-integer-upper-bound"],
    "Symbolic cardinality remains outside explicit finite expansion."),
  gap("descending-range", "Refuse descending bounds",
    "\\sum_{i=3}^{1} a_i", ["ascending-inclusive-range"],
    "The narrow family does not infer an empty fold or descending convention."),
  gap("mismatched-body-reference", "Refuse an unowned body reference",
    "\\sum_{i=1}^{3} a_j", ["local-reference"],
    "The visible body reference must resolve to the declared binder."),
  gap("compound-body-template", "Defer compound body substitution",
    "\\sum_{i=1}^{3} a_{2i}", ["compound-template-normalizer"],
    "Compound templates require a separate caller proof before promotion."),
  gap("oversized-expansion", "Refuse oversized explicit output",
    "\\sum_{i=1}^{1000} a_i", ["explicit-expansion-budget"],
    "A named allocation guard prevents accidental giant authored outputs."),
  gap("nested-binder", "Defer nested binder scope",
    "\\sum_{i=1}^{3}\\sum_{j=1}^{i} a_{ij}",
    ["nested-scope-normalizer", "dependent-bound-proof"],
    "Nested and dependent binders require a distinct semantic grammar.")
] as const;

export const kpFiniteBinderCaseLedger = defineKpFiniteBinderCaseLedger({
  schemaVersion: "kp.finite-binder-case-ledger.v1",
  kind: "finite-binder-case-ledger",
  authority: KP_FINITE_BINDER_CASE_LEDGER_AUTHORITY,
  cases: entries
});

export function defineKpFiniteBinderCaseLedger(
  value: KpFiniteBinderCaseLedger
): KpFiniteBinderCaseLedger {
  const ids = new Set<string>();
  const classes = new Set<KpFiniteBinderCaseClass>();
  for (const candidate of value.cases) {
    if (ids.has(candidate.id)) {
      throw new Error(`Duplicate finite-binder case ${candidate.id}.`);
    }
    if (classes.has(candidate.operationClass)) {
      throw new Error(
        `Duplicate finite-binder case class ${candidate.operationClass}.`
      );
    }
    if (candidate.disposition === "typed-gap" &&
        candidate.targetLatex !== undefined) {
      throw new Error(`Typed-gap case ${candidate.id} cannot claim a target.`);
    }
    if (candidate.disposition !== "typed-gap" &&
        candidate.targetLatex === undefined) {
      throw new Error(`Executable case ${candidate.id} requires a target.`);
    }
    if (candidate.requiredEvidenceIds.length === 0) {
      throw new Error(`Finite-binder case ${candidate.id} requires evidence.`);
    }
    ids.add(candidate.id);
    classes.add(candidate.operationClass);
  }
  return deepFreeze({ ...value, cases: [...value.cases] });
}

function entry(
  operationClass: KpFiniteBinderCaseClass,
  title: string,
  sourceLatex: string,
  targetLatex: string,
  disposition: Exclude<KpFiniteBinderCaseDisposition, "typed-gap">,
  requiredEvidenceIds: readonly string[],
  rationale: string
): KpFiniteBinderCaseLedgerEntry {
  return Object.freeze({
    id: `finite-binder.${operationClass}`,
    operationClass,
    title,
    sourceLatex,
    targetLatex,
    disposition,
    requiredEvidenceIds: Object.freeze([...requiredEvidenceIds]),
    rationale
  });
}

function gap(
  operationClass: KpFiniteBinderCaseClass,
  title: string,
  sourceLatex: string,
  requiredEvidenceIds: readonly string[],
  rationale: string
): KpFiniteBinderCaseLedgerEntry {
  return Object.freeze({
    id: `finite-binder.${operationClass}`,
    operationClass,
    title,
    sourceLatex,
    disposition: "typed-gap" as const,
    requiredEvidenceIds: Object.freeze([...requiredEvidenceIds]),
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
