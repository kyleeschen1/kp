export type KpLogExponentAssumptionId =
  | "assumption.log-exponent.variable-real"
  | "assumption.log-exponent.base-positive"
  | "assumption.log-exponent.base-not-one"
  | "assumption.log-exponent.right-positive"
  | "assumption.log-exponent.power-positive"
  | "assumption.log-exponent.log-injective"
  | "assumption.log-exponent.log-base-nonzero";

export type KpLogExponentPredicate =
  | { readonly kind: "member"; readonly semanticId: string; readonly set: "real" }
  | { readonly kind: "positive"; readonly semanticId: string }
  | { readonly kind: "not-equal"; readonly semanticId: string; readonly value: number }
  | { readonly kind: "injective-on-positive-reals"; readonly function: "natural-log" }
  | { readonly kind: "nonzero"; readonly semanticId: string };

export interface KpLogExponentDomainAssumption {
  readonly id: KpLogExponentAssumptionId;
  readonly status: "given" | "derived";
  readonly predicate: KpLogExponentPredicate;
  readonly reason: string;
}

export interface KpLogExponentDomainContract {
  readonly schemaVersion: "kp.log-exponent-domain-contract.v1";
  readonly base: number;
  readonly rightValue: number;
  readonly variableDomain: "real";
  readonly assumptions: readonly KpLogExponentDomainAssumption[];
}

export function createKpLogExponentDomainContract(input: {
  readonly base: number;
  readonly rightValue: number;
}): KpLogExponentDomainContract {
  requireFinite(input.base, "Exponential base");
  requireFinite(input.rightValue, "Right-hand value");
  if (input.base <= 0) {
    throw new Error("A real logarithmic solve requires an exponential base greater than zero.");
  }
  if (input.base === 1) {
    throw new Error("A real logarithmic solve requires an exponential base other than one.");
  }
  if (input.rightValue <= 0) {
    throw new Error("The right-hand logarithm requires a positive argument.");
  }

  return Object.freeze({
    schemaVersion: "kp.log-exponent-domain-contract.v1" as const,
    base: input.base,
    rightValue: input.rightValue,
    variableDomain: "real" as const,
    assumptions: Object.freeze([
      assumption(
        "variable-real",
        "given",
        { kind: "member", semanticId: "semantic.unknown.x", set: "real" },
        "The exemplar solves for a real exponent."
      ),
      assumption(
        "base-positive",
        "given",
        { kind: "positive", semanticId: "semantic.base.two" },
        "A positive base makes the exponential positive for every real exponent."
      ),
      assumption(
        "base-not-one",
        "given",
        { kind: "not-equal", semanticId: "semantic.base.two", value: 1 },
        "A non-unit base makes the exponential one-to-one and its logarithm nonzero."
      ),
      assumption(
        "right-positive",
        "given",
        { kind: "positive", semanticId: "semantic.value.seven" },
        "The right-hand side must lie in the natural logarithm domain."
      ),
      assumption(
        "power-positive",
        "derived",
        { kind: "positive", semanticId: "semantic.power.two-to-x" },
        "A positive base raised to a real power is positive."
      ),
      assumption(
        "log-injective",
        "derived",
        { kind: "injective-on-positive-reals", function: "natural-log" },
        "Natural logarithm preserves equivalence between positive equal quantities."
      ),
      assumption(
        "log-base-nonzero",
        "derived",
        { kind: "nonzero", semanticId: "semantic.value.log-two" },
        "Because the base is not one, its natural logarithm is safe to divide by."
      )
    ])
  });
}

export const kpCanonicalLogExponentDomainContract =
  createKpLogExponentDomainContract({ base: 2, rightValue: 7 });

function assumption(
  suffix: string,
  status: "given" | "derived",
  predicate: KpLogExponentPredicate,
  reason: string
): KpLogExponentDomainAssumption {
  return Object.freeze({
    id: `assumption.log-exponent.${suffix}` as KpLogExponentAssumptionId,
    status,
    predicate: Object.freeze(predicate),
    reason
  });
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
}
