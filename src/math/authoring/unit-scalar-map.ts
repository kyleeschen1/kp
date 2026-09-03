import type { KpVectorSpace } from "../algebra/algebraic-structures.ts";
import type { KpMathAuthoringContext } from "./context.ts";
import {
  createKpUnitTaggedScalarSpace,
  type KpUnitDescriptor,
  type KpUnitValue
} from "./units.ts";

export interface KpAuthoredUnitScalarMapDefinition<
  DomainUnitId extends string,
  CodomainUnitId extends string
> {
  readonly kind: "authored-unit-scalar-map-definition";
  readonly context: KpMathAuthoringContext;
  readonly ids: Readonly<{
    map: string;
    derivative: string;
  }>;
  readonly units: Readonly<{
    domain: KpUnitDescriptor<DomainUnitId>;
    codomain: KpUnitDescriptor<CodomainUnitId>;
  }>;
  readonly spaces: Readonly<{
    domain: KpVectorSpace<KpUnitValue<DomainUnitId>, number>;
    codomain: KpVectorSpace<KpUnitValue<CodomainUnitId>, number>;
  }>;
  readonly rules: Readonly<{
    evaluateMagnitude: (value: number) => number;
    derivativeMagnitudeAt: (point: number, change: number) => number;
  }>;
}

export function createKpAuthoredUnitScalarMapDefinition<
  const DomainUnitId extends string,
  const CodomainUnitId extends string
>(
  author: KpMathAuthoringContext,
  input: {
    readonly path: string;
    readonly derivativePath?: string | undefined;
    readonly domain: Readonly<{
      path: string;
      label: string;
      unit: KpUnitDescriptor<DomainUnitId>;
    }>;
    readonly codomain: Readonly<{
      path: string;
      label: string;
      unit: KpUnitDescriptor<CodomainUnitId>;
    }>;
    readonly evaluateMagnitude: (value: number) => number;
    readonly derivativeMagnitudeAt: (point: number, change: number) => number;
  }
): KpAuthoredUnitScalarMapDefinition<DomainUnitId, CodomainUnitId> {
  const scalars = author.defaults.scalars;
  if (scalars === undefined) {
    throw new Error(
      "Unit-scalar map authoring requires numeric scalar defaults; " +
      "use createKpStandardMathAuthoringContext."
    );
  }

  // Paths remain explicit author input; this layer only applies the shared
  // space/function/derivative namespace convention.
  const ids = Object.freeze({
    map: author.id("functions", input.path),
    derivative: author.id(
      "derivatives",
      input.derivativePath ?? input.path
    )
  });
  const domain = createKpUnitTaggedScalarSpace({
    id: author.id("spaces", input.domain.path),
    label: input.domain.label,
    unit: input.domain.unit,
    scalars
  });
  const codomain = createKpUnitTaggedScalarSpace({
    id: author.id("spaces", input.codomain.path),
    label: input.codomain.label,
    unit: input.codomain.unit,
    scalars
  });

  return Object.freeze({
    kind: "authored-unit-scalar-map-definition" as const,
    context: author,
    ids,
    units: Object.freeze({
      domain: input.domain.unit,
      codomain: input.codomain.unit
    }),
    spaces: Object.freeze({ domain, codomain }),
    rules: Object.freeze({
      evaluateMagnitude: input.evaluateMagnitude,
      derivativeMagnitudeAt: input.derivativeMagnitudeAt
    })
  });
}
