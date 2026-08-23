import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLogProductEquivalencePaintOwnershipV2,
  isKpCompiledLogProductEquivalencePaintOwnershipV2
} from "../src/domain-ir/log-product-equivalence-paint-ownership-v2.ts";
import {
  kpLogProductEquivalenceFrame
} from "../src/semantic/log-product-equivalence-frame.ts";

test("retained source syntax is excluded from live equivalence paint", () => {
  const plan = kpLogProductEquivalenceFrame.paintOwnership;
  assert.equal(isKpCompiledLogProductEquivalencePaintOwnershipV2(plan), true);
  assert.deepEqual(plan.liveTransition.sourceCloneEntityIds, [
    "source.product.x",
    "source.product.y"
  ]);
  assert.equal(plan.liveTransition.suppressedSourceEntityIds.includes(
    "source.log.operator"), true);
  assert.equal(plan.liveTransition.suppressedSourceEntityIds.includes(
    "source.log.open"), true);
  assert.equal(plan.liveTransition.suppressedSourceEntityIds.includes(
    "source.log.close"), true);
  assert.equal(plan.retainedNative.lifecycle, "frozen-through-transition");
});

test("every target entity belongs to live construction before native handoff", () => {
  const plan = kpLogProductEquivalenceFrame.paintOwnership;
  assert.deepEqual(
    new Set(plan.liveTransition.targetEntityIds),
    new Set(plan.settledTarget.entityIds)
  );
  assert.equal(plan.settledTarget.handoff,
    "material-settles-before-native-target");
  assert.equal(new Set([
    plan.retainedNative.paintOccurrenceId,
    plan.equalityNative.paintOccurrenceId,
    ...plan.liveTransition.paintOccurrenceIds,
    plan.settledTarget.paintOccurrenceId
  ]).size, 5);
});

test("copied occurrence data cannot mint paint authority", () => {
  assert.throws(() => compileKpLogProductEquivalencePaintOwnershipV2({
    occurrences: { ...kpLogProductEquivalenceFrame.occurrences }
  }), /compiled occurrence identity/);
});
