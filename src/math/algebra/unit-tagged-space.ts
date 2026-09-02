import {
  createKpAdditiveCommutativeGroup,
  createKpVectorSpace,
  type KpScalarSystem,
  type KpVectorSpace
} from "./algebraic-structures.ts";
import { createKpEquality } from "./law-evidence.ts";
import { defineKpSemanticSpace } from "./semantic-space.ts";
import { createKpFloatingPointScalars } from "./standard-spaces.ts";

export interface KpUnitDescriptor<UnitId extends string = string> {
  readonly kind: "unit-descriptor";
  readonly id: UnitId;
  readonly symbol: string;
}

export interface KpUnitValue<UnitId extends string = string> {
  readonly magnitude: number;
  readonly unitId: UnitId;
}

export function createKpUnitDescriptor<const UnitId extends string>(input: {
  readonly id: UnitId;
  readonly symbol: string;
}): KpUnitDescriptor<UnitId> {
  requireText(input.id, "Unit id");
  requireText(input.symbol, `Unit ${input.id} symbol`);
  return Object.freeze({
    kind: "unit-descriptor" as const,
    id: input.id,
    symbol: input.symbol
  });
}

export function createKpUnitValue<const UnitId extends string>(
  unit: KpUnitDescriptor<UnitId>,
  magnitude: number
): KpUnitValue<UnitId> {
  if (!Number.isFinite(magnitude)) {
    throw new Error(`Unit value ${unit.id} magnitude must be finite.`);
  }
  return Object.freeze({ magnitude, unitId: unit.id });
}

export function createKpUnitTaggedScalarSpace<
  const SpaceId extends string,
  const UnitId extends string
>(input: {
  readonly id: SpaceId;
  readonly label?: string | undefined;
  readonly unit: KpUnitDescriptor<UnitId>;
  readonly scalars?: KpScalarSystem<number> | undefined;
}): KpVectorSpace<KpUnitValue<UnitId>, number, SpaceId> {
  const scalars = input.scalars ?? createKpFloatingPointScalars();
  const space = defineKpSemanticSpace<KpUnitValue<UnitId>>()({
    id: input.id,
    label: input.label,
    dimension: 1
  });
  const value = (magnitude: number) => createKpUnitValue(input.unit, magnitude);
  return createKpVectorSpace({
    id: `${input.id}.vector-space`,
    space,
    vectors: createKpAdditiveCommutativeGroup({
      id: `${input.id}.additive`,
      carrierId: input.id,
      equality: createKpEquality({
        id: `${input.id}.equality.${scalars.equality.id}`,
        mode: scalars.equality.mode,
        equals: (left: KpUnitValue<UnitId>, right: KpUnitValue<UnitId>) =>
          left.unitId === input.unit.id && right.unitId === input.unit.id &&
          scalars.equality.equals(left.magnitude, right.magnitude)
      }),
      zero: value(scalars.zero),
      add: (left, right) => value(scalars.add(
        requireUnit(left, input.unit).magnitude,
        requireUnit(right, input.unit).magnitude
      )),
      negate: (inputValue) => value(scalars.negate(
        requireUnit(inputValue, input.unit).magnitude
      ))
    }),
    scalars,
    scale: (scalar, inputValue) => value(scalars.multiply(
      scalar,
      requireUnit(inputValue, input.unit).magnitude
    ))
  });
}

export function projectKpDerivativeUnitToLatex(input: {
  readonly domain: KpUnitDescriptor;
  readonly codomain: KpUnitDescriptor;
}): string {
  return `\\frac{${formatUnit(input.codomain.symbol)}}` +
    `{${formatUnit(input.domain.symbol)}}`;
}

function requireUnit<const UnitId extends string>(
  value: KpUnitValue<string>,
  unit: KpUnitDescriptor<UnitId>
): KpUnitValue<UnitId> {
  if (value.unitId !== unit.id) {
    throw new Error(`Expected unit ${unit.id}; received ${value.unitId}.`);
  }
  return value as KpUnitValue<UnitId>;
}

function formatUnit(value: string): string {
  const escaped = value.replace(/[\\{}_^%&#$~]/g, (character) =>
    `\\${character}`
  );
  return `\\mathrm{${escaped}}`;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
