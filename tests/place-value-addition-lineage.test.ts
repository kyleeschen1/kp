import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpCarryRemainderLineage,
  isKpCarriedPlaceValueDigit,
  isKpCarryRemainderLineage,
  type KpCarryRemainderLineage
} from "../domains/quantities/place-value-regrouping.ts";
import {
  kpPlaceValueAdditionDecompositions as decomposition
} from "../src/semantic/place-value-addition-decomposition.ts";
import {
  kpPlaceValueAdditionExchangeCertificates as exchange
} from "../src/semantic/place-value-addition-exchange.ts";
import {
  kpPlaceValueAdditionCarryLineages
} from "../src/semantic/place-value-addition-lineage.ts";

test("ones exchange emits the settled four and the carried ten", () => {
  const lineage = kpPlaceValueAdditionCarryLineages.ones;
  assert.deepEqual(
    {
      id: lineage.id,
      contributors: lineage.contributors.map(({ id }) => id),
      sourceDigitTotal: lineage.sourceDigitTotal,
      sourceExactValue: lineage.sourceExactValue,
      remainder: {
        id: lineage.remainder.id,
        digit: lineage.remainder.digit.value,
        exactValue: lineage.remainder.exactValue
      },
      carry: {
        id: lineage.carry.id,
        digit: lineage.carry.digit.value,
        place: lineage.carry.place.id,
        exactValue: lineage.carry.exactValue
      },
      outputExactValue: lineage.outputExactValue
    },
    {
      id: "lineage.carry.ones-to-tens",
      contributors: ["digit.first.ones", "digit.second.ones"],
      sourceDigitTotal: 14,
      sourceExactValue: 14n,
      remainder: { id: "result.ones", digit: 4, exactValue: 4n },
      carry: { id: "carry.tens", digit: 1, place: "tens", exactValue: 10n },
      outputExactValue: 14n
    }
  );
});

test("the same carried ten is a typed contributor to the tens exchange", () => {
  const { ones, tens } = kpPlaceValueAdditionCarryLineages;
  assert.equal(tens.contributors[0], ones.carry);
  assert.deepEqual(
    {
      contributors: tens.contributors.map(({ id }) => id),
      sourceDigitTotal: tens.sourceDigitTotal,
      sourceExactValue: tens.sourceExactValue,
      remainderId: tens.remainder.id,
      remainderDigit: tens.remainder.digit.value,
      carryId: tens.carry.id,
      carryPlace: tens.carry.place.id,
      outputExactValue: tens.outputExactValue
    },
    {
      contributors: [
        "carry.tens",
        "digit.first.tens",
        "digit.second.tens"
      ],
      sourceDigitTotal: 13,
      sourceExactValue: 130n,
      remainderId: "result.tens",
      remainderDigit: 3,
      carryId: "carry.hundreds",
      carryPlace: "hundreds",
      outputExactValue: 130n
    }
  );
  assert.ok(isKpCarriedPlaceValueDigit(ones.carry));
  assert.ok(isKpCarriedPlaceValueDigit(tens.carry));
  assert.ok(isKpCarryRemainderLineage(ones));
  assert.ok(isKpCarryRemainderLineage(tens));
});

test("lineage rejects duplicate contributors, wrong remainder, and copied proof", () => {
  assert.throws(
    () => certifyKpCarryRemainderLineage(
      exchange.onesToTens,
      [
        decomposition.first.columns.ones,
        decomposition.first.columns.ones
      ],
      decomposition.result.columns.ones
    ),
    /unique lineage identities/
  );
  assert.throws(
    () => certifyKpCarryRemainderLineage(
      exchange.onesToTens,
      [
        decomposition.first.columns.ones,
        decomposition.second.columns.ones
      ],
      decomposition.result.columns.tens as unknown as
        typeof decomposition.result.columns.ones
    ),
    /result in ones/
  );

  const copied = {
    ...kpPlaceValueAdditionCarryLineages.ones
  } as KpCarryRemainderLineage<"ones", "tens">;
  assert.equal(isKpCarryRemainderLineage(copied), false);
});

test("static lineage boundaries reject the wrong place or quantity role", () => {
  if (false as boolean) {
    certifyKpCarryRemainderLineage(
      exchange.onesToTens,
      [
        decomposition.first.columns.ones,
        // @ts-expect-error Tens cannot contribute to a ones-column exchange.
        decomposition.second.columns.tens
      ],
      decomposition.result.columns.ones
    );
    certifyKpCarryRemainderLineage(
      exchange.onesToTens,
      [
        decomposition.first.columns.ones,
        decomposition.second.columns.ones
      ],
      // @ts-expect-error An addend digit cannot claim result remainder authority.
      decomposition.first.columns.ones
    );
  }
  assert.equal(kpPlaceValueAdditionCarryLineages.ones.remainder.quantityRole, "result");
});
