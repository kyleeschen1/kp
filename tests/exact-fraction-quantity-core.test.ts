import assert from "node:assert/strict";
import test from "node:test";

import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  subtractKpRationals
} from "../domains/math/exact-rational.ts";
import {
  certifyKpExactQuantitySum,
  createKpExactQuantity,
  createKpExactQuantityUnit,
  type KpExactQuantity
} from "../domains/quantities/exact-quantity.ts";

test("domain-neutral exact rationals normalize signs, zero, and factors", () => {
  assert.deepEqual(createKpRational(10n, -4n), {
    numerator: -5n,
    denominator: 2n
  });
  assert.deepEqual(createKpRational(0n, -9n), {
    numerator: 0n,
    denominator: 1n
  });
  assert.throws(
    () => createKpRational(1n, 0n),
    /denominator cannot be zero/
  );
});

test("domain-neutral rational addition and inverse laws remain exact", () => {
  const third = createKpRational(1n, 3n);
  const sixth = createKpRational(1n, 6n);

  assert.deepEqual(addKpRationals(third, sixth), {
    numerator: 1n,
    denominator: 2n
  });
  assert.ok(
    equalKpRationals(
      subtractKpRationals(third, third),
      createKpRational(0n)
    )
  );
});

test("same-unit quantities produce an exact proof-carrying sum", () => {
  const unit = createKpExactQuantityUnit(
    "unit.exact-fraction-quantity.one-whole",
    "one whole"
  );
  const third = createKpExactQuantity(unit, createKpRational(1n, 3n));
  const sixth = createKpExactQuantity(unit, createKpRational(1n, 6n));
  const certificate = certifyKpExactQuantitySum(third, sixth);

  assert.equal(certificate.lawId, "law.quantity.add-same-unit");
  assert.equal(certificate.unitId, unit.id);
  assert.deepEqual(certificate.result.value, {
    numerator: 1n,
    denominator: 2n
  });
  assert.ok(Object.isFrozen(certificate.result.value));
  assert.ok(Object.isFrozen(certificate));
});

test("decoded or widened cross-unit inputs cannot mint a certificate", () => {
  const whole = createKpExactQuantityUnit("unit.whole", "one whole");
  const meter = createKpExactQuantityUnit("unit.meter", "one meter");
  const wholeThird = createKpExactQuantity(
    whole,
    createKpRational(1n, 3n)
  );
  const meterSixth = createKpExactQuantity(
    meter,
    createKpRational(1n, 6n)
  );

  assert.throws(
    () => certifyKpExactQuantitySum(
      wholeThird as KpExactQuantity<string>,
      meterSixth as KpExactQuantity<string>
    ),
    /Cannot add quantities from unit\.whole and unit\.meter/
  );
});

test("the certified constructor rejects statically distinct units", () => {
  const whole = createKpExactQuantityUnit("unit.whole", "one whole");
  const meter = createKpExactQuantityUnit("unit.meter", "one meter");
  const wholeThird = createKpExactQuantity(
    whole,
    createKpRational(1n, 3n)
  );
  const meterSixth = createKpExactQuantity(
    meter,
    createKpRational(1n, 6n)
  );

  if (false as boolean) {
    // @ts-expect-error Distinct unit identities cannot reach certification.
    certifyKpExactQuantitySum(wholeThird, meterSixth);
  }
  assert.notEqual(wholeThird.unit.id, meterSixth.unit.id);
});
