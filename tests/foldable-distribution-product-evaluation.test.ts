import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableProductEvaluationCertificates
} from "../src/semantic/foldable-distribution-operation-certificates.ts";

test("constant products certify exact signed arithmetic", () => {
  const certificates = createKpFoldableProductEvaluationCertificates();

  assert.deepEqual(
    certificates.map(({ inputValues, targetValue }) => ({
      inputValues,
      targetValue
    })),
    [
      { inputValues: [3, 2], targetValue: 6 },
      { inputValues: [2, -1], targetValue: -2 }
    ]
  );
  assert.ok(certificates.every(
    ({ authority }) =>
      authority.strictLawId === "law.arithmetic.constant-product"
  ));
});

test("product results retain complete many-to-one provenance", () => {
  const certificates = createKpFoldableProductEvaluationCertificates();

  certificates.forEach(({ inputSubtreeIds, operatorSelectorId, transformation }) => {
    const [derivation, retirement] =
      transformation.correspondenceMap!.records;
    assert.equal(derivation?.relation, "fan-in");
    assert.deepEqual(derivation?.sourceSelectorIds, inputSubtreeIds);
    assert.equal(derivation?.targetSelectorIds.length, 1);
    assert.equal(retirement?.relation, "removal");
    assert.deepEqual(retirement?.sourceSelectorIds, [operatorSelectorId]);
    assert.equal(
      derivation?.sourceSelectorIds.includes(operatorSelectorId),
      false
    );
  });
});

test("product evaluation requires causal synthesis and measured native settlement", () => {
  const certificates = createKpFoldableProductEvaluationCertificates();

  certificates.forEach(({ presentation }) => {
    assert.deepEqual(presentation, {
      requiredMotif: "successor-synthesis",
      materialPolicy: "inputs-opaque-through-target-recognition",
      settlement: "exact-native-target",
      geometryAuthority: "renderer-session-measurement"
    });
  });
  assert.equal(
    JSON.stringify(certificates).includes("fade"),
    false
  );
  assert.equal(
    JSON.stringify(certificates).includes("left\":"),
    false
  );
});
