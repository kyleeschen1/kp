import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpAdjacentBaseTenPlaces,
  createKpDecimalDigit,
  createKpPlaceValueQuantity,
  decodeKpDecimalDigit,
  isKpBaseTenAdjacency,
  isKpBaseTenPlace,
  isKpDecimalDigit,
  isKpPlaceValueQuantity,
  kpBaseTenPlaces,
  type KpBaseTenPlace,
  type KpPlaceValueQuantity
} from "../domains/quantities/place-value.ts";

test("base-ten places carry exact closed denominations", () => {
  assert.deepEqual(
    Object.values(kpBaseTenPlaces).map(({ id, power, unitValue }) => ({
      id,
      power,
      unitValue
    })),
    [
      { id: "ones", power: 0, unitValue: 1n },
      { id: "tens", power: 1, unitValue: 10n },
      { id: "hundreds", power: 2, unitValue: 100n }
    ]
  );
  assert.ok(Object.values(kpBaseTenPlaces).every(isKpBaseTenPlace));
  assert.equal(
    isKpBaseTenPlace({ ...kpBaseTenPlaces.ones }),
    false
  );
});

test("decimal digits are nominal and reject decoded overflow", () => {
  const eight = createKpDecimalDigit(8);
  assert.equal(eight.value, 8);
  assert.equal(isKpDecimalDigit(eight), true);
  assert.equal(isKpDecimalDigit({ ...eight }), false);
  assert.equal(decodeKpDecimalDigit(6).value, 6);
  assert.throws(() => decodeKpDecimalDigit(-1), /0 through 9/);
  assert.throws(() => decodeKpDecimalDigit(10), /0 through 9/);
  assert.throws(() => decodeKpDecimalDigit(2.5), /0 through 9/);
  assert.throws(() => decodeKpDecimalDigit("8"), /0 through 9/);
});

test("place-value quantities retain exact role identity and bounded totals", () => {
  const first = createKpPlaceValueQuantity(
    "quantity.place-value.first",
    "addend",
    278n
  );
  const result = createKpPlaceValueQuantity(
    "quantity.place-value.result",
    "result",
    434n
  );
  assert.deepEqual(
    [first, result].map(({ id, role, value }) => ({ id, role, value })),
    [
      {
        id: "quantity.place-value.first",
        role: "addend",
        value: 278n
      },
      {
        id: "quantity.place-value.result",
        role: "result",
        value: 434n
      }
    ]
  );
  assert.equal(isKpPlaceValueQuantity(first), true);
  assert.equal(isKpPlaceValueQuantity({ ...first }), false);
  assert.throws(
    () => createKpPlaceValueQuantity("", "addend", 1n),
    /ID cannot be empty/
  );
  assert.throws(
    () => createKpPlaceValueQuantity("quantity.negative", "addend", -1n),
    /between 0 and 999/
  );
  assert.throws(
    () => createKpPlaceValueQuantity("quantity.overflow", "result", 1_000n),
    /between 0 and 999/
  );
});

test("only adjacent compiler-owned places can mint adjacency", () => {
  const onesToTens = certifyKpAdjacentBaseTenPlaces(
    kpBaseTenPlaces.ones,
    kpBaseTenPlaces.tens
  );
  const tensToHundreds = certifyKpAdjacentBaseTenPlaces(
    kpBaseTenPlaces.tens,
    kpBaseTenPlaces.hundreds
  );
  assert.deepEqual(
    [onesToTens, tensToHundreds].map(({ from, to, exchangeRatio }) => ({
      from: from.id,
      to: to.id,
      exchangeRatio
    })),
    [
      { from: "ones", to: "tens", exchangeRatio: 10n },
      { from: "tens", to: "hundreds", exchangeRatio: 10n }
    ]
  );
  assert.ok(isKpBaseTenAdjacency(onesToTens));
  assert.equal(isKpBaseTenAdjacency({ ...onesToTens }), false);

  const copiedOnes = {
    ...kpBaseTenPlaces.ones
  } as unknown as KpBaseTenPlace<"ones">;
  assert.throws(
    () => certifyKpAdjacentBaseTenPlaces(copiedOnes, kpBaseTenPlaces.tens),
    /compiler-owned place objects/
  );
});

test("place and role mismatches fail at the static construction boundary", () => {
  const addend = createKpPlaceValueQuantity(
    "quantity.place-value.static-addend",
    "addend",
    156n
  );
  if (false as boolean) {
    certifyKpAdjacentBaseTenPlaces(
      kpBaseTenPlaces.ones,
      // @ts-expect-error Ones can exchange only into tens.
      kpBaseTenPlaces.hundreds
    );
    // @ts-expect-error Decimal digit literals cannot exceed nine.
    createKpDecimalDigit(10);
    // @ts-expect-error Addends cannot be assigned result authority.
    const resultOnly: KpPlaceValueQuantity<string, "result"> = addend;
    assert.ok(resultOnly);
  }
  assert.equal(addend.role, "addend");
});
