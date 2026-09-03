import type {
  KpVectorSpace
} from "../../src/math/algebra/algebraic-structures.ts";
import {
  type KpDifferentiableMap
} from "../../src/math/algebra/differentiable-map.ts";
import type {
  KpMathAuthoringContext
} from "../../src/math/authoring/context.ts";
import {
  type KpUnitDescriptor,
  type KpUnitValue
} from "../../src/math/authoring/units.ts";
import {
  defineKpAuthoredUnitScalarMap
} from "../../src/math/authoring/unit-scalar-map.ts";

export interface KpCircleMeasurement<
  RadiusUnitId extends string,
  AreaUnitId extends string
> {
  readonly kind: "circle-measurement";
  readonly id: string;
  readonly context: KpMathAuthoringContext;
  readonly units: Readonly<{
    radius: KpUnitDescriptor<RadiusUnitId>;
    area: KpUnitDescriptor<AreaUnitId>;
  }>;
  readonly spaces: Readonly<{
    radius: KpVectorSpace<KpUnitValue<RadiusUnitId>, number>;
    area: KpVectorSpace<KpUnitValue<AreaUnitId>, number>;
  }>;
  readonly areaAtRadius: KpDifferentiableMap<
    KpUnitValue<RadiusUnitId>,
    KpUnitValue<AreaUnitId>,
    number
  >;
  readonly derivativeUnitLatex: string;
}

export function createKpCircleMeasurement<
  const RadiusUnitId extends string,
  const AreaUnitId extends string
>(input: {
  readonly author: KpMathAuthoringContext;
  readonly key: string;
  readonly units: Readonly<{
    radius: KpUnitDescriptor<RadiusUnitId>;
    area: KpUnitDescriptor<AreaUnitId>;
  }>;
}): KpCircleMeasurement<RadiusUnitId, AreaUnitId> {
  const scalars = input.author.defaults.scalars;
  if (scalars === undefined) {
    throw new Error(
      "Circle measurement authoring requires numeric scalar defaults; " +
      "use createKpStandardMathAuthoringContext."
    );
  }

  const id = input.author.id("circles", input.key);
  const context = input.author.at("circles", input.key);
  // The algebraic map is the total signed-coordinate extension of circle
  // area. A physical r >= 0 constraint belongs to a separate domain contract,
  // because the current differentiable-map domain must remain a vector space.
  const authored = defineKpAuthoredUnitScalarMap(context, {
    path: "area-at-radius",
    domain: {
      path: "radius",
      label: "Circle radius",
      unit: input.units.radius
    },
    codomain: {
      path: "area",
      label: "Circle area",
      unit: input.units.area
    },
    evaluateMagnitude: (radius) => Math.PI * radius ** 2,
    derivativeMagnitudeAt: (radius, change) => (
      2 * Math.PI * radius * change
    ),
    diagnostics: {
      evaluationInput: "Circle radius",
      derivativePoint: "Circle derivative point",
      derivativeChange: "Circle radius change"
    },
    source: { functionId: id },
    testedLinearitySuiteId:
      "kp.test.typed-circle-measurement.derivative-linearity"
  });

  return Object.freeze({
    kind: "circle-measurement" as const,
    id,
    context,
    units: Object.freeze({ ...input.units }),
    spaces: Object.freeze({
      radius: authored.spaces.domain,
      area: authored.spaces.codomain
    }),
    areaAtRadius: authored.map,
    derivativeUnitLatex: authored.derivativeUnitLatex
  });
}
