import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableFinalCollectionCertificate
} from "../src/semantic/foldable-distribution-operation-certificates.ts";

test("final collection certifies exact coefficient and signed-constant results", () => {
  const certificate = createKpFoldableFinalCollectionCertificate();

  assert.deepEqual(certificate.arithmetic, [
    {
      id: "collection.foldable-distribution.coefficient",
      inputValues: [3, 2],
      targetValue: 5
    },
    {
      id: "collection.foldable-distribution.constant",
      inputValues: [6, -2],
      targetValue: 4
    }
  ]);
});

test("every collected material role has complete many-to-one lineage", () => {
  const certificate = createKpFoldableFinalCollectionCertificate();
  const records = certificate.transformation.correspondenceMap!.records;
  const merges = records.filter(({ relation }) => relation === "fan-in");

  assert.deepEqual(
    merges.map(({ sourceSelectorIds, targetSelectorIds }) => [
      sourceSelectorIds,
      targetSelectorIds
    ]),
    [
      [
        ["grouped.coefficient-3", "grouped.coefficient-2"],
        ["collected.coefficient-5"]
      ],
      [
        ["grouped.x-from-left", "grouped.x-from-right"],
        ["collected.x"]
      ],
      [
        ["grouped.constant-6", "grouped.negative-2"],
        ["collected.constant-4"]
      ]
    ]
  );
  assert.ok(merges.every(
    ({ sourceSelectorIds, targetSelectorIds }) =>
      sourceSelectorIds.length === 2 && targetSelectorIds.length === 1
  ));
});

test("final fusion is opaque and settles into exact native KaTeX", () => {
  const certificate = createKpFoldableFinalCollectionCertificate();

  assert.deepEqual(certificate.canonicalOperationIds, ["kp.core.merge"]);
  assert.deepEqual(certificate.presentation, {
    requiredMotif: "merge-fan-in",
    fusionPaintPolicy: "opaque-many-to-one",
    settlement: "exact-native-target",
    geometryAuthority: "renderer-session-measurement"
  });
  assert.equal(JSON.stringify(certificate).includes("fade"), false);
});
