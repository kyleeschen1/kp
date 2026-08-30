import assert from "node:assert/strict";
import test from "node:test";

import { createKpEconomicsSupplyTaxAnimationAsset } from
  "../src/animation/economics-supply-tax-asset.ts";
import { createKpSupplyTaxPedagogicalScore } from
  "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import { projectKpSupplyTaxScene } from
  "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";

test("every score beat resolves one deterministic semantic scene", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const score = createKpSupplyTaxPedagogicalScore(authority);
  for (const beat of score.beats) {
    const first = projectKpSupplyTaxScene({ authority, beat });
    const second = projectKpSupplyTaxScene({ authority, beat });
    assert.deepEqual(second, first);
    assert.equal(first.entities.length, authority.animation.bundle.objects.length);
    assert.equal(new Set(first.entities.map(({ entityId }) => entityId)).size,
      first.entities.length);
  }
});

test("score attention roles resolve to focus, context, and historical trace", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const beat = createKpSupplyTaxPedagogicalScore(authority).beats[5]!;
  const scene = projectKpSupplyTaxScene({ authority, beat });
  const byId = new Map(scene.entities.map((entity) =>
    [entity.entityId, entity] as const));

  for (const id of beat.attention.targetEntityIds) {
    assert.equal(byId.get(id)?.salience.level, "focus");
    assert.equal(byId.get(id)?.traceRole, "current");
  }
  for (const id of beat.attention.contextEntityIds) {
    assert.equal(byId.get(id)?.salience.level, "context");
    assert.equal(byId.get(id)?.traceRole, "current");
  }
  for (const id of beat.attention.historicalTraceEntityIds) {
    assert.equal(byId.get(id)?.salience.level, "ghost");
    assert.equal(byId.get(id)?.traceRole, "historical");
  }
});

test("presence introduces tax and welfare objects only at authored beats", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const score = createKpSupplyTaxPedagogicalScore(authority);
  const taxId = authority.semantics.model.input.tax.id;
  const revenueId = authority.semantics.entities.regions.find(({ role }) =>
    role === "government-revenue")!.id;
  const lossId = authority.semantics.entities.regions.find(({ role }) =>
    role === "deadweight-loss")!.id;
  const presence = (beatIndex: number, id: string) =>
    projectKpSupplyTaxScene({ authority, beat: score.beats[beatIndex]! })
      .entities.find(({ entityId }) => entityId === id)!.salience.presence;

  assert.equal(presence(0, taxId), 0);
  assert.equal(presence(1, taxId), 1);
  assert.equal(presence(5, revenueId), 0);
  assert.equal(presence(6, revenueId), 1);
  assert.equal(presence(6, lossId), 0);
  assert.equal(presence(7, lossId), 1);
});
