import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpAdjacentPlaceExchange,
  isKpAdjacentPlaceExchangeCertificate,
  type KpAdjacentPlaceExchangeCertificate
} from "../domains/quantities/place-value-exchange.ts";
import {
  certifyKpAdjacentBaseTenPlaces,
  kpBaseTenPlaces,
  type KpBaseTenAdjacency
} from "../domains/quantities/place-value.ts";
import {
  kpPlaceValueAdditionExchangeCertificates
} from "../src/semantic/place-value-addition-exchange.ts";

test("canonical exchanges conserve exact value across adjacent places", () => {
  assert.deepEqual(
    Object.values(kpPlaceValueAdditionExchangeCertificates).map(
      ({
        id,
        adjacency,
        lowerUnitCount,
        higherUnitCount,
        sourceExactValue,
        resultExactValue
      }) => ({
        id,
        from: adjacency.from.id,
        to: adjacency.to.id,
        lowerUnitCount,
        higherUnitCount,
        sourceExactValue,
        resultExactValue
      })
    ),
    [
      {
        id: "exchange.ones-to-tens",
        from: "ones",
        to: "tens",
        lowerUnitCount: 10n,
        higherUnitCount: 1n,
        sourceExactValue: 10n,
        resultExactValue: 10n
      },
      {
        id: "exchange.tens-to-hundreds",
        from: "tens",
        to: "hundreds",
        lowerUnitCount: 10n,
        higherUnitCount: 1n,
        sourceExactValue: 100n,
        resultExactValue: 100n
      }
    ]
  );
  assert.ok(
    Object.values(kpPlaceValueAdditionExchangeCertificates).every(
      isKpAdjacentPlaceExchangeCertificate
    )
  );
});

test("copied adjacency and exchange certificates cannot mint proof authority", () => {
  const copiedAdjacency = {
    ...kpPlaceValueAdditionExchangeCertificates.onesToTens.adjacency
  } as KpBaseTenAdjacency<"ones", "tens">;
  assert.throws(
    () => certifyKpAdjacentPlaceExchange(copiedAdjacency, 10n, 1n),
    /compiler-owned adjacency/
  );

  const copiedCertificate = {
    ...kpPlaceValueAdditionExchangeCertificates.onesToTens
  } as KpAdjacentPlaceExchangeCertificate<"ones", "tens">;
  assert.equal(
    isKpAdjacentPlaceExchangeCertificate(copiedCertificate),
    false
  );
});

test("wrong exchange counts fail statically and at widened runtime boundaries", () => {
  const adjacency = certifyKpAdjacentBaseTenPlaces(
    kpBaseTenPlaces.ones,
    kpBaseTenPlaces.tens
  );
  if (false as boolean) {
    // @ts-expect-error A base-ten exchange consumes exactly ten lower units.
    certifyKpAdjacentPlaceExchange(adjacency, 9n, 1n);
    // @ts-expect-error A base-ten exchange produces exactly one higher unit.
    certifyKpAdjacentPlaceExchange(adjacency, 10n, 2n);
  }

  assert.throws(
    () => certifyKpAdjacentPlaceExchange(
      adjacency,
      9n as 10n,
      1n
    ),
    /exactly ten units into one/
  );
  assert.throws(
    () => certifyKpAdjacentPlaceExchange(
      adjacency,
      10n,
      2n as 1n
    ),
    /exactly ten units into one/
  );
});
