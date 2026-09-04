import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateKpSemanticDerivedValueWithMemo,
  type KpSemanticDerivedEvaluationMemo
} from "../src/semantic-state/derived-evaluator.ts";
import type { KpPersistentSemanticValue } from
  "../src/semantic-state/entity-version-store.ts";
import type { KpSemanticSlotId } from
  "../src/semantic-state/identity.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import { createKpSemanticStateSupplyTaxFamilyAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";
import { createKpSemanticStateCircleFamilyFixture } from
  "./fixtures/semantic-state-circle-family.ts";

const CACHE_CAPACITY = 16;
const progressGrid = Object.freeze(Array.from(
  { length: 257 },
  (_, numerator) => createKpSemanticProgress(BigInt(numerator), 256n)
));
const SUPPLY_SOURCE =
  "src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";
const CIRCLE_SOURCE = "tests/fixtures/semantic-state-circle-family.ts";

test("257 exact positions stay deterministic and bounded for both callers", () => {
  const firstSupply = probeSupplyTax();
  const secondSupply = probeSupplyTax();
  const firstCircle = probeCircle();
  const secondCircle = probeCircle();

  assert.deepEqual(secondSupply, firstSupply);
  assert.deepEqual(secondCircle, firstCircle);
  assert.deepEqual(firstSupply.cache, expectedCacheStats());
  assert.deepEqual(firstCircle.cache, expectedCacheStats());
  assert.deepEqual(firstSupply.statuses, expectedStatuses());
  assert.deepEqual(firstCircle.statuses, expectedStatuses());
  assert.deepEqual(firstSupply.computeCounts, {
    evaluation: 257,
    buyerFacingSupply: 0,
    equilibrium: 0,
    incidence: 0,
    governmentRevenue: 257
  });
  assert.deepEqual(firstCircle.computeCounts, {
    area: 0,
    response: 257
  });
  assert.deepEqual(firstSupply.values[0], exact("0"));
  assert.deepEqual(firstSupply.values[128], exact("8"));
  assert.deepEqual(firstSupply.values[256], exact("12"));
  assert.equal(firstCircle.values[0], 2 * Math.PI);
  assert.equal(firstCircle.values[128], 3 * Math.PI);
  assert.equal(firstCircle.values[256], 4 * Math.PI);
});

test("dense probes create no durable operation or history inventory", () => {
  const supply = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const circle = createKpSemanticStateCircleFamilyFixture();
  const before = durableInventory(supply, circle);
  const supplyEvaluator = createKpSemanticStateFamilyEvaluator({
    definition: supply.family,
    application: supply.application,
    sampleCacheCapacity: CACHE_CAPACITY
  });
  const circleEvaluator = createKpSemanticStateFamilyEvaluator({
    definition: circle.family,
    application: circle.application,
    sampleCacheCapacity: CACHE_CAPACITY
  });

  for (const progress of progressGrid) {
    supplyEvaluator.at(progress);
    circleEvaluator.at(progress);
  }

  assert.equal(durableInventory(supply, circle), before);
  assert.equal(supply.application.commit.journal.length, 1);
  assert.equal(circle.application.commit.journal.length, 1);
  assert.equal(supplyEvaluator.inspect().entries, CACHE_CAPACITY);
  assert.equal(circleEvaluator.inspect().entries, CACHE_CAPACITY);
  supplyEvaluator.dispose();
  circleEvaluator.dispose();
  assert.equal(supplyEvaluator.inspect().entries, 0);
  assert.equal(circleEvaluator.inspect().entries, 0);
  assert.equal(durableInventory(supply, circle), before);
});

test("both caller packets remain compact and use the same high-level seam", () => {
  const supplySource = readFileSync(SUPPLY_SOURCE, "utf8");
  const circleSource = readFileSync(CIRCLE_SOURCE, "utf8");
  const packets = [
    authorPacket(supplySource, "supply-tax-family-authoring"),
    authorPacket(circleSource, "circle-state-family-authoring")
  ];

  assert.deepEqual(packets.map(nonblankLineCount), [106, 70]);
  for (const packet of packets) {
    assert.equal(count(packet, /\.update\(/gu), 1);
    assert.equal(count(packet,
      /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
    ), 0);
    assert.equal(count(packet, /\bas\s+(?:Kp|Readonly|never)\b/gu), 0);
    assert.match(packet, /defineKpSemanticStateFamily/u);
    assert.match(packet, /declareKpSemanticStateInterpolation/u);
  }
});

function probeSupplyTax() {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application,
    sampleCacheCapacity: CACHE_CAPACITY
  });
  const counts = new Map<KpSemanticSlotId, number>();
  const values = progressGrid.map(progress => {
    const sample = evaluator.at(progress);
    assert.equal(evaluator.at(progress), sample);
    const evaluation = evaluateKpSemanticDerivedValueWithMemo({
      graph: fixture.graph,
      source: sample.source,
      target: fixture.handles.refs.outcomes.governmentRevenue,
      memo: createCountingMemo(counts)
    });
    return evaluation.amount;
  });

  return {
    cache: evaluator.inspect(),
    statuses: progressGrid.map(progress => evaluator.at(progress).sampleStatus),
    computeCounts: {
      evaluation: readCount(counts,
        fixture.handles.refs.market.evaluation.slotId),
      buyerFacingSupply: readCount(counts,
        fixture.handles.refs.market.buyerFacingSupply.slotId),
      equilibrium: readCount(counts,
        fixture.handles.refs.outcomes.equilibrium.slotId),
      incidence: readCount(counts,
        fixture.handles.refs.outcomes.incidence.slotId),
      governmentRevenue: readCount(counts,
        fixture.handles.refs.outcomes.governmentRevenue.slotId)
    },
    values
  };
}

function probeCircle() {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application,
    sampleCacheCapacity: CACHE_CAPACITY
  });
  const counts = new Map<KpSemanticSlotId, number>();
  const values = progressGrid.map(progress => {
    const sample = evaluator.at(progress);
    assert.equal(evaluator.at(progress), sample);
    return evaluateKpSemanticDerivedValueWithMemo({
      graph: fixture.graph,
      source: sample.source,
      target: fixture.handles.refs.measurement.response,
      memo: createCountingMemo(counts)
    }).magnitude;
  });

  return {
    cache: evaluator.inspect(),
    statuses: progressGrid.map(progress => evaluator.at(progress).sampleStatus),
    computeCounts: {
      area: readCount(counts, fixture.handles.refs.measurement.area.slotId),
      response: readCount(counts,
        fixture.handles.refs.measurement.response.slotId)
    },
    values
  };
}

function createCountingMemo(counts: Map<KpSemanticSlotId, number>) {
  const values = new Map<KpSemanticSlotId, KpPersistentSemanticValue>();
  return Object.freeze({
    read(slotId: KpSemanticSlotId) {
      return values.get(slotId);
    },
    write(slotId: KpSemanticSlotId, value: KpPersistentSemanticValue) {
      counts.set(slotId, readCount(counts, slotId) + 1);
      values.set(slotId, value);
    }
  }) satisfies KpSemanticDerivedEvaluationMemo;
}

function readCount(
  counts: ReadonlyMap<KpSemanticSlotId, number>,
  slotId: KpSemanticSlotId
) {
  return counts.get(slotId) ?? 0;
}

function expectedCacheStats() {
  return {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: CACHE_CAPACITY,
    entries: CACHE_CAPACITY,
    hits: 255,
    misses: 255
  };
}

function expectedStatuses() {
  return [
    "baseline",
    ...Array.from({ length: 255 }, () => "intermediate"),
    "target"
  ];
}

function durableInventory(
  supply: ReturnType<typeof createKpSemanticStateSupplyTaxFamilyAuthoring>,
  circle: ReturnType<typeof createKpSemanticStateCircleFamilyFixture>
) {
  return JSON.stringify({
    supply: {
      before: supply.application.commit.before,
      after: supply.application.commit.after,
      journal: supply.application.commit.journal,
      parameters: supply.application.parameters
    },
    circle: {
      before: circle.application.commit.before,
      after: circle.application.commit.after,
      journal: circle.application.commit.journal,
      parameters: circle.application.parameters
    }
  });
}

function authorPacket(source: string, marker: string) {
  const packet = new RegExp(
    `// ${marker}:start\\n([\\s\\S]*?)// ${marker}:end`,
    "u"
  ).exec(source)?.[1];
  assert.ok(packet);
  return packet;
}

function nonblankLineCount(source: string) {
  return source.split("\n").filter(line => line.trim()).length;
}

function count(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].length;
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}
