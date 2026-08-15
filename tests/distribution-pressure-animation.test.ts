import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalDistributionPressureBinding,
  kpCanonicalDistributionPressurePlan,
  sampleKpCanonicalDistributionPressureAnimation
} from "../src/animation/distribution-pressure-animation.ts";
import {
  kpCanonicalDistributionPressureContract
} from "../src/semantic/distribution-pressure-contract.ts";

test("the distribution animation is only a typed binding over the existing choreography", () => {
  const binding = kpCanonicalDistributionPressureBinding;
  const contract = kpCanonicalDistributionPressureContract;

  assert.equal(binding.id, "binding.distribution.expand-a-sum.pressure");
  assert.equal(
    binding.sourceFactorId,
    contract.factorFanOut.sourceFactorSelectorId
  );
  assert.deepEqual(
    binding.factorCopyIds,
    contract.factorFanOut.targetFactorSelectorIds
  );
  assert.deepEqual(
    binding.addendPairs.map(({ sourceId, targetId, semanticIndex }) => ({
      sourceId,
      targetId,
      semanticIndex
    })),
    contract.continuants
      .filter(({ role }) => role !== "connector")
      .map(({ sourceSelectorId, targetSelectorId }, semanticIndex) => ({
        sourceId: sourceSelectorId,
        targetId: targetSelectorId,
        semanticIndex
      }))
  );
  assert.deepEqual(binding.connectorPairs, [{
    sourceId: contract.connectorAttachment.sourceSelectorId,
    targetId: contract.connectorAttachment.targetSelectorId,
    semanticIndex: 0,
    motionConstraint: "follow-products-on-math-axis"
  }]);
  assert.deepEqual(
    binding.groupingArtifactIds,
    contract.groupingRetirement.sourceSelectorIds
  );
});

test("distribution direct seeks are deterministic and settle the native endpoint", () => {
  for (const progress of [0, 0.18, 0.5, 0.68, 0.83, 0.94, 1]) {
    assert.deepEqual(
      sampleKpCanonicalDistributionPressureAnimation(progress),
      sampleKpCanonicalDistributionPressureAnimation(progress)
    );
  }

  const source = sampleKpCanonicalDistributionPressureAnimation(0);
  assert.equal(source.sourceFactor.opacity, 1);
  assert.ok(source.factorCopies.every(({ opacity }) => opacity === 0));
  assert.equal(source.groupingOpacity, 1);

  const target = sampleKpCanonicalDistributionPressureAnimation(1);
  assert.equal(target.sourceFactor.opacity, 0);
  assert.ok(target.factorCopies.every(({ opacity, pathProgress }) =>
    opacity === 1 && pathProgress === 1
  ));
  assert.equal(target.groupingOpacity, 0);
  assert.equal(target.productSettlementProgress, 1);
  assert.equal(target.addendReflowProgress, 1);
});

test("the persistent connector remains attached to both ordered products", () => {
  const binding = kpCanonicalDistributionPressureBinding;
  const frame = sampleKpCanonicalDistributionPressureAnimation(0);

  assert.deepEqual(
    frame.fission.planId,
    `${binding.id}.factor-fission`
  );
  assert.deepEqual(
    kpCanonicalDistributionPressurePlan.operatorGroups.map((operator) => ({
      left: operator.leftProductGroupId,
      right: operator.rightProductGroupId,
      constraint: operator.motionConstraint
    })),
    [{
      left: `${binding.id}.product.0`,
      right: `${binding.id}.product.1`,
      constraint: "follow-products-on-math-axis"
    }]
  );
});
