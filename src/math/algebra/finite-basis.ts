import type { KpVectorSpace } from "./algebraic-structures.ts";
import {
  createKpLawEvidence,
  type KpLawEvidence
} from "./law-evidence.ts";

export type KpCoordinateTuple<Scalar, Size extends number> =
  readonly Scalar[] & Readonly<{ length: Size }>;

export interface KpFiniteBasis<
  Value,
  Scalar,
  SpaceId extends string = string,
  Size extends number = number
> {
  readonly kind: "finite-basis";
  readonly id: string;
  readonly space: KpVectorSpace<Value, Scalar, SpaceId>;
  readonly size: Size;
  readonly vectors: readonly Value[] & Readonly<{ length: Size }>;
  readonly coordinates: (value: Value) => KpCoordinateTuple<Scalar, Size>;
  readonly fromCoordinates: (
    coordinates: KpCoordinateTuple<Scalar, Size>
  ) => Value;
  readonly coordinateIsomorphism: KpLawEvidence;
}

type NonEmptyValues<Value> = readonly [Value, ...Value[]];

export function createKpFiniteBasis<
  Value,
  Scalar,
  const SpaceId extends string,
  const Vectors extends NonEmptyValues<Value>
>(input: {
  readonly id: string;
  readonly space: KpVectorSpace<Value, Scalar, SpaceId>;
  readonly vectors: Vectors;
  readonly coordinates: (
    value: Value
  ) => KpCoordinateTuple<Scalar, Vectors["length"]>;
  readonly fromCoordinates: (
    coordinates: KpCoordinateTuple<Scalar, Vectors["length"]>
  ) => Value;
  readonly coordinateIsomorphism: KpLawEvidence;
}): KpFiniteBasis<Value, Scalar, SpaceId, Vectors["length"]> {
  requireText(input.id, "Finite basis id");
  if (input.vectors.length !== input.space.space.dimension) {
    throw new Error(
      `Finite basis ${input.id} requires ${input.space.space.dimension} vectors.`
    );
  }
  for (let left = 0; left < input.vectors.length; left += 1) {
    for (let right = left + 1; right < input.vectors.length; right += 1) {
      if (input.space.vectors.equality.equals(
        input.vectors[left]!,
        input.vectors[right]!
      )) {
        throw new Error(`Finite basis ${input.id} repeats a basis vector.`);
      }
    }
  }
  const coordinateIsomorphism = createKpLawEvidence(
    input.coordinateIsomorphism
  );
  if (
    coordinateIsomorphism.kind === "tested" &&
    coordinateIsomorphism.equalityId !== input.space.vectors.equality.id
  ) {
    throw new Error(
      `Finite basis ${input.id} test evidence must use equality ` +
      `${input.space.vectors.equality.id}.`
    );
  }

  const size = input.vectors.length as Vectors["length"];
  const requireCoordinates = (
    coordinates: KpCoordinateTuple<Scalar, Vectors["length"]>
  ): KpCoordinateTuple<Scalar, Vectors["length"]> => {
    if (coordinates.length !== size) {
      throw new Error(`Finite basis ${input.id} requires ${size} coordinates.`);
    }
    return coordinates;
  };
  const coordinates = (
    value: Value
  ): KpCoordinateTuple<Scalar, Vectors["length"]> =>
    requireCoordinates(input.coordinates(value));
  const fromCoordinates = (
    value: KpCoordinateTuple<Scalar, Vectors["length"]>
  ): Value => input.fromCoordinates(requireCoordinates(value));

  input.vectors.forEach((basisVector, index) => {
    const unit = Object.freeze(Array.from(
      { length: size },
      (_, coordinate) => coordinate === index
        ? input.space.scalars.one
        : input.space.scalars.zero
    )) as unknown as KpCoordinateTuple<Scalar, Vectors["length"]>;
    const actualCoordinates = coordinates(basisVector);
    const coordinatesMatch = unit.every((expected, coordinate) =>
      input.space.scalars.equality.equals(
        expected,
        actualCoordinates[coordinate]!
      )
    );
    if (!coordinatesMatch) {
      throw new Error(
        `Finite basis ${input.id} vector ${index} has invalid coordinates.`
      );
    }
    if (!input.space.vectors.equality.equals(
      fromCoordinates(unit),
      basisVector
    )) {
      throw new Error(
        `Finite basis ${input.id} coordinate ${index} does not round trip.`
      );
    }
  });

  return Object.freeze({
    kind: "finite-basis" as const,
    id: input.id,
    space: input.space,
    size,
    vectors: Object.freeze([...input.vectors]) as
      unknown as readonly Value[] & Readonly<{ length: Vectors["length"] }>,
    coordinates,
    fromCoordinates,
    coordinateIsomorphism
  });
}

export function sameKpFiniteBasis<
  LeftValue,
  RightValue,
  LeftScalar,
  RightScalar,
  LeftSpaceId extends string,
  RightSpaceId extends string,
  LeftSize extends number,
  RightSize extends number
>(
  left: KpFiniteBasis<LeftValue, LeftScalar, LeftSpaceId, LeftSize>,
  right: KpFiniteBasis<RightValue, RightScalar, RightSpaceId, RightSize>
): boolean {
  return left.id === right.id &&
    String(left.space.space.id) === String(right.space.space.id);
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
