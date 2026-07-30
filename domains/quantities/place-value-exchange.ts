import {
  isKpBaseTenAdjacency,
  type KpBaseTenAdjacency,
  type KpNextBaseTenPlace
} from "./place-value.ts";

declare const kpAdjacentPlaceExchangeBrand: unique symbol;

const sealedExchangeCertificates = new WeakSet<object>();

export interface KpAdjacentPlaceExchangeCertificate<
  From extends "ones" | "tens" = "ones" | "tens",
  To extends KpNextBaseTenPlace<From> = KpNextBaseTenPlace<From>
> {
  readonly schemaVersion: "kp.adjacent-place-exchange-certificate.v1";
  readonly lawId: "law.base-ten.exchange-adjacent";
  readonly id: `exchange.${From}-to-${To}`;
  readonly adjacency: KpBaseTenAdjacency<From, To>;
  readonly lowerUnitCount: 10n;
  readonly higherUnitCount: 1n;
  readonly sourceExactValue: bigint;
  readonly resultExactValue: bigint;
  readonly [kpAdjacentPlaceExchangeBrand]: `${From}->${To}`;
}

export function certifyKpAdjacentPlaceExchange<
  const From extends "ones" | "tens",
  const To extends KpNextBaseTenPlace<From>
>(
  adjacency: KpBaseTenAdjacency<From, To>,
  lowerUnitCount: 10n,
  higherUnitCount: 1n
): KpAdjacentPlaceExchangeCertificate<From, To> {
  if (!isKpBaseTenAdjacency(adjacency)) {
    throw new Error(
      "Place-value exchange requires compiler-owned adjacency evidence."
    );
  }
  if (lowerUnitCount !== 10n || higherUnitCount !== 1n) {
    throw new Error("Base-ten exchange must convert exactly ten units into one.");
  }

  const sourceExactValue = adjacency.from.unitValue * lowerUnitCount;
  const resultExactValue = adjacency.to.unitValue * higherUnitCount;
  if (sourceExactValue !== resultExactValue) {
    throw new Error(
      `Exchange from ${adjacency.from.id} to ${adjacency.to.id} does not conserve exact value.`
    );
  }

  const certificate = Object.freeze({
    schemaVersion: "kp.adjacent-place-exchange-certificate.v1" as const,
    lawId: "law.base-ten.exchange-adjacent" as const,
    id: `exchange.${adjacency.from.id}-to-${adjacency.to.id}` as const,
    adjacency,
    lowerUnitCount,
    higherUnitCount,
    sourceExactValue,
    resultExactValue
  });
  sealedExchangeCertificates.add(certificate);
  return certificate as KpAdjacentPlaceExchangeCertificate<From, To>;
}

export function isKpAdjacentPlaceExchangeCertificate(
  value: unknown
): value is KpAdjacentPlaceExchangeCertificate {
  return typeof value === "object" &&
    value !== null &&
    sealedExchangeCertificates.has(value);
}
