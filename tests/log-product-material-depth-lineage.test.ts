import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogProductMaterialLineage
} from "../src/animation/log-product-material-depth-lineage.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("material lineage preserves every factor across distinct occurrences", () => {
  const { family } = kpCanonicalCompiledLogProductOperation.contract;
  assert.deepEqual(
    kpCanonicalLogProductMaterialLineage.factorContinuities,
    family.factors.map((factor) => ({
      semanticId: factor.semanticId,
      sourceEntityId: factor.sourceOccurrenceId,
      targetEntityId: factor.targetOccurrenceId,
      identityEffect: "preserve"
    }))
  );
  for (const continuity of
    kpCanonicalLogProductMaterialLineage.factorContinuities) {
    assert.notEqual(continuity.sourceEntityId, continuity.targetEntityId);
  }
});

test("material lineage withdraws one source application and generates successors", () => {
  const { applicationDerivation } = kpCanonicalLogProductMaterialLineage;
  assert.equal(applicationDerivation.relation, "fan-out");
  assert.equal(applicationDerivation.sourceIdentityEffect, "withdraw-source");
  assert.equal(
    applicationDerivation.targetIdentityEffect,
    "generate-successor"
  );
  assert.equal(applicationDerivation.generatedTargetApplicationEntityIds.length, 2);
  assert.equal(
    new Set(applicationDerivation.generatedTargetApplicationEntityIds).size,
    applicationDerivation.generatedTargetApplicationEntityIds.length
  );
  assert.equal(
    applicationDerivation.generatedTargetApplicationEntityIds.includes(
      applicationDerivation.sourceApplicationEntityId
    ),
    false
  );
});
