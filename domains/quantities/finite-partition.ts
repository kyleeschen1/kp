import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import type {
  KpExactQuantity,
  KpExactQuantityUnit
} from "./exact-quantity.ts";

declare const kpFinitePartitionPartBrand: unique symbol;

export type KpFinitePartitionPartId<PartitionId extends string> =
  string & { readonly [kpFinitePartitionPartBrand]: PartitionId };

export interface KpFinitePartitionPart<PartitionId extends string> {
  readonly id: KpFinitePartitionPartId<PartitionId>;
  readonly ordinal: number;
  readonly measure: KpNormalizedRational;
}

export interface KpFinitePartition<
  UnitId extends string,
  PartitionId extends string
> {
  readonly schemaVersion: "kp.finite-partition.v1";
  readonly id: PartitionId;
  readonly unit: KpExactQuantityUnit<UnitId>;
  readonly parts: readonly KpFinitePartitionPart<PartitionId>[];
  readonly totalMeasure: KpNormalizedRational;
}

export interface KpFinitePartitionSelection<
  UnitId extends string,
  PartitionId extends string
> {
  readonly schemaVersion: "kp.finite-partition-selection.v1";
  readonly id: string;
  readonly partitionId: PartitionId;
  readonly unit: KpExactQuantityUnit<UnitId>;
  readonly partIds: readonly KpFinitePartitionPartId<PartitionId>[];
  readonly quantity: KpExactQuantity<UnitId>;
}

export function createKpUniformFinitePartition<
  const UnitId extends string,
  const PartitionId extends string
>(input: {
  readonly id: PartitionId;
  readonly unit: KpExactQuantityUnit<UnitId>;
  readonly partCount: number;
  readonly partIdPrefix?: string | undefined;
}): KpFinitePartition<UnitId, PartitionId> {
  if (!Number.isSafeInteger(input.partCount) || input.partCount <= 0) {
    throw new Error("Finite partition part count must be a positive safe integer.");
  }
  const prefix = input.partIdPrefix ?? `${input.id}.part`;
  return certifyKpFinitePartition({
    id: input.id,
    unit: input.unit,
    parts: Array.from({ length: input.partCount }, (_, ordinal) => ({
      id: `${prefix}.${ordinal}`,
      ordinal,
      measure: createKpRational(1n, BigInt(input.partCount))
    }))
  });
}

export function certifyKpFinitePartition<
  const UnitId extends string,
  const PartitionId extends string
>(input: {
  readonly id: PartitionId;
  readonly unit: KpExactQuantityUnit<UnitId>;
  readonly parts: readonly {
    readonly id: string;
    readonly ordinal: number;
    readonly measure: KpNormalizedRational;
  }[];
}): KpFinitePartition<UnitId, PartitionId> {
  if (input.id.trim().length === 0) {
    throw new Error("Finite partition ID cannot be empty.");
  }
  if (input.parts.length === 0) {
    throw new Error("Finite partition requires at least one part.");
  }
  const ids = input.parts.map(({ id }) => id);
  if (ids.some((id) => id.trim().length === 0)) {
    throw new Error("Finite partition part IDs cannot be empty.");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("Finite partition part IDs must be unique.");
  }
  const ordinals = input.parts.map(({ ordinal }) => ordinal);
  if (
    new Set(ordinals).size !== ordinals.length ||
    ordinals.some((ordinal, index) =>
      !Number.isSafeInteger(ordinal) || ordinal !== index
    )
  ) {
    throw new Error(
      "Finite partition ordinals must be unique and contiguous from zero."
    );
  }

  let total = createKpRational(0n);
  const parts = input.parts.map((part) => {
    const measure = createKpRational(
      part.measure.numerator,
      part.measure.denominator
    );
    if (measure.numerator <= 0n) {
      throw new Error("Finite partition part measures must be positive.");
    }
    total = addKpRationals(total, measure);
    return Object.freeze({
      id: part.id as KpFinitePartitionPartId<PartitionId>,
      ordinal: part.ordinal,
      measure
    });
  });
  if (!equalKpRationals(total, createKpRational(1n))) {
    throw new Error("Finite partition part measures must total one whole.");
  }

  return Object.freeze({
    schemaVersion: "kp.finite-partition.v1",
    id: input.id,
    unit: input.unit,
    parts: Object.freeze(parts),
    totalMeasure: total
  });
}

export function createKpFinitePartitionSelection<
  UnitId extends string,
  PartitionId extends string
>(
  partition: KpFinitePartition<UnitId, PartitionId>,
  id: string,
  partIds:
    readonly KpFinitePartitionPartId<NoInfer<PartitionId>>[]
): KpFinitePartitionSelection<UnitId, PartitionId> {
  if (id.trim().length === 0) {
    throw new Error("Finite partition selection ID cannot be empty.");
  }
  if (new Set(partIds).size !== partIds.length) {
    throw new Error("Finite partition selection cannot repeat a part.");
  }
  const partById = new Map(
    partition.parts.map((part) => [part.id, part] as const)
  );
  let measure = createKpRational(0n);
  for (const partId of partIds) {
    const part = partById.get(partId);
    if (part === undefined) {
      throw new Error(
        `Finite partition selection ${id} references missing part ${partId}.`
      );
    }
    measure = addKpRationals(measure, part.measure);
  }
  const normalizedPartIds = Object.freeze([...partIds]) as
    readonly KpFinitePartitionPartId<PartitionId>[];
  return Object.freeze({
    schemaVersion: "kp.finite-partition-selection.v1",
    id,
    partitionId: partition.id,
    unit: partition.unit,
    partIds: normalizedPartIds,
    quantity: Object.freeze({
      schemaVersion: "kp.exact-quantity.v1",
      unit: partition.unit,
      value: measure
    })
  });
}
