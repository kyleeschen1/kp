import {
  createKpDecimalDigit,
  isKpPlaceValueQuantity,
  kpBaseTenPlaces,
  type KpBaseTenPlace,
  type KpBaseTenPlaceId,
  type KpDecimalDigit,
  type KpDecimalDigitValue,
  type KpPlaceValueQuantity,
  type KpPlaceValueQuantityRole
} from "./place-value.ts";

declare const kpPlaceValueComponentBrand: unique symbol;
declare const kpPlaceValueDecompositionBrand: unique symbol;

const sealedComponents = new WeakSet<object>();
const sealedDecompositions = new WeakSet<object>();

export type KpPlaceValueComponentId<
  QuantityId extends string,
  Place extends KpBaseTenPlaceId
> = `${QuantityId}.${Place}`;

export interface KpPlaceValueComponent<
  QuantityId extends string,
  Place extends KpBaseTenPlaceId
> {
  readonly schemaVersion: "kp.place-value-component.v1";
  readonly id: KpPlaceValueComponentId<QuantityId, Place>;
  readonly quantityId: QuantityId;
  readonly place: KpBaseTenPlace<Place>;
  readonly digit: KpDecimalDigit;
  readonly exactValue: bigint;
  readonly [kpPlaceValueComponentBrand]: `${QuantityId}:${Place}`;
}

export interface KpPlaceValueDecomposition<
  QuantityId extends string = string,
  Role extends KpPlaceValueQuantityRole = KpPlaceValueQuantityRole
> {
  readonly schemaVersion: "kp.place-value-decomposition.v1";
  readonly id: `decomposition.${QuantityId}`;
  readonly quantity: KpPlaceValueQuantity<QuantityId, Role>;
  readonly columns: {
    readonly hundreds: KpPlaceValueComponent<QuantityId, "hundreds">;
    readonly tens: KpPlaceValueComponent<QuantityId, "tens">;
    readonly ones: KpPlaceValueComponent<QuantityId, "ones">;
  };
  readonly exactTotal: bigint;
  readonly [kpPlaceValueDecompositionBrand]: `${Role}:${QuantityId}`;
}

function createComponent<
  const QuantityId extends string,
  const Place extends KpBaseTenPlaceId
>(
  quantityId: QuantityId,
  place: KpBaseTenPlace<Place>,
  digitValue: KpDecimalDigitValue
): KpPlaceValueComponent<QuantityId, Place> {
  const component = Object.freeze({
    schemaVersion: "kp.place-value-component.v1" as const,
    id: `${quantityId}.${place.id}` as const,
    quantityId,
    place,
    digit: createKpDecimalDigit(digitValue),
    exactValue: BigInt(digitValue) * place.unitValue
  });
  sealedComponents.add(component);
  return component as KpPlaceValueComponent<QuantityId, Place>;
}

export function decomposeKpPlaceValueQuantity<
  const QuantityId extends string,
  const Role extends KpPlaceValueQuantityRole
>(
  quantity: KpPlaceValueQuantity<QuantityId, Role>
): KpPlaceValueDecomposition<QuantityId, Role> {
  // Only compiler-sealed quantities may be decomposed. This makes every digit
  // identity a deterministic consequence of exact semantic input rather than
  // an authorable renderer label that could drift from the arithmetic.
  if (!isKpPlaceValueQuantity(quantity)) {
    throw new Error("Place-value decomposition requires a compiler-owned quantity.");
  }

  const hundreds = Number(quantity.value / 100n) as KpDecimalDigitValue;
  const tens = Number((quantity.value / 10n) % 10n) as KpDecimalDigitValue;
  const ones = Number(quantity.value % 10n) as KpDecimalDigitValue;
  const columns = Object.freeze({
    hundreds: createComponent(quantity.id, kpBaseTenPlaces.hundreds, hundreds),
    tens: createComponent(quantity.id, kpBaseTenPlaces.tens, tens),
    ones: createComponent(quantity.id, kpBaseTenPlaces.ones, ones)
  });
  const exactTotal =
    columns.hundreds.exactValue +
    columns.tens.exactValue +
    columns.ones.exactValue;

  if (exactTotal !== quantity.value) {
    throw new Error(
      `Place-value decomposition did not preserve ${quantity.id}.`
    );
  }

  const decomposition = Object.freeze({
    schemaVersion: "kp.place-value-decomposition.v1" as const,
    id: `decomposition.${quantity.id}` as const,
    quantity,
    columns,
    exactTotal
  });
  sealedDecompositions.add(decomposition);
  return decomposition as KpPlaceValueDecomposition<QuantityId, Role>;
}

export function recomposeKpPlaceValueDecomposition(
  decomposition: KpPlaceValueDecomposition
): bigint {
  if (!sealedDecompositions.has(decomposition)) {
    throw new Error("Place-value recomposition requires a compiler-owned decomposition.");
  }
  return decomposition.columns.hundreds.exactValue +
    decomposition.columns.tens.exactValue +
    decomposition.columns.ones.exactValue;
}

export function isKpPlaceValueComponent(
  value: unknown
): value is KpPlaceValueComponent<string, KpBaseTenPlaceId> {
  return typeof value === "object" &&
    value !== null &&
    sealedComponents.has(value);
}

export function isKpPlaceValueDecomposition(
  value: unknown
): value is KpPlaceValueDecomposition {
  return typeof value === "object" &&
    value !== null &&
    sealedDecompositions.has(value);
}
