import type {
  KpEquality,
  KpLawClaim
} from "./law-evidence.ts";
import type { KpSemanticSpace } from "./semantic-space.ts";

export interface KpAdditiveCommutativeGroup<Value> {
  readonly kind: "additive-commutative-group";
  readonly id: string;
  readonly carrierId: string;
  readonly equality: KpEquality<Value>;
  readonly zero: Value;
  readonly add: (left: Value, right: Value) => Value;
  readonly negate: (value: Value) => Value;
  readonly laws: readonly KpLawClaim[];
}

export interface KpScalarSystem<Scalar> {
  readonly kind: "scalar-system";
  readonly id: string;
  readonly carrierId: string;
  readonly equality: KpEquality<Scalar>;
  readonly zero: Scalar;
  readonly one: Scalar;
  readonly add: (left: Scalar, right: Scalar) => Scalar;
  readonly multiply: (left: Scalar, right: Scalar) => Scalar;
  readonly negate: (value: Scalar) => Scalar;
  readonly laws: readonly KpLawClaim[];
}

export interface KpVectorSpace<
  Value,
  Scalar,
  SpaceId extends string = string
> {
  readonly kind: "vector-space";
  readonly id: string;
  readonly space: KpSemanticSpace<Value, SpaceId>;
  readonly vectors: KpAdditiveCommutativeGroup<Value>;
  readonly scalars: KpScalarSystem<Scalar>;
  readonly scale: (scalar: Scalar, value: Value) => Value;
  readonly laws: readonly KpLawClaim[];
}

export function createKpAdditiveCommutativeGroup<Value>(input: {
  readonly id: string;
  readonly carrierId: string;
  readonly equality: KpEquality<Value>;
  readonly zero: Value;
  readonly add: (left: Value, right: Value) => Value;
  readonly negate: (value: Value) => Value;
  readonly laws?: readonly KpLawClaim[] | undefined;
}): KpAdditiveCommutativeGroup<Value> {
  requireText(input.id, "Additive group id");
  requireText(input.carrierId, `Additive group ${input.id} carrier id`);
  const laws = validateLaws(
    input.laws ?? [],
    input.carrierId,
    input.equality.id,
    input.id
  );
  return Object.freeze({
    kind: "additive-commutative-group" as const,
    id: input.id,
    carrierId: input.carrierId,
    equality: input.equality,
    zero: input.zero,
    add: input.add,
    negate: input.negate,
    laws
  });
}

export function createKpScalarSystem<Scalar>(input: {
  readonly id: string;
  readonly carrierId: string;
  readonly equality: KpEquality<Scalar>;
  readonly zero: Scalar;
  readonly one: Scalar;
  readonly add: (left: Scalar, right: Scalar) => Scalar;
  readonly multiply: (left: Scalar, right: Scalar) => Scalar;
  readonly negate: (value: Scalar) => Scalar;
  readonly laws?: readonly KpLawClaim[] | undefined;
}): KpScalarSystem<Scalar> {
  requireText(input.id, "Scalar system id");
  requireText(input.carrierId, `Scalar system ${input.id} carrier id`);
  const laws = validateLaws(
    input.laws ?? [],
    input.carrierId,
    input.equality.id,
    input.id
  );
  return Object.freeze({
    kind: "scalar-system" as const,
    id: input.id,
    carrierId: input.carrierId,
    equality: input.equality,
    zero: input.zero,
    one: input.one,
    add: input.add,
    multiply: input.multiply,
    negate: input.negate,
    laws
  });
}

export function createKpVectorSpace<
  Value,
  Scalar,
  const SpaceId extends string
>(input: {
  readonly id: string;
  readonly space: KpSemanticSpace<Value, SpaceId>;
  readonly vectors: KpAdditiveCommutativeGroup<Value>;
  readonly scalars: KpScalarSystem<Scalar>;
  readonly scale: (scalar: Scalar, value: Value) => Value;
  readonly laws?: readonly KpLawClaim[] | undefined;
}): KpVectorSpace<Value, Scalar, SpaceId> {
  requireText(input.id, "Vector space id");
  if (input.vectors.carrierId !== input.space.id) {
    throw new Error(
      `Vector space ${input.id} additive carrier must be ${input.space.id}.`
    );
  }
  const laws = validateLaws(
    input.laws ?? [],
    input.space.id,
    input.vectors.equality.id,
    input.id
  );
  return Object.freeze({
    kind: "vector-space" as const,
    id: input.id,
    space: input.space,
    vectors: input.vectors,
    scalars: input.scalars,
    scale: input.scale,
    laws
  });
}

export function sumKpValues<Value>(
  structure: Pick<KpAdditiveCommutativeGroup<Value>, "zero" | "add">,
  values: readonly Value[]
): Value {
  return values.reduce(structure.add, structure.zero);
}

function validateLaws(
  laws: readonly KpLawClaim[],
  carrierId: string,
  equalityId: string,
  structureId: string
): readonly KpLawClaim[] {
  laws.forEach((law) => {
    if (law.carrierId !== carrierId) {
      throw new Error(
        `Structure ${structureId} law ${law.name} must use carrier ${carrierId}.`
      );
    }
    if (law.equalityId !== equalityId) {
      throw new Error(
        `Structure ${structureId} law ${law.name} must use equality ${equalityId}.`
      );
    }
  });
  return Object.freeze([...laws]);
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
