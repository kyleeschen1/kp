import {
  createKpAdditiveCommutativeGroup,
  createKpScalarSystem,
  createKpVectorSpace,
  type KpScalarSystem,
  type KpVectorSpace
} from "./algebraic-structures.ts";
import { createKpEquality } from "./law-evidence.ts";
import { defineKpSemanticSpace } from "./semantic-space.ts";

export type KpCoordinates<Dimension extends number> =
  readonly number[] & Readonly<{ length: Dimension }>;

export function createKpFloatingPointScalars(input: {
  readonly tolerance?: number | undefined;
} = {}): KpScalarSystem<number> {
  const tolerance = input.tolerance ?? 1e-12;
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new Error("Floating-point equality tolerance must be positive.");
  }
  const equalityId = `kp.equality.float64.absolute.${tolerance}`;
  const equality = createKpEquality<number>({
    id: equalityId,
    mode: "approximate",
    equals: (left, right) => Math.abs(left - right) <= tolerance
  });
  return createKpScalarSystem({
    id: `kp.scalar-system.float64.${tolerance}`,
    carrierId: "kp.carrier.float64",
    equality,
    zero: 0,
    one: 1,
    add: (left, right) => left + right,
    multiply: (left, right) => left * right,
    negate: (value) => -value
  });
}

export function createKpStandardScalarSpace<const Id extends string>(input: {
  readonly id: Id;
  readonly label?: string | undefined;
  readonly scalars?: KpScalarSystem<number> | undefined;
}): KpVectorSpace<number, number, Id> {
  const scalars = input.scalars ?? createKpFloatingPointScalars();
  const space = defineKpSemanticSpace<number>()({
    id: input.id,
    label: input.label,
    dimension: 1
  });
  return createKpVectorSpace({
    id: `${input.id}.vector-space`,
    space,
    vectors: createKpAdditiveCommutativeGroup({
      id: `${input.id}.additive`,
      carrierId: space.id,
      equality: scalars.equality,
      zero: scalars.zero,
      add: scalars.add,
      negate: scalars.negate
    }),
    scalars,
    scale: scalars.multiply
  });
}

export function createKpCartesianSpace<
  const Id extends string,
  const Dimension extends number
>(input: {
  readonly id: Id;
  readonly label?: string | undefined;
  readonly dimension: Dimension;
  readonly scalars?: KpScalarSystem<number> | undefined;
}): KpVectorSpace<KpCoordinates<Dimension>, number, Id> {
  const scalars = input.scalars ?? createKpFloatingPointScalars();
  const space = defineKpSemanticSpace<KpCoordinates<Dimension>>()({
    id: input.id,
    label: input.label,
    dimension: input.dimension
  });
  const equality = createKpEquality<KpCoordinates<Dimension>>({
    id: `${input.id}.coordinate-equality.${scalars.equality.id}`,
    mode: scalars.equality.mode,
    equals: (left, right) =>
      left.length === input.dimension &&
      right.length === input.dimension &&
      left.every((value, index) =>
        scalars.equality.equals(value, right[index] ?? Number.NaN)
      )
  });
  const requireDimension = (
    value: KpCoordinates<Dimension>
  ): KpCoordinates<Dimension> => {
    if (value.length !== input.dimension) {
      throw new Error(
        `Cartesian space ${input.id} requires ${input.dimension} coordinates.`
      );
    }
    return value;
  };
  return createKpVectorSpace({
    id: `${input.id}.vector-space`,
    space,
    vectors: createKpAdditiveCommutativeGroup({
      id: `${input.id}.additive`,
      carrierId: space.id,
      equality,
      zero: Object.freeze(
        Array.from({ length: input.dimension }, () => scalars.zero)
      ) as KpCoordinates<Dimension>,
      add: (left, right) => Object.freeze(
        requireDimension(left).map((value, index) =>
          scalars.add(value, requireDimension(right)[index]!)
        )
      ) as unknown as KpCoordinates<Dimension>,
      negate: (value) => Object.freeze(
        requireDimension(value).map(scalars.negate)
      ) as unknown as KpCoordinates<Dimension>
    }),
    scalars,
    scale: (scalar, value) => Object.freeze(
      requireDimension(value).map((coordinate) =>
        scalars.multiply(scalar, coordinate)
      )
    ) as unknown as KpCoordinates<Dimension>
  });
}
