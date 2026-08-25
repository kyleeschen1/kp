export const KP_INTEGRATION_CASE_LEDGER_AUTHORITY =
  "coverage.equation.integration-power-rule-cases.v1" as const;

export type KpIntegrationCaseClass =
  | "canonical-monic-quadratic"
  | "negative-one-exponent"
  | "arbitrary-exponent"
  | "definite-integral"
  | "substitution"
  | "area-accumulation"
  | "fundamental-theorem"
  | "unsupported-edited-variant";

export type KpIntegrationCaseDisposition =
  | "exemplar-candidate"
  | "typed-gap";

export interface KpIntegrationCaseRepair {
  readonly code:
    | "integration.logarithmic-case-required"
    | "integration.symbolic-exponent-proof-required"
    | "integration.definite-bounds-operation-required"
    | "integration.substitution-operation-required"
    | "integration.area-semantics-required"
    | "integration.fundamental-theorem-operation-required"
    | "integration.fixture-normalization-required";
  readonly targetId: string;
  readonly summary: string;
}

export interface KpIntegrationCaseLedgerEntry {
  readonly id: string;
  readonly operationClass: KpIntegrationCaseClass;
  readonly title: string;
  readonly sourceLatex: string;
  readonly targetLatex?: string | undefined;
  readonly disposition: KpIntegrationCaseDisposition;
  readonly requiredEvidenceIds: readonly string[];
  readonly repair?: KpIntegrationCaseRepair | undefined;
  readonly rationale: string;
}

export interface KpIntegrationCaseLedger {
  readonly schemaVersion: "kp.integration-case-ledger.v1";
  readonly kind: "integration-case-ledger";
  readonly authority: typeof KP_INTEGRATION_CASE_LEDGER_AUTHORITY;
  readonly cases: readonly KpIntegrationCaseLedgerEntry[];
}

const cases = [
  candidate(
    "canonical-monic-quadratic",
    "Integrate the monic quadratic exemplar",
    "\\int x^2\\,dx",
    "\\frac{x^3}{3}+C",
    [
      "animation.generated.calculus.integral.power-rule-quadratic",
      "law.calculus.integral.power-rule",
      "src/semantic/antiderivative-power-rule-semantics.ts"
    ],
    "This is the single approved discovery exemplar; human review is still required before regression freeze or promotion."
  ),
  gap(
    "negative-one-exponent",
    "Route the logarithmic exception",
    "\\int x^{-1}\\,dx",
    "integration.logarithmic-case-required",
    "operation.equation.integrate-logarithmic-case.v1",
    "The n=-1 antiderivative is logarithmic and cannot use the power-rule quotient."
  ),
  gap(
    "arbitrary-exponent",
    "Defer a symbolic exponent",
    "\\int x^n\\,dx",
    "integration.symbolic-exponent-proof-required",
    "normalizer.equation.symbolic-integration-power.v1",
    "A symbolic exponent needs assumptions, domain evidence, and a distinct pressure caller."
  ),
  gap(
    "definite-integral",
    "Defer definite bounds",
    "\\int_0^1 x^2\\,dx",
    "integration.definite-bounds-operation-required",
    "operation.equation.integrate-definite-power.v1",
    "Bounds and endpoint evaluation introduce semantics absent from the indefinite exemplar."
  ),
  gap(
    "substitution",
    "Defer substitution",
    "\\int 2x\\cos(x^2)\\,dx",
    "integration.substitution-operation-required",
    "operation.equation.integration-substitution.v1",
    "Substitution needs inner-expression lineage and a separate operation contract."
  ),
  gap(
    "area-accumulation",
    "Defer area accumulation",
    "\\operatorname{Area}_{[0,1]}(x^2)",
    "integration.area-semantics-required",
    "operation.graph.area-accumulation.v1",
    "Geometric area and signed accumulation require graph correspondence beyond symbolic rewriting."
  ),
  gap(
    "fundamental-theorem",
    "Defer Fundamental Theorem choreography",
    "\\frac{d}{dx}\\int_0^x t^2\\,dt",
    "integration.fundamental-theorem-operation-required",
    "operation.equation.fundamental-theorem-calculus.v1",
    "The derivative-integral relationship is a distinct semantic operation, not a terminal power-rule evaluation."
  ),
  gap(
    "unsupported-edited-variant",
    "Reject an unbound edited variable",
    "\\int y^2\\,dx",
    "integration.fixture-normalization-required",
    "normalizer.equation.integration-variable-binding.v1",
    "The differential must bind the integrand variable before governed construction can proceed."
  )
] as const;

export const kpIntegrationCaseLedger = defineKpIntegrationCaseLedger({
  schemaVersion: "kp.integration-case-ledger.v1",
  kind: "integration-case-ledger",
  authority: KP_INTEGRATION_CASE_LEDGER_AUTHORITY,
  cases
});

export function defineKpIntegrationCaseLedger(
  value: KpIntegrationCaseLedger
): KpIntegrationCaseLedger {
  const ids = new Set<string>();
  const classes = new Set<KpIntegrationCaseClass>();
  const repairTargets = new Set<string>();
  for (const candidate of value.cases) {
    if (ids.has(candidate.id)) {
      throw new Error(`Duplicate integration case ${candidate.id}.`);
    }
    if (classes.has(candidate.operationClass)) {
      throw new Error(
        `Duplicate integration case class ${candidate.operationClass}.`
      );
    }
    if (candidate.disposition === "typed-gap") {
      if (candidate.targetLatex !== undefined) {
        throw new Error(
          `Typed-gap integration case ${candidate.id} cannot claim a target.`
        );
      }
      if (candidate.repair === undefined) {
        throw new Error(
          `Typed-gap integration case ${candidate.id} requires a repair.`
        );
      }
      if (repairTargets.has(candidate.repair.targetId)) {
        throw new Error(
          `Duplicate integration repair target ${candidate.repair.targetId}.`
        );
      }
      repairTargets.add(candidate.repair.targetId);
    } else {
      if (candidate.targetLatex === undefined) {
        throw new Error(
          `Integration exemplar candidate ${candidate.id} requires a target.`
        );
      }
      if (candidate.repair !== undefined) {
        throw new Error(
          `Integration exemplar candidate ${candidate.id} cannot carry a repair.`
        );
      }
    }
    if (candidate.requiredEvidenceIds.length === 0) {
      throw new Error(`Integration case ${candidate.id} requires evidence.`);
    }
    ids.add(candidate.id);
    classes.add(candidate.operationClass);
  }
  return deepFreeze({ ...value, cases: [...value.cases] });
}

function candidate(
  operationClass: KpIntegrationCaseClass,
  title: string,
  sourceLatex: string,
  targetLatex: string,
  requiredEvidenceIds: readonly string[],
  rationale: string
): KpIntegrationCaseLedgerEntry {
  return Object.freeze({
    id: `integration.${operationClass}`,
    operationClass,
    title,
    sourceLatex,
    targetLatex,
    disposition: "exemplar-candidate" as const,
    requiredEvidenceIds: Object.freeze([...requiredEvidenceIds]),
    rationale
  });
}

function gap(
  operationClass: KpIntegrationCaseClass,
  title: string,
  sourceLatex: string,
  code: KpIntegrationCaseRepair["code"],
  targetId: string,
  rationale: string
): KpIntegrationCaseLedgerEntry {
  return Object.freeze({
    id: `integration.${operationClass}`,
    operationClass,
    title,
    sourceLatex,
    disposition: "typed-gap" as const,
    requiredEvidenceIds: Object.freeze([targetId]),
    repair: Object.freeze({ code, targetId, summary: rationale }),
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
