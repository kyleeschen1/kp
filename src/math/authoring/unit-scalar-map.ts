import type { KpVectorSpace } from "../algebra/algebraic-structures.ts";
import {
  createKpDifferentiableMap,
  type KpDifferentiableMap
} from "../algebra/differentiable-map.ts";
import type { KpLawEvidence } from "../algebra/law-evidence.ts";
import { createKpLinearMap } from "../algebra/linear-map.ts";
import type { KpMathAuthoringContext } from "./context.ts";
import {
  createKpUnitTaggedScalarSpace,
  createKpUnitValue,
  projectKpDerivativeUnitToLatex,
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

export interface KpAuthoredUnitScalarMapBinding<
  DomainUnitId extends string,
  CodomainUnitId extends string
> {
  readonly kind: "authored-unit-scalar-map-binding";
  readonly definition: KpAuthoredUnitScalarMapDefinition<
    DomainUnitId,
    CodomainUnitId
  >;
  readonly map: KpDifferentiableMap<
    KpUnitValue<DomainUnitId>,
    KpUnitValue<CodomainUnitId>,
    number
  >;
}

export interface KpAuthoredUnitScalarMap<
  DomainUnitId extends string,
  CodomainUnitId extends string
> {
  readonly kind: "authored-unit-scalar-map";
  readonly context: KpMathAuthoringContext;
  readonly ids: KpAuthoredUnitScalarMapDefinition<
    DomainUnitId,
    CodomainUnitId
  >["ids"];
  readonly units: KpAuthoredUnitScalarMapDefinition<
    DomainUnitId,
    CodomainUnitId
  >["units"];
  readonly spaces: KpAuthoredUnitScalarMapDefinition<
    DomainUnitId,
    CodomainUnitId
  >["spaces"];
  readonly map: KpDifferentiableMap<
    KpUnitValue<DomainUnitId>,
    KpUnitValue<CodomainUnitId>,
    number
  >;
  readonly provenance: Readonly<{
    sourceFunctionId: string;
    derivativeSourceMapId: string;
    testedLinearitySuiteId: string;
  }>;
  readonly derivativeUnitLatex: string;
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

export function bindKpAuthoredUnitScalarMapDefinition<
  const DomainUnitId extends string,
  const CodomainUnitId extends string
>(
  definition: KpAuthoredUnitScalarMapDefinition<
    DomainUnitId,
    CodomainUnitId
  >,
  input: {
    readonly diagnostics: Readonly<{
      evaluationInput: string;
      derivativePoint: string;
      derivativeChange: string;
    }>;
    readonly linearity: KpLawEvidence;
    readonly sourceFunctionIds?: readonly string[] | undefined;
    readonly derivativeSourceMapIds?: readonly string[] | undefined;
  }
): KpAuthoredUnitScalarMapBinding<DomainUnitId, CodomainUnitId> {
  const diagnostics = Object.freeze({
    evaluationInput: requireDiagnosticLabel(
      input.diagnostics.evaluationInput,
      "Evaluation input diagnostic"
    ),
    derivativePoint: requireDiagnosticLabel(
      input.diagnostics.derivativePoint,
      "Derivative point diagnostic"
    ),
    derivativeChange: requireDiagnosticLabel(
      input.diagnostics.derivativeChange,
      "Derivative change diagnostic"
    )
  });
  const map = createKpDifferentiableMap({
    id: definition.ids.map,
    domain: definition.spaces.domain,
    codomain: definition.spaces.codomain,
    evaluate: (value) => createKpUnitValue(
      definition.units.codomain,
      definition.rules.evaluateMagnitude(requireUnitMagnitude(
        value,
        definition.units.domain,
        diagnostics.evaluationInput
      ))
    ),
    derivativeAt: (value) => {
      const point = requireUnitMagnitude(
        value,
        definition.units.domain,
        diagnostics.derivativePoint
      );
      return createKpLinearMap({
        id: definition.ids.derivative,
        domain: definition.spaces.domain,
        codomain: definition.spaces.codomain,
        apply: (change) => createKpUnitValue(
          definition.units.codomain,
          definition.rules.derivativeMagnitudeAt(
            point,
            requireUnitMagnitude(
              change,
              definition.units.domain,
              diagnostics.derivativeChange
            )
          )
        ),
        linearity: input.linearity,
        sourceMapIds: input.derivativeSourceMapIds
      });
    },
    sourceFunctionIds: input.sourceFunctionIds
  });

  return Object.freeze({
    kind: "authored-unit-scalar-map-binding" as const,
    definition,
    map
  });
}

export function defineKpAuthoredUnitScalarMap<
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
    readonly diagnostics: Readonly<{
      evaluationInput: string;
      derivativePoint: string;
      derivativeChange: string;
    }>;
    readonly source: Readonly<{
      functionId: string;
      derivativeMapId?: string | undefined;
    }>;
    readonly testedLinearitySuiteId: string;
  }
): KpAuthoredUnitScalarMap<DomainUnitId, CodomainUnitId> {
  const definition = createKpAuthoredUnitScalarMapDefinition(author, input);
  const provenance = Object.freeze({
    sourceFunctionId: requireMetadataId(
      input.source.functionId,
      "Unit-scalar source function id"
    ),
    derivativeSourceMapId: requireMetadataId(
      input.source.derivativeMapId ?? definition.ids.map,
      "Unit-scalar derivative source map id"
    ),
    testedLinearitySuiteId: requireMetadataId(
      input.testedLinearitySuiteId,
      "Unit-scalar tested-linearity suite id"
    )
  });
  const binding = bindKpAuthoredUnitScalarMapDefinition(definition, {
    diagnostics: input.diagnostics,
    linearity: {
      kind: "tested",
      suiteId: provenance.testedLinearitySuiteId,
      equalityId: definition.spaces.codomain.vectors.equality.id
    },
    sourceFunctionIds: [provenance.sourceFunctionId],
    derivativeSourceMapIds: [provenance.derivativeSourceMapId]
  });

  return Object.freeze({
    kind: "authored-unit-scalar-map" as const,
    context: author,
    ids: definition.ids,
    units: definition.units,
    spaces: definition.spaces,
    map: binding.map,
    provenance,
    derivativeUnitLatex: projectKpDerivativeUnitToLatex({
      domain: definition.units.domain,
      codomain: definition.units.codomain
    })
  });
}

function requireUnitMagnitude<const UnitId extends string>(
  value: KpUnitValue<string>,
  unit: KpUnitDescriptor<UnitId>,
  label: string
): number {
  if (value.unitId !== unit.id) {
    throw new Error(`${label} must use unit ${unit.id}; received ${value.unitId}.`);
  }
  if (!Number.isFinite(value.magnitude)) {
    throw new Error(`${label} magnitude must be finite.`);
  }
  return value.magnitude;
}

function requireDiagnosticLabel(value: string, label: string): string {
  if (value.trim().length === 0 || value.trim() !== value) {
    throw new Error(`${label} must be non-empty and trimmed.`);
  }
  return value;
}

function requireMetadataId(value: string, label: string): string {
  if (value.trim().length === 0 || value.trim() !== value) {
    throw new Error(`${label} must be non-empty and trimmed.`);
  }
  return value;
}
