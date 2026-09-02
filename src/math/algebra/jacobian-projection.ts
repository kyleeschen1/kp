import type { KpDifferentiableMap } from "./differentiable-map.ts";
import type { KpFiniteBasis } from "./finite-basis.ts";
import type { KpLinearMap } from "./linear-map.ts";
import {
  representKpLinearMap,
  type KpMatrixRepresentation
} from "./matrix-representation.ts";

export interface KpCompactDerivativeRef {
  readonly kind: "compact-derivative";
  readonly id: string;
  readonly operator: "D";
  readonly sourceFunctionId: string;
  readonly derivativeMapId: string;
}

export interface KpBasisRequiredGap<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string
> {
  readonly status: "repair-required";
  readonly code: "kp.calculus.basis-required";
  readonly sourceId: string;
  readonly compact: KpCompactDerivativeRef;
  readonly derivative: KpLinearMap<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId
  >;
  readonly missing: readonly [
    "domain-basis" | "codomain-basis",
    ...("domain-basis" | "codomain-basis")[]
  ];
  readonly message: string;
  readonly repair: string;
}

export interface KpJacobianProjection<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string,
  Rows extends number,
  Columns extends number
> {
  readonly status: "projected";
  readonly kind: "jacobian-projection";
  readonly id: string;
  readonly compact: KpCompactDerivativeRef;
  readonly derivative: KpLinearMap<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId
  >;
  readonly representation: KpMatrixRepresentation<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId,
    Rows,
    Columns
  >;
}

export type KpJacobianProjectionResult<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string,
  Rows extends number,
  Columns extends number
> = KpJacobianProjection<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId,
  Rows,
  Columns
> | KpBasisRequiredGap<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId
>;

export function projectKpDerivativeAtToJacobian<
  Domain,
  Codomain,
  Scalar,
  const DomainId extends string,
  const CodomainId extends string,
  const Rows extends number,
  const Columns extends number
>(input: {
  readonly id: string;
  readonly source: KpDifferentiableMap<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId
  >;
  readonly at: Domain;
  readonly domainBasis?: KpFiniteBasis<
    NoInfer<Domain>,
    NoInfer<Scalar>,
    NoInfer<DomainId>,
    Columns
  > | undefined;
  readonly codomainBasis?: KpFiniteBasis<
    NoInfer<Codomain>,
    NoInfer<Scalar>,
    NoInfer<CodomainId>,
    Rows
  > | undefined;
}): KpJacobianProjectionResult<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId,
  Rows,
  Columns
> {
  requireText(input.id, "Jacobian projection id");
  const derivative = input.source.derivativeAt(input.at);
  const compact = Object.freeze({
    kind: "compact-derivative" as const,
    id: `${input.id}.compact`,
    operator: "D" as const,
    sourceFunctionId: input.source.id,
    derivativeMapId: derivative.id
  });
  const missing = [
    ...(input.domainBasis === undefined ? ["domain-basis" as const] : []),
    ...(input.codomainBasis === undefined ? ["codomain-basis" as const] : [])
  ];
  if (missing.length > 0) {
    return Object.freeze({
      status: "repair-required" as const,
      code: "kp.calculus.basis-required" as const,
      sourceId: input.source.id,
      compact,
      derivative,
      missing: Object.freeze(missing) as KpBasisRequiredGap<
        Domain,
        Codomain,
        Scalar,
        DomainId,
        CodomainId
      >["missing"],
      message: `Jacobian projection ${input.id} requires ${missing.join(" and ")}.`,
      repair: "Supply explicit finite bases for every missing semantic space."
    });
  }

  const representation = representKpLinearMap({
    id: `${input.id}.matrix-representation`,
    map: derivative,
    domainBasis: input.domainBasis!,
    codomainBasis: input.codomainBasis!
  });
  return Object.freeze({
    status: "projected" as const,
    kind: "jacobian-projection" as const,
    id: input.id,
    compact,
    derivative,
    representation
  });
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
