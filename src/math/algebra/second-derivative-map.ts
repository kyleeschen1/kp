import type { KpVectorSpace } from "./algebraic-structures.ts";
import {
  createKpLawEvidence,
  type KpLawEvidence
} from "./law-evidence.ts";

/** A bounded bilinear value for D²f(x), not a general tensor hierarchy. */
export interface KpSecondDerivativeMap<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string = string,
  CodomainId extends string = string
> {
  readonly kind: "second-derivative-map";
  readonly id: string;
  readonly domain: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly codomain: KpVectorSpace<Codomain, Scalar, CodomainId>;
  readonly apply: (left: Domain, right: Domain) => Codomain;
  readonly leftLinearity: KpLawEvidence;
  readonly rightLinearity: KpLawEvidence;
  readonly sourceFunctionIds: readonly string[];
}

export interface KpSecondDerivativeRequiredGap {
  readonly status: "repair-required";
  readonly code: "kp.calculus.second-derivative-required";
  readonly sourceId: string;
  readonly requirement: "secondDerivativeAt";
  readonly message: string;
  readonly repair: string;
}

export function createKpSecondDerivativeMap<
  Domain,
  Codomain,
  Scalar,
  const DomainId extends string,
  const CodomainId extends string
>(input: {
  readonly id: string;
  readonly domain: KpVectorSpace<Domain, Scalar, DomainId>;
  readonly codomain: KpVectorSpace<Codomain, Scalar, CodomainId>;
  readonly apply: (
    left: NoInfer<Domain>,
    right: NoInfer<Domain>
  ) => NoInfer<Codomain>;
  readonly leftLinearity: KpLawEvidence;
  readonly rightLinearity: KpLawEvidence;
  readonly sourceFunctionIds?: readonly string[] | undefined;
}): KpSecondDerivativeMap<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId
> {
  requireText(input.id, "Second derivative map id");
  requireCompatibleScalars(input.id, input.domain, input.codomain);
  const leftLinearity = validateLinearity(
    input.leftLinearity,
    input.codomain,
    input.id,
    "left"
  );
  const rightLinearity = validateLinearity(
    input.rightLinearity,
    input.codomain,
    input.id,
    "right"
  );
  const sourceFunctionIds = input.sourceFunctionIds ?? [input.id];
  if (sourceFunctionIds.length === 0) {
    throw new Error(
      `Second derivative map ${input.id} requires source function identity.`
    );
  }
  sourceFunctionIds.forEach((id) => requireText(
    id,
    `Second derivative map ${input.id} source id`
  ));

  return Object.freeze({
    kind: "second-derivative-map" as const,
    id: input.id,
    domain: input.domain,
    codomain: input.codomain,
    apply: input.apply,
    leftLinearity,
    rightLinearity,
    sourceFunctionIds: Object.freeze([...sourceFunctionIds])
  });
}

export function createKpSecondDerivativeRequiredGap(input: {
  readonly sourceId: string;
}): KpSecondDerivativeRequiredGap {
  requireText(input.sourceId, "Second-derivative gap source id");
  return Object.freeze({
    status: "repair-required" as const,
    code: "kp.calculus.second-derivative-required" as const,
    sourceId: input.sourceId,
    requirement: "secondDerivativeAt" as const,
    message: `Source ${input.sourceId} has no declared second derivative.`,
    repair: "Supply a scalar-function adapter with an explicit second derivative."
  });
}

function validateLinearity<Codomain, Scalar>(
  evidence: KpLawEvidence,
  codomain: KpVectorSpace<Codomain, Scalar>,
  mapId: string,
  side: "left" | "right"
): KpLawEvidence {
  const validated = createKpLawEvidence(evidence);
  if (
    validated.kind === "tested" &&
    validated.equalityId !== codomain.vectors.equality.id
  ) {
    throw new Error(
      `Second derivative map ${mapId} ${side} linearity must use equality ` +
      `${codomain.vectors.equality.id}.`
    );
  }
  return validated;
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
      `Second derivative map ${id} requires compatible scalar systems.`
    );
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
