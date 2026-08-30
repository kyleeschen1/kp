import assert from "node:assert/strict";
import test from "node:test";

import { createKpEconomicsSupplyTaxAnimationAsset } from
  "../src/animation/economics-supply-tax-asset.ts";
import { createKpSupplyTaxPedagogicalScore } from
  "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import {
  projectKpSupplyTaxScene,
  projectKpSupplyTaxSceneTransition,
  kpSupplyTaxBeatHash,
  readKpSupplyTaxBeatFromHash,
  resolveKpSupplyTaxNavigationDisposition,
  resolveKpSupplyTaxNavigationMotion
} from
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

test("adjacent scene paint reveals, blooms, and settles receiving focus", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const beats = createKpSupplyTaxPedagogicalScore(authority).beats;
  const from = projectKpSupplyTaxScene({ authority, beat: beats[5]! });
  const to = projectKpSupplyTaxScene({ authority, beat: beats[6]! });
  const revenueId = authority.semantics.entities.regions.find(({ role }) =>
    role === "government-revenue")!.id;
  const historicalConsumerId = authority.semantics.entities.regions.find(
    ({ phase, role }) => phase === "untaxed" && role === "consumer-surplus"
  )!.id;
  const source = projectKpSupplyTaxSceneTransition({ from, to, progress: 0 });
  const middle = projectKpSupplyTaxSceneTransition({ from, to, progress: 0.5 });
  const target = projectKpSupplyTaxSceneTransition({ from, to, progress: 1 });
  const revenue = (projection: typeof source) =>
    projection.entities.find(({ entityId }) => entityId === revenueId)!;
  const historicalConsumer = (projection: typeof source) =>
    projection.entities.find(({ entityId }) =>
      entityId === historicalConsumerId)!;

  assert.equal(revenue(source).presence, 0);
  assert.equal(revenue(source).focus, 0);
  assert.equal(revenue(source).bloom, 0);
  assert.equal(revenue(middle).presence, 0.875);
  assert.equal(revenue(middle).focus, 0.5);
  assert.ok(revenue(middle).bloom > 0.7);
  assert.equal(revenue(target).presence, 1);
  assert.equal(revenue(target).focus, 1);
  assert.equal(revenue(target).bloom, 0);
  assert.equal(historicalConsumer(source).historical, 1);
  assert.equal(historicalConsumer(middle).historical, 1);
  assert.equal(historicalConsumer(target).historical, 1);
  assert.equal(historicalConsumer(middle).bloom, 0);

  const lossTransition = projectKpSupplyTaxSceneTransition({
    from: projectKpSupplyTaxScene({ authority, beat: beats[6]! }),
    to: projectKpSupplyTaxScene({ authority, beat: beats[7]! }),
    progress: 0.5
  });
  const untaxedMarket = lossTransition.entities.find(({ entityId }) =>
    entityId === authority.semantics.model.states.untaxed.id)!;
  assert.equal(untaxedMarket.historical, 0.5);
});

test("only the adjacent tax-imposition edge owns forward or reverse motion", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const beats = createKpSupplyTaxPedagogicalScore(authority).beats;
  for (let index = 0; index < beats.length - 1; index += 1) {
    const forward = resolveKpSupplyTaxNavigationMotion({
      from: beats[index]!,
      to: beats[index + 1]!
    });
    const rewind = resolveKpSupplyTaxNavigationMotion({
      from: beats[index + 1]!,
      to: beats[index]!
    });
    assert.equal(forward, index === 1 ? "forward" : "settle");
    assert.equal(rewind, index === 1 ? "rewind" : "settle");
  }
  assert.equal(resolveKpSupplyTaxNavigationMotion({
    from: beats[0]!,
    to: beats[7]!
  }), "settle");
});

test("navigation compresses distant, reduced-motion, and interrupted requests", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const beats = createKpSupplyTaxPedagogicalScore(authority).beats;
  const disposition = (from: number, to: number, options: {
    interrupted?: boolean;
    reducedMotion?: boolean;
    allowMotion?: boolean;
  } = {}) => resolveKpSupplyTaxNavigationDisposition({
    from: beats[from]!,
    to: beats[to]!,
    interrupted: options.interrupted ?? false,
    reducedMotion: options.reducedMotion ?? false,
    ...(options.allowMotion === undefined ? {} : {
      allowMotion: options.allowMotion
    })
  });

  assert.equal(disposition(1, 2), "animate-forward");
  assert.equal(disposition(2, 1), "animate-rewind");
  assert.equal(disposition(1, 2, { interrupted: true }), "direct-settle");
  assert.equal(disposition(1, 2, { reducedMotion: true }), "direct-settle");
  assert.equal(disposition(1, 2, { allowMotion: false }), "direct-settle");
  assert.equal(disposition(0, 7), "direct-settle");
  assert.equal(disposition(4, 5), "animate-attention");
  assert.equal(disposition(5, 4), "animate-attention");
});

test("semantic hashes restore canonical beats without replaying history", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const beats = createKpSupplyTaxPedagogicalScore(authority).beats;

  assert.equal(kpSupplyTaxBeatHash(beats[7]!), "#beat.deadweight-loss");
  assert.equal(readKpSupplyTaxBeatFromHash(
    beats,
    "#beat.government-revenue"
  ).ordinal, 7);
  assert.equal(readKpSupplyTaxBeatFromHash(beats, "#unknown").ordinal, 1);
});
