import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpRadicalMaterialContinuity
} from "../src/animation/radical-material-continuity.ts";

test("radical material continuity classifies source and target fragments", () => {
  const continuity = createKpRadicalMaterialContinuity(
    createExponentRadicalRewriteAnimationAsset()
  );
  assert.deepEqual(
    continuity.plan.fragments.map((fragment) => fragment.role),
    [
      "numerator",
      "fraction-rule",
      "denominator",
      "radical-hook",
      "radical-overbar"
    ]
  );
  assert.deepEqual(
    continuity.plan.fragments.map((fragment) => fragment.propagationRank),
    [0, 1, 2, 0, 1]
  );
  assert.ok(
    continuity.plan.fragments.every((fragment) =>
      fragment.semanticAuthority === false
    )
  );
});

test("radical fragments reconcile through one required native-settlement bundle", () => {
  const continuity = createKpRadicalMaterialContinuity(
    createExponentRadicalRewriteAnimationAsset()
  );
  const bundle = continuity.plan.bundles[0]!;
  assert.equal(bundle.id, continuity.bundleId);
  assert.equal(bundle.reconciliation, "shared-region");
  assert.equal(bundle.nativeSettlementRequired, true);
  assert.equal(bundle.sourceFragmentIds.length, 3);
  assert.equal(bundle.targetFragmentIds.length, 2);
  assert.equal(
    continuity.plan.materialContinuants.find(
      (continuant) => continuant.id === continuity.baseContinuantId
    )?.ownership,
    "stable-owner"
  );
  assert.equal(
    continuity.plan.materialContinuants.find(
      (continuant) => continuant.id === continuity.notationContinuantId
    )?.ownership,
    "shared-reconciliation"
  );
});
