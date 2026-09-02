import type { KpVectorSpace } from "./algebraic-structures.ts";
import {
  createKpLawEvidence,
  type KpLawEvidence
} from "./law-evidence.ts";
import type { KpLinearMap } from "./linear-map.ts";
import { sameKpSemanticSpace } from "./semantic-space.ts";

export interface KpInnerProductDuality<
  Domain,
  Scalar,
  DomainId extends string = string,
  ScalarSpaceId extends string = string
> {
  readonly kind: "inner-product-duality";
  readonly id: string;
  readonly space: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly scalarSpace: KpVectorSpace<Scalar, Scalar, ScalarSpaceId>;
  readonly pair: (left: Domain, right: Domain) => Scalar;
  readonly vectorFromCovector: (
    covector: KpLinearMap<
      Domain,
      Scalar,
      Scalar,
      DomainId,
      ScalarSpaceId
    >
  ) => Domain;
  readonly representationEvidence: KpLawEvidence;
}

export interface KpGradientIdentification<
  Domain,
  Scalar,
  DomainId extends string,
  ScalarSpaceId extends string
> {
  readonly status: "identified";
  readonly kind: "gradient-identification";
  readonly id: string;
  readonly covector: KpLinearMap<
    Domain,
    Scalar,
    Scalar,
    DomainId,
    ScalarSpaceId
  >;
  readonly duality: KpInnerProductDuality<
    Domain,
    Scalar,
    DomainId,
    ScalarSpaceId
  >;
  readonly gradient: Domain;
}

export interface KpInnerProductRequiredGap<
  Domain,
  Scalar,
  DomainId extends string,
  ScalarSpaceId extends string
> {
  readonly status: "repair-required";
  readonly code: "kp.calculus.inner-product-required";
  readonly sourceId: string;
  readonly covector: KpLinearMap<
    Domain,
    Scalar,
    Scalar,
    DomainId,
    ScalarSpaceId
  >;
  readonly message: string;
  readonly repair: string;
}

export type KpGradientIdentificationResult<
  Domain,
  Scalar,
  DomainId extends string,
  ScalarSpaceId extends string
> = KpGradientIdentification<Domain, Scalar, DomainId, ScalarSpaceId> |
  KpInnerProductRequiredGap<Domain, Scalar, DomainId, ScalarSpaceId>;

export function createKpInnerProductDuality<
  Domain,
  Scalar,
  const DomainId extends string,
  const ScalarSpaceId extends string
>(input: {
  readonly id: string;
  readonly space: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly scalarSpace: KpVectorSpace<Scalar, Scalar, ScalarSpaceId>;
  readonly pair: (left: Domain, right: Domain) => Scalar;
  readonly vectorFromCovector: (
    covector: KpLinearMap<
      NoInfer<Domain>,
      NoInfer<Scalar>,
      NoInfer<Scalar>,
      NoInfer<DomainId>,
      NoInfer<ScalarSpaceId>
    >
  ) => Domain;
  readonly representationEvidence: KpLawEvidence;
}): KpInnerProductDuality<Domain, Scalar, DomainId, ScalarSpaceId> {
  requireText(input.id, "Inner-product duality id");
  if (
    input.space.scalars.carrierId !== input.scalarSpace.scalars.carrierId ||
    input.space.scalars.equality.id !== input.scalarSpace.scalars.equality.id
  ) {
    throw new Error(
      `Inner-product duality ${input.id} requires compatible scalar systems.`
    );
  }
  const representationEvidence = createKpLawEvidence(
    input.representationEvidence
  );
  if (
    representationEvidence.kind === "tested" &&
    representationEvidence.equalityId !==
      input.scalarSpace.vectors.equality.id
  ) {
    throw new Error(
      `Inner-product duality ${input.id} evidence must use equality ` +
      `${input.scalarSpace.vectors.equality.id}.`
    );
  }
  return Object.freeze({
    kind: "inner-product-duality" as const,
    id: input.id,
    space: input.space,
    scalarSpace: input.scalarSpace,
    pair: input.pair,
    vectorFromCovector: input.vectorFromCovector,
    representationEvidence
  });
}

export function identifyKpGradient<
  Domain,
  Scalar,
  const DomainId extends string,
  const ScalarSpaceId extends string
>(input: {
  readonly id: string;
  readonly covector: KpLinearMap<
    Domain,
    Scalar,
    Scalar,
    DomainId,
    ScalarSpaceId
  >;
  readonly duality?: KpInnerProductDuality<
    NoInfer<Domain>,
    NoInfer<Scalar>,
    NoInfer<DomainId>,
    NoInfer<ScalarSpaceId>
  > | undefined;
}): KpGradientIdentificationResult<
  Domain,
  Scalar,
  DomainId,
  ScalarSpaceId
> {
  requireText(input.id, "Gradient identification id");
  if (input.duality === undefined) {
    return Object.freeze({
      status: "repair-required" as const,
      code: "kp.calculus.inner-product-required" as const,
      sourceId: input.covector.id,
      covector: input.covector,
      message: `Covector ${input.covector.id} does not determine a gradient alone.`,
      repair: "Supply an inner-product duality for the derivative domain."
    });
  }
  if (!sameKpSemanticSpace(
    input.covector.domain.space,
    input.duality.space.space
  )) {
    throw new Error(
      `Gradient identification ${input.id} has a mismatched domain duality.`
    );
  }
  if (!sameKpSemanticSpace(
    input.covector.codomain.space,
    input.duality.scalarSpace.space
  )) {
    throw new Error(
      `Gradient identification ${input.id} has a mismatched scalar duality.`
    );
  }
  return Object.freeze({
    status: "identified" as const,
    kind: "gradient-identification" as const,
    id: input.id,
    covector: input.covector,
    duality: input.duality,
    gradient: input.duality.vectorFromCovector(input.covector)
  });
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
