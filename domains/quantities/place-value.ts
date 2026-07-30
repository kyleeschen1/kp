declare const kpBaseTenPlaceBrand: unique symbol;
declare const kpDecimalDigitBrand: unique symbol;
declare const kpPlaceValueQuantityBrand: unique symbol;
declare const kpBaseTenAdjacencyBrand: unique symbol;

const sealedPlaces = new WeakSet<object>();
const sealedDigits = new WeakSet<object>();
const sealedQuantities = new WeakSet<object>();
const sealedAdjacencies = new WeakSet<object>();

export type KpBaseTenPlaceId = "ones" | "tens" | "hundreds";
export type KpDecimalDigitValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type KpPlaceValueQuantityRole = "addend" | "result";

export type KpNextBaseTenPlace<Place extends KpBaseTenPlaceId> =
  Place extends "ones"
    ? "tens"
    : Place extends "tens"
      ? "hundreds"
      : never;

export interface KpBaseTenPlace<Place extends KpBaseTenPlaceId> {
  readonly schemaVersion: "kp.base-ten-place.v1";
  readonly id: Place;
  readonly power: Place extends "ones" ? 0 : Place extends "tens" ? 1 : 2;
  readonly unitValue: Place extends "ones" ? 1n : Place extends "tens" ? 10n : 100n;
  readonly [kpBaseTenPlaceBrand]: Place;
}

export interface KpDecimalDigit<Value extends KpDecimalDigitValue = KpDecimalDigitValue> {
  readonly schemaVersion: "kp.decimal-digit.v1";
  readonly value: Value;
  readonly [kpDecimalDigitBrand]: Value;
}

export interface KpPlaceValueQuantity<
  Id extends string = string,
  Role extends KpPlaceValueQuantityRole = KpPlaceValueQuantityRole
> {
  readonly schemaVersion: "kp.place-value-quantity.v1";
  readonly id: Id;
  readonly role: Role;
  readonly value: bigint;
  readonly [kpPlaceValueQuantityBrand]: `${Role}:${Id}`;
}

export interface KpBaseTenAdjacency<
  From extends "ones" | "tens",
  To extends KpNextBaseTenPlace<From>
> {
  readonly schemaVersion: "kp.base-ten-adjacency.v1";
  readonly from: KpBaseTenPlace<From>;
  readonly to: KpBaseTenPlace<To>;
  readonly exchangeRatio: 10n;
  readonly [kpBaseTenAdjacencyBrand]: `${From}->${To}`;
}

function createPlace<const Place extends KpBaseTenPlaceId>(
  id: Place,
  power: KpBaseTenPlace<Place>["power"],
  unitValue: KpBaseTenPlace<Place>["unitValue"]
): KpBaseTenPlace<Place> {
  const place = Object.freeze({
    schemaVersion: "kp.base-ten-place.v1" as const,
    id,
    power,
    unitValue
  }) as KpBaseTenPlace<Place>;
  sealedPlaces.add(place);
  return place;
}

export const kpBaseTenPlaces = Object.freeze({
  ones: createPlace("ones", 0, 1n),
  tens: createPlace("tens", 1, 10n),
  hundreds: createPlace("hundreds", 2, 100n)
});

export function createKpDecimalDigit<const Value extends KpDecimalDigitValue>(
  value: Value
): KpDecimalDigit<Value> {
  const digit = Object.freeze({
    schemaVersion: "kp.decimal-digit.v1" as const,
    value
  }) as KpDecimalDigit<Value>;
  sealedDigits.add(digit);
  return digit;
}

export function decodeKpDecimalDigit(value: unknown): KpDecimalDigit {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 9
  ) {
    throw new RangeError("Decimal digit must be an integer from 0 through 9.");
  }
  return createKpDecimalDigit(value as KpDecimalDigitValue);
}

export function createKpPlaceValueQuantity<
  const Id extends string,
  const Role extends KpPlaceValueQuantityRole
>(
  id: Id,
  role: Role,
  value: bigint
): KpPlaceValueQuantity<Id, Role> {
  if (id.trim().length === 0) {
    throw new Error("Place-value quantity ID cannot be empty.");
  }
  if (value < 0n || value > 999n) {
    throw new RangeError(
      "Three-column place-value quantity must be between 0 and 999."
    );
  }
  const quantity = Object.freeze({
    schemaVersion: "kp.place-value-quantity.v1" as const,
    id,
    role,
    value
  }) as KpPlaceValueQuantity<Id, Role>;
  sealedQuantities.add(quantity);
  return quantity;
}

export function certifyKpAdjacentBaseTenPlaces<
  const From extends "ones" | "tens"
>(
  from: KpBaseTenPlace<From>,
  to: KpBaseTenPlace<NoInfer<KpNextBaseTenPlace<From>>>
): KpBaseTenAdjacency<From, KpNextBaseTenPlace<From>> {
  // Nominal place objects close the decoded-data hole: knowing the strings
  // "ones" and "tens" is insufficient to mint exchange authority.
  if (!sealedPlaces.has(from) || !sealedPlaces.has(to)) {
    throw new Error("Base-ten adjacency requires compiler-owned place objects.");
  }
  if (from.unitValue * 10n !== to.unitValue || from.power + 1 !== to.power) {
    throw new Error(
      `Base-ten places ${from.id} and ${to.id} are not adjacent.`
    );
  }
  const adjacency = Object.freeze({
    schemaVersion: "kp.base-ten-adjacency.v1" as const,
    from,
    to,
    exchangeRatio: 10n as const
  });
  sealedAdjacencies.add(adjacency);
  return adjacency as KpBaseTenAdjacency<
    From,
    KpNextBaseTenPlace<From>
  >;
}

export function isKpBaseTenPlace(value: unknown): value is KpBaseTenPlace<KpBaseTenPlaceId> {
  return typeof value === "object" && value !== null && sealedPlaces.has(value);
}

export function isKpDecimalDigit(value: unknown): value is KpDecimalDigit {
  return typeof value === "object" && value !== null && sealedDigits.has(value);
}

export function isKpPlaceValueQuantity(
  value: unknown
): value is KpPlaceValueQuantity {
  return typeof value === "object" &&
    value !== null &&
    sealedQuantities.has(value);
}

export function isKpBaseTenAdjacency(
  value: unknown
): value is KpBaseTenAdjacency<"ones" | "tens", "tens" | "hundreds"> {
  return typeof value === "object" &&
    value !== null &&
    sealedAdjacencies.has(value);
}
