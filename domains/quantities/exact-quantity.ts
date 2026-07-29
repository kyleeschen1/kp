import {
  addKpRationals,
  createKpRational,
  type KpNormalizedRational
} from "../math/exact-rational.ts";

declare const kpQuantityUnitBrand: unique symbol;
declare const kpQuantityProofBrand: unique symbol;

const sealedQuantityProofs = new WeakSet<object>();

export interface KpExactQuantityUnit<UnitId extends string> {
  readonly schemaVersion: "kp.exact-quantity-unit.v1";
  readonly id: UnitId;
  readonly label: string;
  readonly [kpQuantityUnitBrand]: UnitId;
}

export interface KpExactQuantity<UnitId extends string> {
  readonly schemaVersion: "kp.exact-quantity.v1";
  readonly unit: KpExactQuantityUnit<UnitId>;
  readonly value: KpNormalizedRational;
}

export interface KpExactQuantitySumCertificate<UnitId extends string> {
  readonly schemaVersion: "kp.exact-quantity-sum-certificate.v1";
  readonly lawId: "law.quantity.add-same-unit";
  readonly unitId: UnitId;
  readonly left: KpExactQuantity<UnitId>;
  readonly right: KpExactQuantity<UnitId>;
  readonly result: KpExactQuantity<UnitId>;
  readonly [kpQuantityProofBrand]: "sum";
}

export function createKpExactQuantityUnit<const UnitId extends string>(
  id: UnitId,
  label: string
): KpExactQuantityUnit<UnitId> {
  if (id.trim().length === 0) {
    throw new Error("Exact quantity unit ID cannot be empty.");
  }
  if (label.trim().length === 0) {
    throw new Error("Exact quantity unit label cannot be empty.");
  }
  return Object.freeze({
    schemaVersion: "kp.exact-quantity-unit.v1",
    id,
    label
  }) as KpExactQuantityUnit<UnitId>;
}

export function createKpExactQuantity<UnitId extends string>(
  unit: KpExactQuantityUnit<UnitId>,
  value: KpNormalizedRational
): KpExactQuantity<UnitId> {
  return Object.freeze({
    schemaVersion: "kp.exact-quantity.v1",
    unit,
    value: createKpRational(value.numerator, value.denominator)
  });
}

export function certifyKpExactQuantitySum<UnitId extends string>(
  left: KpExactQuantity<UnitId>,
  right: KpExactQuantity<NoInfer<UnitId>>
): KpExactQuantitySumCertificate<UnitId> {
  // The generic catches authored mismatches; this runtime guard closes decoded
  // or otherwise widened inputs before a proof certificate can exist.
  if (left.unit.id !== right.unit.id) {
    throw new Error(
      `Cannot add quantities from ${left.unit.id} and ${right.unit.id}.`
    );
  }
  const result = createKpExactQuantity(
    left.unit,
    addKpRationals(left.value, right.value)
  );
  const certificate = Object.freeze({
    schemaVersion: "kp.exact-quantity-sum-certificate.v1",
    lawId: "law.quantity.add-same-unit",
    unitId: left.unit.id,
    left,
    right,
    result
  });
  sealedQuantityProofs.add(certificate);
  return certificate as KpExactQuantitySumCertificate<UnitId>;
}

export function isKpExactQuantityProof(value: unknown): boolean {
  return typeof value === "object" &&
    value !== null &&
    sealedQuantityProofs.has(value);
}
