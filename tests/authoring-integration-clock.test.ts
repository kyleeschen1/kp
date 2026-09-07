import assert from "node:assert/strict";
import test from "node:test";
import { KpAuthoringMarketClockError, kpAuthoringMarketClockResolution, projectKpAuthoringMarketClockAddress, quantizeKpAuthoringMarketProgress } from "../src/tutorial/authoring-market/authoring-market-clock-address.ts";
import { createKpAuthoredMarketSource } from "../src/tutorial/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpSemanticStateQuerySession } from "../src/semantic-state/authoring-query-session.ts";
import { encodeKpSemanticStateCompositionLogicalAddress } from "../src/semantic-state/state-family-composition-address.ts";

test("reader quantization is bounded, monotone and exact at canonical endpoints", () => {
  let previous = -1;
  for (let index = 0; index <= 10007; index++) {
    const raw = index / 10007;
    const value = quantizeKpAuthoringMarketProgress(raw);
    const projected = Number(value.numerator) / Number(value.denominator);
    assert.ok(projected >= previous);
    assert.ok(Math.abs(projected - raw) <= 0.5 / kpAuthoringMarketClockResolution + Number.EPSILON);
    previous = projected;
  }
  assert.equal(quantizeKpAuthoringMarketProgress(0).numerator, 0n);
  assert.equal(quantizeKpAuthoringMarketProgress(1).denominator, 1n);
  assert.equal(quantizeKpAuthoringMarketProgress(0.00000049).numerator, 0n);
  assert.equal(quantizeKpAuthoringMarketProgress(0.0000005).numerator, 1n);
  assert.equal(quantizeKpAuthoringMarketProgress(0.99999951).numerator, 1n);
  for (const value of [NaN, Infinity, -Infinity, -0.001, 1.001]) {
    assert.throws(() => quantizeKpAuthoringMarketProgress(value), KpAuthoringMarketClockError);
  }
});

test("member endpoints resolve exact shared boundaries, never a replay", () => {
  const { packet } = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const at = (member: "demand" | "tax", progress: number) => projectKpAuthoringMarketClockAddress({ packet, member, progress });
  const demandEnd = at("demand", 1).address;
  const taxStart = at("tax", 0).address;
  assert.deepEqual(demandEnd, taxStart);
  assert.equal(taxStart.kind, "settled");
  assert.equal(at("tax", 0.5).address.kind, "in-transition");
  assert.equal(at("tax", 1).address.kind, "settled");
  assert.throws(() => projectKpAuthoringMarketClockAddress({ packet,
    // @ts-expect-error Arbitrary clock-to-operation routing is unsupported.
    member: "generic", progress: 0.5 }), KpAuthoringMarketClockError);
});

test("forward, reverse and direct clock seeks preserve query truth without history growth", () => {
  const { packet } = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const query = createKpSemanticStateQuerySession(packet.explanation, { cacheCapacity: 2 });
  const history = [...query.history.snapshots];
  const observed = new Map<string, unknown>();
  const samples = Array.from({ length: 65 }, (_, index) => index / 64);
  for (const progress of [...samples, ...[...samples].reverse(), 0.37, 1, 0, 0.37]) {
    const { address } = projectKpAuthoringMarketClockAddress({ packet, member: "tax", progress });
    const key = encodeKpSemanticStateCompositionLogicalAddress(address);
    const value = query.evaluate(address, packet.stateHandles.refs.outcomes.evaluation);
    if (observed.has(key)) assert.deepEqual(value, observed.get(key));
    else observed.set(key, value);
    assert.ok(query.inspect().entries <= 2);
  }
  assert.deepEqual(query.history.snapshots, history);
  assert.equal(history.length, 3);
  query.dispose();
});
