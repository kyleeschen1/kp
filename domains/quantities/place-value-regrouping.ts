import {
  isKpPlaceValueComponent,
  type KpPlaceValueComponent
} from "./place-value-decomposition.ts";
import {
  isKpAdjacentPlaceExchangeCertificate,
  type KpAdjacentPlaceExchangeCertificate
} from "./place-value-exchange.ts";
import {
  createKpDecimalDigit,
  type KpBaseTenPlace,
  type KpBaseTenPlaceId,
  type KpDecimalDigit,
  type KpNextBaseTenPlace
} from "./place-value.ts";

declare const kpCarriedPlaceValueDigitBrand: unique symbol;
declare const kpCarryRemainderLineageBrand: unique symbol;

const sealedCarriedDigits = new WeakSet<object>();
const sealedCarryRemainderLineages = new WeakSet<object>();

export type KpCarryLineageId<
  From extends "ones" | "tens",
  To extends KpNextBaseTenPlace<From>
> = `lineage.carry.${From}-to-${To}`;

export interface KpCarriedPlaceValueDigit<
  Place extends "tens" | "hundreds"
> {
  readonly schemaVersion: "kp.carried-place-value-digit.v1";
  readonly id: `carry.${Place}`;
  readonly createdByLineageId: string;
  readonly place: KpBaseTenPlace<Place>;
  readonly digit: KpDecimalDigit<1>;
  readonly exactValue: bigint;
  readonly [kpCarriedPlaceValueDigitBrand]: Place;
}

export type KpPlaceValueSourceContributor<
  Place extends KpBaseTenPlaceId
> =
  | KpPlaceValueComponent<string, Place, "addend">
  | KpCarriedPlaceValueDigit<Extract<Place, "tens" | "hundreds">>;

export interface KpCarryRemainderLineage<
  From extends "ones" | "tens" = "ones" | "tens",
  To extends KpNextBaseTenPlace<From> = KpNextBaseTenPlace<From>
> {
  readonly schemaVersion: "kp.carry-remainder-lineage.v1";
  readonly id: KpCarryLineageId<From, To>;
  readonly sourcePlace: KpBaseTenPlace<From>;
  readonly contributors: readonly [
    KpPlaceValueSourceContributor<From>,
    KpPlaceValueSourceContributor<From>,
    ...KpPlaceValueSourceContributor<From>[]
  ];
  readonly sourceDigitTotal: number;
  readonly sourceExactValue: bigint;
  readonly exchange: KpAdjacentPlaceExchangeCertificate<From, To>;
  readonly remainder: KpPlaceValueComponent<string, From, "result">;
  readonly carry: KpCarriedPlaceValueDigit<To>;
  readonly outputExactValue: bigint;
  readonly [kpCarryRemainderLineageBrand]: `${From}->${To}`;
}

export function isKpPlaceValueSourceContributor<
  Place extends KpBaseTenPlaceId
>(
  value: unknown,
  expectedPlaceId: Place
): value is KpPlaceValueSourceContributor<Place> {
  if (isKpPlaceValueComponent(value)) {
    return value.quantityRole === "addend" && value.place.id === expectedPlaceId;
  }
  return isKpCarriedPlaceValueDigit(value) &&
    value.place.id === expectedPlaceId;
}

export function certifyKpCarryRemainderLineage<
  const From extends "ones" | "tens",
  const To extends KpNextBaseTenPlace<From>
>(
  exchange: KpAdjacentPlaceExchangeCertificate<From, To>,
  contributors: readonly [
    KpPlaceValueSourceContributor<NoInfer<From>>,
    KpPlaceValueSourceContributor<NoInfer<From>>,
    ...KpPlaceValueSourceContributor<NoInfer<From>>[]
  ],
  remainder: KpPlaceValueComponent<string, NoInfer<From>, "result">
): KpCarryRemainderLineage<From, To> {
  if (!isKpAdjacentPlaceExchangeCertificate(exchange)) {
    throw new Error("Carry lineage requires a compiler-owned exchange proof.");
  }
  if (
    contributors.length < 2 ||
    !contributors.every((candidate) =>
      isKpPlaceValueSourceContributor(
        candidate,
        exchange.adjacency.from.id
      )
    )
  ) {
    throw new Error(
      `Carry contributors must be compiler-owned ${exchange.adjacency.from.id} inputs.`
    );
  }
  if (new Set(contributors.map(({ id }) => id)).size !== contributors.length) {
    throw new Error("Carry contributors must have unique lineage identities.");
  }
  if (
    !isKpPlaceValueComponent(remainder) ||
    remainder.quantityRole !== "result" ||
    remainder.place.id !== exchange.adjacency.from.id
  ) {
    throw new Error(
      `Carry remainder must be a compiler-owned result in ${exchange.adjacency.from.id}.`
    );
  }

  const sourceDigitTotal = contributors.reduce(
    (total, contributor) => total + contributor.digit.value,
    0
  );
  if (sourceDigitTotal < 10 || sourceDigitTotal > 19) {
    throw new Error(
      "One-digit base-ten carry lineage requires a source total from 10 through 19."
    );
  }
  if (remainder.digit.value !== sourceDigitTotal - 10) {
    throw new Error(
      `Carry remainder ${remainder.digit.value} does not match source total ${sourceDigitTotal}.`
    );
  }

  const id =
    `lineage.carry.${exchange.adjacency.from.id}-to-${exchange.adjacency.to.id}` as const;
  const carry = Object.freeze({
    schemaVersion: "kp.carried-place-value-digit.v1" as const,
    id: `carry.${exchange.adjacency.to.id}` as const,
    createdByLineageId: id,
    place: exchange.adjacency.to,
    digit: createKpDecimalDigit(1),
    exactValue: exchange.adjacency.to.unitValue
  });
  sealedCarriedDigits.add(carry);

  const sourceExactValue =
    BigInt(sourceDigitTotal) * exchange.adjacency.from.unitValue;
  const outputExactValue = remainder.exactValue + carry.exactValue;
  if (sourceExactValue !== outputExactValue) {
    throw new Error("Carry and remainder outputs do not conserve exact value.");
  }

  const lineage = Object.freeze({
    schemaVersion: "kp.carry-remainder-lineage.v1" as const,
    id,
    sourcePlace: exchange.adjacency.from,
    contributors: Object.freeze([...contributors]),
    sourceDigitTotal,
    sourceExactValue,
    exchange,
    remainder,
    carry,
    outputExactValue
  });
  sealedCarryRemainderLineages.add(lineage);
  return lineage as unknown as KpCarryRemainderLineage<From, To>;
}

export function isKpCarriedPlaceValueDigit(
  value: unknown
): value is KpCarriedPlaceValueDigit<"tens" | "hundreds"> {
  return typeof value === "object" &&
    value !== null &&
    sealedCarriedDigits.has(value);
}

export function isKpCarryRemainderLineage(
  value: unknown
): value is KpCarryRemainderLineage {
  return typeof value === "object" &&
    value !== null &&
    sealedCarryRemainderLineages.has(value);
}
