import type { KpVectorSpace } from "./algebraic-structures.ts";
import type { KpLinearMap } from "./linear-map.ts";
import { sameKpSemanticSpace } from "./semantic-space.ts";

export interface KpDifferentiableMap<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string = string,
  CodomainId extends string = string
> {
  readonly kind: "differentiable-map";
  readonly id: string;
  readonly domain: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly codomain: KpVectorSpace<Codomain, Scalar, CodomainId>;
  readonly evaluate: (value: Domain) => Codomain;
  readonly derivativeAt: (
    value: Domain
  ) => KpLinearMap<Domain, Codomain, Scalar, DomainId, CodomainId>;
  readonly sourceFunctionIds: readonly string[];
}

export interface KpDifferentiableMapRequiredGap {
  readonly status: "repair-required";
  readonly code: "kp.calculus.differentiable-map-required";
  readonly sourceId: string;
  readonly requirement: "derivativeAt";
  readonly message: string;
  readonly repair: string;
}

export function createKpDifferentiableMap<
  Domain,
  Codomain,
  Scalar,
  const DomainId extends string,
  const CodomainId extends string
>(input: {
  readonly id: string;
  readonly domain: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly codomain: KpVectorSpace<Codomain, Scalar, CodomainId>;
  readonly evaluate: (value: Domain) => Codomain;
  readonly derivativeAt: (
    value: Domain
  ) => KpLinearMap<
    NoInfer<Domain>,
    NoInfer<Codomain>,
    NoInfer<Scalar>,
    NoInfer<DomainId>,
    NoInfer<CodomainId>
  >;
  readonly sourceFunctionIds?: readonly string[] | undefined;
}): KpDifferentiableMap<Domain, Codomain, Scalar, DomainId, CodomainId> {
  requireText(input.id, "Differentiable map id");
  requireCompatibleScalars(input.id, input.domain, input.codomain);
  const sourceFunctionIds = input.sourceFunctionIds ?? [input.id];
  if (sourceFunctionIds.length === 0) {
    throw new Error(
      `Differentiable map ${input.id} requires source function identity.`
    );
  }
  sourceFunctionIds.forEach((id) => requireText(
    id,
    `Differentiable map ${input.id} source id`
  ));

  const derivativeAt = (value: Domain) => {
    const derivative = input.derivativeAt(value);
    if (!sameKpSemanticSpace(derivative.domain.space, input.domain.space)) {
      throw new Error(
        `Differentiable map ${input.id} derivative domain must be ` +
        `${input.domain.space.id}; received ${derivative.domain.space.id}.`
      );
    }
    if (!sameKpSemanticSpace(
      derivative.codomain.space,
      input.codomain.space
    )) {
      throw new Error(
        `Differentiable map ${input.id} derivative codomain must be ` +
        `${input.codomain.space.id}; received ${derivative.codomain.space.id}.`
      );
    }
    return derivative;
  };

  return Object.freeze({
    kind: "differentiable-map" as const,
    id: input.id,
    domain: input.domain,
    codomain: input.codomain,
    evaluate: input.evaluate,
    derivativeAt,
    sourceFunctionIds: Object.freeze([...sourceFunctionIds])
  });
}

export function createKpDifferentiableMapRequiredGap(input: {
  readonly sourceId: string;
  readonly message?: string | undefined;
  readonly repair?: string | undefined;
}): KpDifferentiableMapRequiredGap {
  requireText(input.sourceId, "Differentiable-map gap source id");
  return Object.freeze({
    status: "repair-required" as const,
    code: "kp.calculus.differentiable-map-required" as const,
    sourceId: input.sourceId,
    requirement: "derivativeAt" as const,
    message: input.message ??
      `Source ${input.sourceId} has no declared coordinate-free derivative.`,
    repair: input.repair ??
      "Supply a differentiable-map adapter with an explicit derivativeAt map."
  });
}

function requireCompatibleScalars<Domain, Codomain, Scalar>(
  id: string,
  domain: KpVectorSpace<Domain, Scalar>,
  codomain: KpVectorSpace<Codomain, Scalar>
): void {
  if (
    domain.scalars.carrierId !== codomain.scalars.carrierId ||
    domain.scalars.equality.id !== codomain.scalars.equality.id
  ) {
    throw new Error(
      `Differentiable map ${id} requires compatible scalar systems.`
    );
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
