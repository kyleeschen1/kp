import assert from "node:assert/strict";
import test from "node:test";

import {
  decomposeKpPlaceValueQuantity,
  isKpPlaceValueComponent,
  isKpPlaceValueDecomposition,
  recomposeKpPlaceValueDecomposition,
  type KpPlaceValueDecomposition
} from "../domains/quantities/place-value-decomposition.ts";
import {
  createKpPlaceValueQuantity
} from "../domains/quantities/place-value.ts";
import {
  kpPlaceValueAdditionDecompositions,
  kpPlaceValueAdditionQuantities
} from "../src/semantic/place-value-addition-decomposition.ts";

test("canonical addition quantities decompose into exact fixed columns", () => {
  assert.deepEqual(
    Object.values(kpPlaceValueAdditionDecompositions).map((decomposition) => ({
      id: decomposition.id,
      quantityId: decomposition.quantity.id,
      digits: [
        decomposition.columns.hundreds.digit.value,
        decomposition.columns.tens.digit.value,
        decomposition.columns.ones.digit.value
      ],
      exactValues: [
        decomposition.columns.hundreds.exactValue,
        decomposition.columns.tens.exactValue,
        decomposition.columns.ones.exactValue
      ],
      exactTotal: decomposition.exactTotal
    })),
    [
      {
        id: "decomposition.digit.first",
        quantityId: "digit.first",
        digits: [2, 7, 8],
        exactValues: [200n, 70n, 8n],
        exactTotal: 278n
      },
      {
        id: "decomposition.digit.second",
        quantityId: "digit.second",
        digits: [1, 5, 6],
        exactValues: [100n, 50n, 6n],
        exactTotal: 156n
      },
      {
        id: "decomposition.result",
        quantityId: "result",
        digits: [4, 3, 4],
        exactValues: [400n, 30n, 4n],
        exactTotal: 434n
      }
    ]
  );
});

test("component identities are deterministic and match semantic cell identities", () => {
  assert.deepEqual(
    Object.values(kpPlaceValueAdditionDecompositions).flatMap(
      ({ columns }) => [
        columns.hundreds.id,
        columns.tens.id,
        columns.ones.id
      ]
    ),
    [
      "digit.first.hundreds",
      "digit.first.tens",
      "digit.first.ones",
      "digit.second.hundreds",
      "digit.second.tens",
      "digit.second.ones",
      "result.hundreds",
      "result.tens",
      "result.ones"
    ]
  );
  assert.ok(
    Object.values(kpPlaceValueAdditionDecompositions).every(
      ({ columns }) => Object.values(columns).every(isKpPlaceValueComponent)
    )
  );
});

test("every canonical decomposition round trips to its exact quantity", () => {
  for (const decomposition of Object.values(
    kpPlaceValueAdditionDecompositions
  )) {
    assert.equal(
      recomposeKpPlaceValueDecomposition(decomposition),
      decomposition.quantity.value
    );
    assert.ok(isKpPlaceValueDecomposition(decomposition));
  }
  assert.deepEqual(
    Object.values(kpPlaceValueAdditionQuantities).map(({ value }) => value),
    [278n, 156n, 434n]
  );
});

test("leading zero columns remain explicit and exact", () => {
  const seven = createKpPlaceValueQuantity("digit.seven", "addend", 7n);
  const decomposition = decomposeKpPlaceValueQuantity(seven);
  assert.deepEqual(
    [
      decomposition.columns.hundreds.digit.value,
      decomposition.columns.tens.digit.value,
      decomposition.columns.ones.digit.value
    ],
    [0, 0, 7]
  );
  assert.equal(recomposeKpPlaceValueDecomposition(decomposition), 7n);
});

test("copied quantities and decompositions cannot cross the proof boundary", () => {
  const copiedQuantity = {
    ...kpPlaceValueAdditionQuantities.first
  } as typeof kpPlaceValueAdditionQuantities.first;
  assert.throws(
    () => decomposeKpPlaceValueQuantity(copiedQuantity),
    /compiler-owned quantity/
  );

  const copiedDecomposition = {
    ...kpPlaceValueAdditionDecompositions.first
  } as KpPlaceValueDecomposition;
  assert.equal(isKpPlaceValueDecomposition(copiedDecomposition), false);
  assert.throws(
    () => recomposeKpPlaceValueDecomposition(copiedDecomposition),
    /compiler-owned decomposition/
  );
});
