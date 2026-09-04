import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpSemanticDerivedValueWithMemo,
  resolveKpSemanticConcreteDependency,
  type KpSemanticDerivedEvaluationMemo
} from "../src/semantic-state/derived-evaluator.ts";
import type { KpPersistentSemanticValue } from
  "../src/semantic-state/entity-version-store.ts";
import type { KpSemanticSlotId } from
  "../src/semantic-state/identity.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  createKpSemanticStateFamilyEvaluator,
  KpSemanticStateFamilyEvaluatorError
} from "../src/semantic-state/state-family-evaluator.ts";
import { createKpSemanticStateSupplyTaxFamilyAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";

test("sample status is exact progress metadata, not a second driver", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createEvaluator(fixture, 0);
  const baseline = evaluator.at(createKpSemanticProgress(0n, 9n));
  const intermediate = evaluator.at(createKpSemanticProgress(5n, 10n));
  const target = evaluator.at(createKpSemanticProgress(7n, 7n));

  assert.equal(baseline.sampleStatus, "baseline");
  assert.equal(intermediate.sampleStatus, "intermediate");
  assert.equal(target.sampleStatus, "target");
  assert.equal(intermediate.kind, "ephemeral-interior");
  if (intermediate.kind !== "ephemeral-interior") {
    throw new Error("Expected an intermediate sample.");
  }
  assert.deepEqual(intermediate.source.drivers.map(driver => ({
    declarationId: driver.declarationId,
    targetSlotId: driver.targetSlotId
  })), [{
    declarationId: fixture.taxTransition.id,
    targetSlotId: fixture.handles.refs.market.taxAmount.slotId
  }]);
  assert.equal(fixture.application.commit.journal.length, 1);
  assert.deepEqual(
    fixture.family.declaration.transitionPlan.declarations.map(
      declaration => declaration.transitionMode
    ),
    ["semantic-interpolation"]
  );
});

test("requested supply-tax descendants evaluate only their closure", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const source = createEvaluator(fixture, 0).at(
    createKpSemanticProgress(1n, 2n)
  ).source;
  const incidenceMemo = createTracingMemo();

  evaluateKpSemanticDerivedValueWithMemo({
    graph: fixture.graph,
    source,
    target: fixture.handles.refs.outcomes.incidence,
    memo: incidenceMemo.memo
  });
  assert.deepEqual(incidenceMemo.writes, [
    fixture.handles.refs.market.evaluation.slotId,
    fixture.handles.refs.outcomes.equilibrium.slotId,
    fixture.handles.refs.outcomes.incidence.slotId
  ]);
  assert.equal(incidenceMemo.writes.includes(
    fixture.handles.refs.market.buyerFacingSupply.slotId
  ), false);
  assert.equal(incidenceMemo.writes.includes(
    fixture.handles.refs.outcomes.governmentRevenue.slotId
  ), false);

  const revenueMemo = createTracingMemo();
  evaluateKpSemanticDerivedValueWithMemo({
    graph: fixture.graph,
    source,
    target: fixture.handles.refs.outcomes.governmentRevenue,
    memo: revenueMemo.memo
  });
  assert.deepEqual(revenueMemo.writes, [
    fixture.handles.refs.market.evaluation.slotId,
    fixture.handles.refs.outcomes.governmentRevenue.slotId
  ]);
});

test("unchanged source authority stays persistent while tax tokens vary", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createEvaluator(fixture, 0);
  const quarter = evaluator.at(createKpSemanticProgress(1n, 4n)).source;
  const threeQuarters = evaluator.at(createKpSemanticProgress(3n, 4n)).source;
  const modelDependency = dependency(fixture, "source.model");
  const taxDependency = dependency(fixture, "market.taxAmount");
  const quarterModel = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: quarter,
    dependency: modelDependency
  });
  const laterModel = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: threeQuarters,
    dependency: modelDependency
  });
  const quarterTax = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: quarter,
    dependency: taxDependency
  });
  const laterTax = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: threeQuarters,
    dependency: taxDependency
  });

  assert.equal(quarterModel.kind, "resolved-semantic-concrete-dependency");
  assert.deepEqual(laterModel, quarterModel);
  assert.equal(quarterTax.kind, "resolved-semantic-transient-dependency");
  assert.equal(laterTax.kind, "resolved-semantic-transient-dependency");
  if (quarterTax.kind !== "resolved-semantic-transient-dependency" ||
      laterTax.kind !== "resolved-semantic-transient-dependency") {
    throw new Error("Expected transient tax dependencies.");
  }
  assert.notEqual(quarterTax.token.progress, laterTax.token.progress);
  assert.equal(quarterTax.token.beforeVersionId, laterTax.token.beforeVersionId);
  assert.equal(quarterTax.token.afterVersionId, laterTax.token.afterVersionId);
});

test("supply-tax samples obey bounded eviction, reset, and disposal", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createEvaluator(fixture, 2);
  const quarter = evaluator.at(createKpSemanticProgress(1n, 4n));
  const half = evaluator.at(createKpSemanticProgress(1n, 2n));

  assert.equal(evaluator.at(createKpSemanticProgress(2n, 8n)), quarter);
  evaluator.at(createKpSemanticProgress(3n, 4n));
  assert.notEqual(evaluator.at(createKpSemanticProgress(2n, 4n)), half);
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 2,
    hits: 1,
    misses: 4
  });

  evaluator.reset();
  assert.equal(evaluator.inspect().entries, 0);
  assert.equal(evaluator.inspect().hits, 0);
  assert.equal(evaluator.inspect().misses, 0);
  evaluator.dispose();
  evaluator.dispose();
  assert.equal(evaluator.inspect().status, "disposed");
  assert.throws(
    () => evaluator.at(createKpSemanticProgress(1n, 2n)),
    error => error instanceof KpSemanticStateFamilyEvaluatorError &&
      error.code === "family-evaluator-disposed"
  );
});

function createEvaluator(
  fixture: ReturnType<typeof createKpSemanticStateSupplyTaxFamilyAuthoring>,
  sampleCacheCapacity: number
) {
  return createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application,
    sampleCacheCapacity
  });
}

function dependency(
  fixture: ReturnType<typeof createKpSemanticStateSupplyTaxFamilyAuthoring>,
  path: "source.model" | "market.taxAmount"
) {
  const found = fixture.graph.input.edges.find(({ dependency }) =>
    dependency.path?.join(".") === path
  )?.dependency;
  if (found === undefined) throw new Error(`Missing dependency ${path}.`);
  return found;
}

function createTracingMemo() {
  const values = new Map<KpSemanticSlotId, KpPersistentSemanticValue>();
  const writes: KpSemanticSlotId[] = [];
  const memo: KpSemanticDerivedEvaluationMemo = Object.freeze({
    read(slotId: KpSemanticSlotId) {
      return values.get(slotId);
    },
    write(slotId: KpSemanticSlotId, value: KpPersistentSemanticValue) {
      writes.push(slotId);
      values.set(slotId, value);
    }
  });
  return { memo, writes };
}
