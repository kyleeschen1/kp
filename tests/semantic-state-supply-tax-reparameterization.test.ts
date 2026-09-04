import assert from "node:assert/strict";
import test from "node:test";

import { evaluateKpParameterizedPerUnitTax } from
  "../domains/economics/per-unit-tax-parameterized.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import { createKpSemanticDerivationFingerprint } from
  "../src/semantic-state/derived-fingerprint.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  pinKpSemanticSlotVersion,
  recoverKpPinnedSnapshot,
  recoverKpPinnedVersion
} from "../src/semantic-state/pinned-recovery.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import { createKpSemanticStateSupplyTaxFamilyAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";

test("alternate tax applications branch from one persistent baseline", () => {
  const fixture = createBranches();

  assert.equal(fixture.original.commit.before, fixture.authoring.initial);
  assert.equal(fixture.taxTwo.commit.before, fixture.authoring.initial);
  assert.equal(fixture.taxSix.commit.before, fixture.authoring.initial);
  assert.notEqual(fixture.original.commit.after.id, fixture.taxTwo.commit.after.id);
  assert.notEqual(fixture.taxTwo.commit.after.id, fixture.taxSix.commit.after.id);
  assert.deepEqual(fixture.original.after.market.taxAmount.read(), exact("4"));
  assert.deepEqual(fixture.taxTwo.after.market.taxAmount.read(), exact("2"));
  assert.deepEqual(fixture.taxSix.after.market.taxAmount.read(), exact("6"));

  for (const [application, amount] of [
    [fixture.taxTwo, exact("2")],
    [fixture.taxSix, exact("6")]
  ] as const) {
    assert.equal(application.source.kind, "reparameterized");
    if (application.source.kind !== "reparameterized") {
      throw new Error("Expected reparameterized tax provenance.");
    }
    assert.equal(
      application.source.sourceApplication.applicationId,
      fixture.original.applicationId
    );
    assert.equal(
      application.source.sourceApplication.transformationId,
      fixture.original.transformationId
    );
    assert.deepEqual(evaluateKpSemanticDerivedValue({
      graph: fixture.authoring.graph,
      snapshot: application.commit.after,
      target: fixture.authoring.handles.refs.market.evaluation
    }), evaluateKpParameterizedPerUnitTax({
      model: fixture.authoring.sourceModel,
      taxAmount: amount
    }));
  }
});

test("interleaved branch samples retain exact distinct results and fingerprints", () => {
  const fixture = createBranches();
  const evaluators = [fixture.taxSix, fixture.original, fixture.taxTwo].map(
    application => createKpSemanticStateFamilyEvaluator({
      definition: fixture.authoring.family,
      application,
      sampleCacheCapacity: 1
    })
  );
  const progress = createKpSemanticProgress(1n, 2n);
  const samples = evaluators.map(evaluator => evaluator.at(progress));
  const observedTaxes = samples.map(sample => evaluateKpSemanticDerivedValue({
    graph: fixture.authoring.graph,
    source: sample.source,
    target: fixture.authoring.handles.refs.market.evaluation
  }).taxAmount);
  const fingerprints = samples.map(sample =>
    createKpSemanticDerivationFingerprint({
      graph: fixture.authoring.graph,
      source: sample.source,
      target: fixture.authoring.handles.refs.outcomes.governmentRevenue
    })
  );

  assert.deepEqual(observedTaxes, [exact("3"), exact("2"), exact("1")]);
  assert.equal(new Set(fingerprints.map(({ key }) => key)).size, 3);
  assert.deepEqual(
    evaluators.map((evaluator, index) => evaluator.at(progress) === samples[index]),
    [true, true, true]
  );

  evaluators[1]!.dispose();
  assert.equal(evaluators[0]!.at(progress), samples[0]);
  assert.equal(evaluators[2]!.at(progress), samples[2]);
  assert.deepEqual(evaluators.map(evaluator => evaluator.inspect().status), [
    "active",
    "disposed",
    "active"
  ]);
});

test("branch endpoints recover without retaining sample history", () => {
  const fixture = createBranches();
  const applications = [fixture.original, fixture.taxTwo, fixture.taxSix];
  const durableBefore = JSON.stringify(applications.map(({ commit }) => commit));
  const recovery = createKpSemanticSnapshotRecoveryIndex([
    fixture.authoring.initial,
    ...applications.map(({ commit }) => commit.after)
  ]);
  const snapshots = applications.map(({ commit }) =>
    pinKpAggregateSemanticSnapshot(commit.after)
  );
  const taxVersions = applications.map(({ commit }) =>
    pinKpSemanticSlotVersion(
      commit.after,
      fixture.authoring.handles.refs.market.taxAmount.slotId
    )
  );

  for (const [index, application] of applications.entries()) {
    const evaluator = createKpSemanticStateFamilyEvaluator({
      definition: fixture.authoring.family,
      application,
      sampleCacheCapacity: 2
    });
    evaluator.at(createKpSemanticProgress(1n, 3n));
    evaluator.at(createKpSemanticProgress(2n, 3n));
    evaluator.dispose();

    assert.equal(
      recoverKpPinnedSnapshot(recovery, snapshots[index]!),
      application.commit.after
    );
    assert.deepEqual(
      recoverKpPinnedVersion(recovery, taxVersions[index]!).value,
      application.after.market.taxAmount.read()
    );
  }
  assert.equal(JSON.stringify(applications.map(({ commit }) => commit)),
    durableBefore);
});

test("source parameters and provenance remain frozen under branch sampling", () => {
  const fixture = createBranches();
  const originalRecord = JSON.stringify(fixture.original);
  const originalTax = fixture.original.after.market.taxAmount.read();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.authoring.family,
    application: fixture.taxSix,
    sampleCacheCapacity: 1
  });

  evaluator.at(createKpSemanticProgress(3n, 4n));
  assert.equal(JSON.stringify(fixture.original), originalRecord);
  assert.deepEqual(fixture.original.after.market.taxAmount.read(), originalTax);
  assert.equal(Object.isFrozen(fixture.taxTwo.parameters), true);
  assert.equal(Object.isFrozen(fixture.taxSix.parameters), true);
  assert.equal(Object.isFrozen(fixture.taxTwo.source), true);
  assert.equal(Object.isFrozen(fixture.taxSix.source), true);
});

function createBranches() {
  const authoring = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const original = authoring.application;
  const taxTwo = authoring.family.reparameterize(original, {
    applicationId: "tax-two",
    parameters: { finalTaxAmount: exact("2") },
    sourceId: "economics.supply-tax.family-authoring.reparameterize.tax-two"
  });
  const taxSix = authoring.family.reparameterize(original, {
    applicationId: "tax-six",
    parameters: { finalTaxAmount: exact("6") },
    sourceId: "economics.supply-tax.family-authoring.reparameterize.tax-six"
  });
  return { authoring, original, taxTwo, taxSix };
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}
