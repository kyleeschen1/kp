import type {
  KpVectorSpace
} from "../../src/math/algebra/algebraic-structures.ts";
import {
  createKpDifferentiableMap,
  type KpDifferentiableMap
} from "../../src/math/algebra/differentiable-map.ts";
import { createKpLinearMap } from "../../src/math/algebra/linear-map.ts";
import type {
  KpMathAuthoringContext
} from "../../src/math/authoring/context.ts";
import {
  createKpUnitTaggedScalarSpace,
  createKpUnitValue,
  projectKpDerivativeUnitToLatex,
  type KpUnitDescriptor,
  type KpUnitValue
} from "../../src/math/authoring/units.ts";

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
  const radiusSpace = createKpUnitTaggedScalarSpace({
    id: context.id("spaces", "radius"),
    label: "Circle radius",
    unit: input.units.radius,
    scalars
  });
  const areaSpace = createKpUnitTaggedScalarSpace({
    id: context.id("spaces", "area"),
    label: "Circle area",
    unit: input.units.area,
    scalars
  });
  const functionId = context.id("functions", "area-at-radius");
  const derivativeId = context.id("derivatives", "area-at-radius");
  // The algebraic map is the total signed-coordinate extension of circle
  // area. A physical r >= 0 constraint belongs to a separate domain contract,
  // because the current differentiable-map domain must remain a vector space.
  const areaAtRadius = createKpDifferentiableMap({
    id: functionId,
    domain: radiusSpace,
    codomain: areaSpace,
    evaluate: (radius) => {
      const magnitude = requireUnitMagnitude(
        radius,
        input.units.radius,
        "Circle radius"
      );
      return createKpUnitValue(input.units.area, Math.PI * magnitude ** 2);
    },
    derivativeAt: (radius) => {
      const radiusMagnitude = requireUnitMagnitude(
        radius,
        input.units.radius,
        "Circle derivative point"
      );
      return createKpLinearMap({
        id: derivativeId,
        domain: radiusSpace,
        codomain: areaSpace,
        apply: (change) => createKpUnitValue(
          input.units.area,
          2 * Math.PI * radiusMagnitude * requireUnitMagnitude(
            change,
            input.units.radius,
            "Circle radius change"
          )
        ),
        linearity: {
          kind: "tested",
          suiteId: "kp.test.typed-circle-measurement.derivative-linearity",
          equalityId: areaSpace.vectors.equality.id
        },
        sourceMapIds: [functionId]
      });
    },
    sourceFunctionIds: [id]
  });

  return Object.freeze({
    kind: "circle-measurement" as const,
    id,
    context,
    units: Object.freeze({ ...input.units }),
    spaces: Object.freeze({ radius: radiusSpace, area: areaSpace }),
    areaAtRadius,
    derivativeUnitLatex: projectKpDerivativeUnitToLatex({
      domain: input.units.radius,
      codomain: input.units.area
    })
  });
}

function requireUnitMagnitude<const UnitId extends string>(
  value: KpUnitValue<string>,
  unit: KpUnitDescriptor<UnitId>,
  label: string
): number {
  if (value.unitId !== unit.id) {
    throw new Error(
      `${label} must use unit ${unit.id}; received ${value.unitId}.`
    );
  }
  return value.magnitude;
}
