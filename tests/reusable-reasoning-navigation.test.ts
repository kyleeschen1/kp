import assert from "node:assert/strict";
import test from "node:test";
import { createKpReaderTimelinePlaybackClock } from "../src/reader/runtime/timeline-playback-clock.ts";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { createKpReasoningNavigator } from "../src/experiments/reusable-reasoning/navigation.ts";

function fixture() {
  let now = 0, next = 0;
  const pending = new Map<number, (now: number) => void>();
  const clock = createKpReaderTimelinePlaybackClock({ id: "test.reasoning", durationMs: 13000,
    scheduler: { now: () => now, request: callback => { pending.set(++next, callback); return next; },
      cancel: id => { pending.delete(id); } } });
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const navigation = createKpReasoningNavigator(evidence, clock);
  return { clock, evidence, navigation, pending,
    advance(ms: number) { now += ms; const work = [...pending.values()]; pending.clear(); work.forEach(callback => callback(now)); } };
}

test("open and return preserve exact interrupted progress through the real existing clock", () => {
  const { clock, navigation, advance, pending } = fixture();
  clock.play({ direction: "forward", stopAt: navigation.end });
  advance(1731);
  const before = clock.getSnapshot().progress;
  assert.ok(before > 0 && before < navigation.end);
  navigation.open();
  assert.equal(clock.getStatus(), "paused");
  assert.equal(pending.size, 0);
  assert.equal(navigation.getView(), "reason");
  clock.seek(2 / 13);
  navigation.open();
  assert.equal(navigation.capture().returnTo!.progress, before);
  navigation.returnToParent();
  assert.equal(clock.getSnapshot().progress, before);
  assert.equal(navigation.getView(), "parent");
  assert.equal(navigation.capture().returnTo, undefined);
  clock.dispose();
});

test("navigation direct restoration has no replay or private scheduled work", () => {
  const first = fixture();
  first.clock.seek(0.123456789);
  first.navigation.open();
  first.clock.seek(3 / 13);
  const transported = JSON.parse(JSON.stringify(first.navigation.capture()));
  const second = fixture();
  const frames: number[] = [];
  second.clock.subscribe(frame => frames.push(frame.progress));
  second.navigation.restore(transported);
  assert.equal(second.clock.getSnapshot().progress, 3 / 13);
  assert.equal(second.pending.size, 0);
  second.navigation.returnToParent();
  assert.equal(second.clock.getSnapshot().progress, 0.123456789);
  assert.ok(frames.every(value => [0, 3 / 13, 0.123456789].includes(value)));
  first.clock.dispose(); second.clock.dispose();
});

test("invalid restore is atomic and rejects stale revision and mismatched semantic anchor", () => {
  const { clock, navigation } = fixture();
  clock.seek(1 / 13);
  const original = navigation.capture();
  for (const bad of [
    { ...original, revisionId: "stale" },
    { ...original, position: { ...original.position, progress: 1 } },
    { ...original, position: { ...original.position, reference: { ...original.position.reference, id: "forged" } } },
    { ...original, view: "reason" },
    null
  ]) {
    assert.throws(() => navigation.restore(bad), KpReasoningRepairGap);
    assert.deepEqual(navigation.capture(), original);
  }
  clock.dispose();
});

test("navigation is reversible at every endpoint and cannot act after disposal", () => {
  const { clock, navigation } = fixture();
  for (const progress of [0, 1 / 13, 2 / 13, 3 / 13, 4 / 13]) {
    clock.seek(progress);
    navigation.open();
    navigation.returnToParent();
    assert.equal(clock.getSnapshot().progress, progress);
  }
  navigation.dispose();
  assert.throws(() => navigation.open(), KpReasoningRepairGap);
  assert.throws(() => navigation.restore({}), KpReasoningRepairGap);
  clock.dispose();
});
