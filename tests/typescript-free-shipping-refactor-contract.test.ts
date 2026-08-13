import assert from "node:assert/strict";
import test from "node:test";

import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

test("the threshold refactor has one novice-readable motivation and exact source", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;

  assert.equal(contract.schemaVersion, "kp.typescript-free-shipping-refactor.v1");
  assert.match(contract.learningClaim, /one business rule appears twice/);
  assert.match(contract.noviceMotivation, /checkout price and customer message can disagree/);
  assert.equal(
    contract.before.source.match(/total >= 50/g)?.length,
    2,
    "the before source must make the duplication visible"
  );
  assert.equal(
    contract.after.source.match(/total >= 50/g)?.length,
    1,
    "the after source must have one threshold authority"
  );
  assert.equal(
    contract.after.source.match(/qualifiesForFreeShipping\(total\)/g)?.length,
    2,
    "both callers must use the named rule"
  );
});

test("the authored stage order leads from duplication to verified parity", () => {
  const stages = kpTypeScriptFreeShippingRefactorContract.stages;

  assert.deepEqual(stages.map(({ operation }) => operation), [
    "orient",
    "compare-duplicates",
    "introduce-helper",
    "move-shared-rule",
    "replace-call-site",
    "replace-call-site",
    "verify-parity"
  ]);
  assert.deepEqual(stages.map(({ progress }) => progress), [
    0,
    0.16,
    0.34,
    0.5,
    0.68,
    0.84,
    1
  ]);
  assert.ok(
    stages.findIndex(({ id }) => id === "stage.move-shared-rule") <
      stages.findIndex(({ id }) => id === "stage.replace-cost-call")
  );
  assert.ok(
    stages.findIndex(({ id }) => id === "stage.replace-cost-call") <
      stages.findIndex(({ id }) => id === "stage.replace-message-call")
  );
});

test("every stage focus id belongs to the frozen semantic inventory", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const entityIds = contract.entities.map(({ id }) => id);

  assert.equal(new Set(entityIds).size, entityIds.length);
  for (const stage of contract.stages) {
    assert.ok(stage.narration.length >= 45, stage.id);
    for (const entityId of stage.focusEntityIds) {
      assert.ok(entityIds.includes(entityId), `${stage.id}: ${entityId}`);
    }
  }
  assert.deepEqual(
    contract.entities
      .filter(({ label }) => label === "total >= 50")
      .map(({ id }) => id),
    [
      "rule.shipping-cost.before",
      "rule.shipping-message.before",
      "rule.qualifies.after"
    ]
  );
});

test("the behavior boundary covers below at and above the threshold", () => {
  assert.deepEqual(
    kpTypeScriptFreeShippingRefactorContract.behaviorCases,
    [
      {
        id: "below-threshold",
        total: 49,
        freeShipping: false,
        shippingCost: 5,
        shippingMessage: "Shipping: $5"
      },
      {
        id: "at-threshold",
        total: 50,
        freeShipping: true,
        shippingCost: 0,
        shippingMessage: "Free shipping"
      },
      {
        id: "above-threshold",
        total: 75,
        freeShipping: true,
        shippingCost: 0,
        shippingMessage: "Free shipping"
      }
    ]
  );
});

test("the visual and authority boundary requires continuity without execution", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;

  assert.ok(contract.visualAcceptance.some((criterion) =>
    criterion.includes("settle before either caller")
  ));
  assert.ok(contract.visualAcceptance.some((criterion) =>
    criterion.includes("Operators and punctuation")
  ));
  assert.ok(contract.visualAcceptance.some((criterion) =>
    criterion.includes("Direct seek and rewind")
  ));
  assert.deepEqual(contract.authority.prohibited, [
    "arbitrary-source-execution",
    "browser-typescript-compiler",
    "compiler-traversal-as-pedagogical-order",
    "glyph-equality-as-identity",
    "geometry-as-semantic-authority",
    "second-clock-or-scheduler"
  ]);
});
