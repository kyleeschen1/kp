export type KpLogQuotientAssumptionId =
  | "assumption.log-quotient.x-positive"
  | "assumption.log-quotient.y-positive"
  | "assumption.log-quotient.shared-base"
  | "assumption.log-quotient.quotient-positive";

export type KpLogarithmBase = "e" | number;

export type KpLogQuotientPredicate =
  | { readonly kind: "positive"; readonly semanticId: string }
  | {
      readonly kind: "same-logarithm-base";
      readonly sourceLeftBase: KpLogarithmBase;
      readonly sourceRightBase: KpLogarithmBase;
      readonly targetBase: KpLogarithmBase;
    };

export interface KpLogQuotientDomainAssumption {
  readonly id: KpLogQuotientAssumptionId;
  readonly status: "given" | "derived";
  readonly predicate: KpLogQuotientPredicate;
  readonly reason: string;
}

export interface KpLogQuotientDomainContract {
  readonly schemaVersion: "kp.log-quotient-domain-contract.v1";
  readonly logarithmBase: KpLogarithmBase;
  readonly assumptions: readonly KpLogQuotientDomainAssumption[];
}

export function createKpLogQuotientDomainContract(input: {
  readonly sourceLeftBase: KpLogarithmBase;
  readonly sourceRightBase: KpLogarithmBase;
  readonly targetBase: KpLogarithmBase;
}): KpLogQuotientDomainContract {
  validateBase(input.sourceLeftBase, "Left source logarithm");
  validateBase(input.sourceRightBase, "Right source logarithm");
  validateBase(input.targetBase, "Target logarithm");
  if (
    input.sourceLeftBase !== input.sourceRightBase ||
    input.sourceLeftBase !== input.targetBase
  ) {
    throw new Error(
      "A log-quotient rewrite requires both source logarithms and the target logarithm to share one base."
    );
  }

  const logarithmBase = input.sourceLeftBase;
  return Object.freeze({
    schemaVersion: "kp.log-quotient-domain-contract.v1" as const,
    logarithmBase,
    assumptions: Object.freeze([
      assumption(
        "x-positive",
        "given",
        { kind: "positive", semanticId: "semantic.log-quotient.variable.x" },
        "The first logarithm requires x to be positive in the real-valued setting."
      ),
      assumption(
        "y-positive",
        "given",
        { kind: "positive", semanticId: "semantic.log-quotient.variable.y" },
        "The second logarithm and quotient denominator require y to be positive."
      ),
      assumption(
        "shared-base",
        "given",
        {
          kind: "same-logarithm-base",
          sourceLeftBase: logarithmBase,
          sourceRightBase: logarithmBase,
          targetBase: logarithmBase
        },
        "The quotient law combines logarithms only when all three use the same base."
      ),
      assumption(
        "quotient-positive",
        "derived",
        { kind: "positive", semanticId: "semantic.log-quotient.quotient.x-over-y" },
        "Positive x and y imply that x divided by y is a valid logarithm argument."
      )
    ])
  });
}

export const kpCanonicalLogQuotientDomainContract =
  createKpLogQuotientDomainContract({
    sourceLeftBase: "e",
    sourceRightBase: "e",
    targetBase: "e"
  });

function assumption(
  suffix: "x-positive" | "y-positive" | "shared-base" | "quotient-positive",
  status: "given" | "derived",
  predicate: KpLogQuotientPredicate,
  reason: string
): KpLogQuotientDomainAssumption {
  return Object.freeze({
    id: `assumption.log-quotient.${suffix}` as KpLogQuotientAssumptionId,
    status,
    predicate: Object.freeze(predicate),
    reason
  });
}

function validateBase(base: KpLogarithmBase, label: string): void {
  if (base === "e") return;
  if (!Number.isFinite(base)) {
    throw new Error(`${label} base must be finite.`);
  }
  if (base <= 0 || base === 1) {
    throw new Error(`${label} base must be positive and other than one.`);
  }
}
