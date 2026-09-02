import type { KpCoordinateTuple, KpFiniteBasis } from "./finite-basis.ts";
import {
  createKpLawEvidence,
  type KpLawEvidence
} from "./law-evidence.ts";
import type { KpScalarMatrix } from "./matrix-representation.ts";
import type { KpSecondDerivativeMap } from "./second-derivative-map.ts";
import { sameKpSemanticSpace } from "./semantic-space.ts";

export interface KpCompactSecondDerivativeRef {
  readonly kind: "compact-second-derivative";
  readonly id: string;
  readonly operator: "D2";
  readonly sourceFunctionId: string;
  readonly secondDerivativeMapId: string;
}

export interface KpHessianProjection<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string,
  Size extends number
> {
  readonly status: "projected";
  readonly kind: "hessian-projection";
  readonly id: string;
  readonly compact: KpCompactSecondDerivativeRef;
  readonly secondDerivative: KpSecondDerivativeMap<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId
  >;
  readonly domainBasis: KpFiniteBasis<Domain, Scalar, DomainId, Size>;
  readonly codomainBasis: KpFiniteBasis<Codomain, Scalar, CodomainId, 1>;
  readonly rows: KpScalarMatrix<Scalar, Size, Size>;
  readonly rowCount: Size;
  readonly columnCount: Size;
  readonly symmetryEvidence: KpLawEvidence;
}

export interface KpHessianBasisRequiredGap<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string
> {
  readonly status: "repair-required";
  readonly code: "kp.calculus.basis-required";
  readonly sourceId: string;
  readonly compact: KpCompactSecondDerivativeRef;
  readonly secondDerivative: KpSecondDerivativeMap<
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

export type KpHessianProjectionResult<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string,
  Size extends number
> = KpHessianProjection<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId,
  Size
> | KpHessianBasisRequiredGap<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId
>;

export function projectKpSecondDerivativeToHessian<
  Domain,
  Codomain,
  Scalar,
  const DomainId extends string,
  const CodomainId extends string,
  const Size extends number
>(input: {
  readonly id: string;
  readonly sourceFunctionId: string;
  readonly secondDerivative: KpSecondDerivativeMap<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId
  >;
  readonly domainBasis?: KpFiniteBasis<
    NoInfer<Domain>,
    NoInfer<Scalar>,
    NoInfer<DomainId>,
    Size
  > | undefined;
  readonly codomainBasis?: KpFiniteBasis<
    NoInfer<Codomain>,
    NoInfer<Scalar>,
    NoInfer<CodomainId>,
    1
  > | undefined;
  readonly symmetryEvidence: KpLawEvidence;
}): KpHessianProjectionResult<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId,
  Size
> {
  requireText(input.id, "Hessian projection id");
  requireText(input.sourceFunctionId, "Hessian source function id");
  const compact = Object.freeze({
    kind: "compact-second-derivative" as const,
    id: `${input.id}.compact`,
    operator: "D2" as const,
    sourceFunctionId: input.sourceFunctionId,
    secondDerivativeMapId: input.secondDerivative.id
  });
  const missing = [
    ...(input.domainBasis === undefined ? ["domain-basis" as const] : []),
    ...(input.codomainBasis === undefined ? ["codomain-basis" as const] : [])
  ];
  if (missing.length > 0) {
    return Object.freeze({
      status: "repair-required" as const,
      code: "kp.calculus.basis-required" as const,
      sourceId: input.sourceFunctionId,
      compact,
      secondDerivative: input.secondDerivative,
      missing: Object.freeze(missing) as KpHessianBasisRequiredGap<
        Domain,
        Codomain,
        Scalar,
        DomainId,
        CodomainId
      >["missing"],
      message: `Hessian projection ${input.id} requires ${missing.join(" and ")}.`,
      repair: "Supply explicit finite bases for the domain and scalar codomain."
    });
  }

  const domainBasis = input.domainBasis!;
  const codomainBasis = input.codomainBasis!;
  validateBasisSpaces(input.id, input.secondDerivative, domainBasis, codomainBasis);
  const symmetryEvidence = validateSymmetryEvidence(
    input.id,
    input.symmetryEvidence,
    input.secondDerivative
  );
  const rows = Object.freeze(domainBasis.vectors.map((left) =>
    Object.freeze(domainBasis.vectors.map((right) =>
      codomainBasis.coordinates(input.secondDerivative.apply(left, right))[0]!
    )) as unknown as KpCoordinateTuple<Scalar, Size>
  )) as unknown as KpScalarMatrix<Scalar, Size, Size>;

  return Object.freeze({
    status: "projected" as const,
    kind: "hessian-projection" as const,
    id: input.id,
    compact,
    secondDerivative: input.secondDerivative,
    domainBasis,
    codomainBasis,
    rows,
    rowCount: domainBasis.size,
    columnCount: domainBasis.size,
    symmetryEvidence
  });
}

function validateBasisSpaces<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string,
  Size extends number
>(
  id: string,
  derivative: KpSecondDerivativeMap<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId
  >,
  domainBasis: KpFiniteBasis<Domain, Scalar, DomainId, Size>,
  codomainBasis: KpFiniteBasis<Codomain, Scalar, CodomainId, 1>
): void {
  if (!sameKpSemanticSpace(derivative.domain.space, domainBasis.space.space)) {
    throw new Error(`Hessian projection ${id} has a mismatched domain basis.`);
  }
  if (!sameKpSemanticSpace(
    derivative.codomain.space,
    codomainBasis.space.space
  )) {
    throw new Error(`Hessian projection ${id} has a mismatched codomain basis.`);
  }
}

function validateSymmetryEvidence<Domain, Codomain, Scalar>(
  id: string,
  evidence: KpLawEvidence,
  derivative: KpSecondDerivativeMap<Domain, Codomain, Scalar>
): KpLawEvidence {
  const validated = createKpLawEvidence(evidence);
  if (
    validated.kind === "tested" &&
    validated.equalityId !== derivative.codomain.vectors.equality.id
  ) {
    throw new Error(
      `Hessian projection ${id} symmetry must use equality ` +
      `${derivative.codomain.vectors.equality.id}.`
    );
  }
  return validated;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
