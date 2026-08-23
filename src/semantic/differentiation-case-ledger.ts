export const KP_DIFFERENTIATION_CASE_LEDGER_AUTHORITY =
  "coverage.equation.differentiation-cases.v1" as const;

export type KpDifferentiationCaseClass =
  | "canonical-positive-integer-power"
  | "other-positive-integer-power"
  | "symbolic-exponent"
  | "constant"
  | "negative-power"
  | "compound-base"
  | "chain-rule";

export type KpDifferentiationCaseDisposition =
  | "verified-exemplar"
  | "semantic-only"
  | "typed-gap";

export interface KpDifferentiationCaseLedgerEntry {
  readonly id: string;
  readonly operationClass: KpDifferentiationCaseClass;
  readonly title: string;
  readonly sourceLatex: string;
  readonly targetLatex?: string | undefined;
  readonly disposition: KpDifferentiationCaseDisposition;
  readonly requiredEvidenceIds: readonly string[];
  readonly rationale: string;
}

export interface KpDifferentiationCaseLedger {
  readonly schemaVersion: "kp.differentiation-case-ledger.v1";
  readonly kind: "differentiation-case-ledger";
  readonly authority: typeof KP_DIFFERENTIATION_CASE_LEDGER_AUTHORITY;
  readonly cases: readonly KpDifferentiationCaseLedgerEntry[];
}

const cases = [
  executable(
    "canonical-positive-integer-power",
    "Differentiate the reviewed cubic",
    "\\frac{d}{dx}x^3",
    "3x^2",
    "verified-exemplar",
    [
      "animation.generated.calculus.derivative.power-rule-x-cubed",
      "law.calculus.derivative.power-rule",
      "kp.presentation.operation-evaluation.difference"
    ],
    "The reversible flat-2D checkpoint exposes exponent branching and the decrement evaluation."
  ),
  executable(
    "other-positive-integer-power",
    "Represent another positive integer power",
    "\\frac{d}{dx}x^5",
    "5x^4",
    "semantic-only",
    [
      "src/semantic/derivative-power-rule-semantics.ts",
      "law.calculus.derivative.power-rule"
    ],
    "The semantic model accepts the shape, but one reviewed cubic does not certify generalized presentation."
  ),
  gap(
    "symbolic-exponent",
    "Defer a symbolic exponent",
    "\\frac{d}{dx}x^n",
    ["normalizer.equation.symbolic-power-rule.v1"],
    "A symbolic exponent needs explicit assumptions and cannot reuse integer decrement evidence silently."
  ),
  gap(
    "constant",
    "Defer the constant rule",
    "\\frac{d}{dx}7",
    ["operation.equation.derivative-constant-rule.v1"],
    "A constant derivative is a different semantic operation, not a degenerate power-rule animation."
  ),
  gap(
    "negative-power",
    "Defer a negative power",
    "\\frac{d}{dx}x^{-2}",
    ["normalizer.equation.signed-exponent.v1"],
    "Signed exponent notation and target layout need independent pressure before visual reuse."
  ),
  gap(
    "compound-base",
    "Defer a compound powered base",
    "\\frac{d}{dx}(x+1)^3",
    ["operation.equation.derivative-chain-rule.v1"],
    "A compound base invokes chain-rule structure and must not masquerade as the monomial exemplar."
  ),
  gap(
    "chain-rule",
    "Defer nested function differentiation",
    "\\frac{d}{dx}f(g(x))",
    ["operation.equation.derivative-chain-rule.v1"],
    "Outer and inner derivative lineage requires a distinct pressure caller."
  )
] as const;

export const kpDifferentiationCaseLedger = defineKpDifferentiationCaseLedger({
  schemaVersion: "kp.differentiation-case-ledger.v1",
  kind: "differentiation-case-ledger",
  authority: KP_DIFFERENTIATION_CASE_LEDGER_AUTHORITY,
  cases
});

export function defineKpDifferentiationCaseLedger(
  value: KpDifferentiationCaseLedger
): KpDifferentiationCaseLedger {
  const ids = new Set<string>();
  const classes = new Set<KpDifferentiationCaseClass>();
  for (const candidate of value.cases) {
    if (ids.has(candidate.id)) {
      throw new Error(`Duplicate differentiation case ${candidate.id}.`);
    }
    if (classes.has(candidate.operationClass)) {
      throw new Error(
        `Duplicate differentiation case class ${candidate.operationClass}.`
      );
    }
    if (candidate.disposition === "typed-gap" &&
        candidate.targetLatex !== undefined) {
      throw new Error(
        `Typed-gap differentiation case ${candidate.id} cannot claim a target.`
      );
    }
    if (candidate.disposition !== "typed-gap" &&
        candidate.targetLatex === undefined) {
      throw new Error(
        `Executable differentiation case ${candidate.id} requires a target.`
      );
    }
    if (candidate.requiredEvidenceIds.length === 0) {
      throw new Error(
        `Differentiation case ${candidate.id} requires evidence.`
      );
    }
    ids.add(candidate.id);
    classes.add(candidate.operationClass);
  }
  return deepFreeze({ ...value, cases: [...value.cases] });
}

function executable(
  operationClass: KpDifferentiationCaseClass,
  title: string,
  sourceLatex: string,
  targetLatex: string,
  disposition: Exclude<KpDifferentiationCaseDisposition, "typed-gap">,
  requiredEvidenceIds: readonly string[],
  rationale: string
): KpDifferentiationCaseLedgerEntry {
  return Object.freeze({
    id: `differentiation.${operationClass}`,
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
  operationClass: KpDifferentiationCaseClass,
  title: string,
  sourceLatex: string,
  requiredEvidenceIds: readonly string[],
  rationale: string
): KpDifferentiationCaseLedgerEntry {
  return Object.freeze({
    id: `differentiation.${operationClass}`,
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
