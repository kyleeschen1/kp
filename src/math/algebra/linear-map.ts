import type { KpVectorSpace } from "./algebraic-structures.ts";
import {
  createKpLawEvidence,
  type KpLawEvidence
} from "./law-evidence.ts";
import { sameKpSemanticSpace } from "./semantic-space.ts";

export interface KpLinearMap<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string = string,
  CodomainId extends string = string
> {
  readonly kind: "linear-map";
  readonly id: string;
  readonly domain: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly codomain: KpVectorSpace<Codomain, Scalar, CodomainId>;
  readonly apply: (value: Domain) => Codomain;
  readonly linearity: KpLawEvidence;
  readonly sourceMapIds: readonly string[];
}

export function createKpLinearMap<
  Domain,
  Codomain,
  Scalar,
  const DomainId extends string,
  const CodomainId extends string
>(input: {
  readonly id: string;
  readonly domain: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly codomain: KpVectorSpace<Codomain, Scalar, CodomainId>;
  readonly apply: (value: Domain) => Codomain;
  readonly linearity: KpLawEvidence;
  readonly sourceMapIds?: readonly string[] | undefined;
}): KpLinearMap<Domain, Codomain, Scalar, DomainId, CodomainId> {
  requireText(input.id, "Linear map id");
  requireCompatibleScalars(input.id, input.domain, input.codomain);
  const sourceMapIds = input.sourceMapIds ?? [input.id];
  if (sourceMapIds.length === 0) {
    throw new Error(`Linear map ${input.id} requires source map identity.`);
  }
  sourceMapIds.forEach((id) => requireText(id, `Linear map ${input.id} source id`));
  return Object.freeze({
    kind: "linear-map" as const,
    id: input.id,
    domain: input.domain,
    codomain: input.codomain,
    apply: input.apply,
    linearity: createKpLawEvidence(input.linearity),
    sourceMapIds: Object.freeze([...sourceMapIds])
  });
}

export function identityKpLinearMap<
  Value,
  Scalar,
  const SpaceId extends string
>(input: {
  readonly id: string;
  readonly space: KpVectorSpace<Value, Scalar, SpaceId>;
}): KpLinearMap<Value, Value, Scalar, SpaceId, SpaceId> {
  return createKpLinearMap({
    id: input.id,
    domain: input.space,
    codomain: input.space,
    apply: (value) => value,
    linearity: {
      kind: "proved",
      authorityId: "kp.math.linear-map.identity.v1"
    }
  });
}

export function composeKpLinearMaps<
  Source,
  Intermediate,
  Target,
  Scalar,
  const SourceId extends string,
  const IntermediateId extends string,
  const TargetId extends string
>(input: {
  readonly id: string;
  readonly inner: KpLinearMap<
    Source,
    Intermediate,
    Scalar,
    SourceId,
    IntermediateId
  >;
  readonly outer: KpLinearMap<
    NoInfer<Intermediate>,
    Target,
    NoInfer<Scalar>,
    NoInfer<IntermediateId>,
    TargetId
  >;
}): KpLinearMap<Source, Target, Scalar, SourceId, TargetId> {
  if (!sameKpSemanticSpace(
    input.inner.codomain.space,
    input.outer.domain.space
  )) {
    throw new Error(
      `Linear map ${input.id} cannot compose ${input.inner.codomain.space.id} ` +
      `with ${input.outer.domain.space.id}.`
    );
  }
  return createKpLinearMap({
    id: input.id,
    domain: input.inner.domain,
    codomain: input.outer.codomain,
    apply: (value) => input.outer.apply(input.inner.apply(value)),
    linearity: {
      kind: "proved",
      authorityId: "kp.math.linear-map.compose.v1"
    },
    sourceMapIds: [input.inner.id, input.outer.id]
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
    throw new Error(`Linear map ${id} requires compatible scalar systems.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
