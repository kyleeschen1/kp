import assert from "node:assert/strict";
import test from "node:test";
import { createKpReaderTimelinePlaybackClock } from "../src/reader/runtime/timeline-playback-clock.ts";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { createKpReasoningNavigator } from "../src/experiments/reusable-reasoning/navigation.ts";
import type { KpReasoningScrub } from "../src/experiments/reusable-reasoning/navigation.ts";

if (false) {
  // @ts-expect-error Only the navigator can issue scrub authority.
  const forged: KpReasoningScrub = { update() {}, finish() {}, cancel() {} };
  void forged;
}

test("gesture release settles through the existing clock without owning a second scheduler", () => {
  const { navigation, clock, advance, pending } = fixture();
  for (const [from, to] of [[.2, 0], [.7, 1], [1.49, 1], [1.51, 2], [3.8, 4]]) {
    const drag = navigation.beginScrub();
    drag.update(from!);
    assert.equal(clock.getSnapshot().progress, from! / 13);
    assert.equal(pending.size, 0);
    drag.finish(); advance(100_000);
    assert.equal(clock.getSnapshot().progress, to! / 13);
    assert.equal(pending.size, 0);
    drag.update(.3); drag.finish();
    assert.equal(clock.getSnapshot().progress, to! / 13, "completed gesture cannot mutate the clock");
  }
  clock.dispose();
});

test("stale gesture releases cannot snap restored, superseded or disposed positions", () => {
  const { navigation, clock } = fixture();
  const stale = navigation.beginScrub(); stale.update(.37);
  navigation.open(); navigation.returnToParent();
  stale.finish(false);
  assert.equal(clock.getSnapshot().progress, .37 / 13);
  const old = navigation.beginScrub(); old.update(.8);
  const current = navigation.beginScrub(); current.update(1.7);
  old.finish(false);
  assert.equal(clock.getSnapshot().progress, 1.7 / 13);
  current.finish(false);
  assert.equal(clock.getSnapshot().progress, 2 / 13);
  const cancelled = navigation.beginScrub(); cancelled.update(.42); cancelled.cancel(); cancelled.finish(false);
  assert.equal(clock.getSnapshot().progress, .42 / 13);
  const disposed = navigation.beginScrub(); disposed.update(.23); navigation.dispose(); disposed.finish(false);
  assert.equal(clock.getSnapshot().progress, .23 / 13);
  clock.dispose();
});

function fixture(source = createKpReasoningSource()) {
  let now = 0, next = 0;
  const pending = new Map<number, (now: number) => void>();
  const clock = createKpReaderTimelinePlaybackClock({ id: "test.reasoning", durationMs: 13000,
    scheduler: { now: () => now, request: callback => { pending.set(++next, callback); return next; },
      cancel: id => { pending.delete(id); } } });
  const evidence = bindKpReasoningEvidence(source);
  const navigation = createKpReasoningNavigator(evidence, clock);
  return { clock, evidence, navigation, pending,
    advance(ms: number) { now += ms; const work = [...pending.values()]; pending.clear(); work.forEach(callback => callback(now)); } };
}

test("passage gestures distinguish intent, pauses, reversal and bounded destinations", () => {
  const { navigation, clock, advance } = fixture();
  for (const [amount, release, target] of [[.1, 20, 1], [.1, 300, 0], [.3, 300, 1], [.02, 20, 0], [8, 300, 1]]) {
    navigation.seekStep(0);
    const gesture = navigation.beginPassageGesture(0);
    gesture.update(amount!, 20);
    assert.ok(navigation.getStepPosition() <= 1, "one gesture cannot scrub through later operations");
    gesture.finish(release!); advance(1000);
    assert.equal(navigation.getStepPosition(), target);
  }
  navigation.seekStep(2);
  const reverse = navigation.beginPassageGesture(0);
  reverse.update(2.6, 100); reverse.update(2.2, 160); reverse.finish(160); advance(1000);
  assert.equal(navigation.getStepPosition(), 2, "reversing an exploratory drag can cancel the advance");
  navigation.seekStep(.4);
  const tap = navigation.beginPassageGesture(0); tap.finish(20); advance(1000);
  assert.equal(navigation.getStepPosition(), 0, "catch and release without dragging settles to the nearest beat");
  for (const [start, outside] of [[0, -100], [4, 100]]) {
    navigation.seekStep(start!);
    const edge = navigation.beginPassageGesture(0); edge.update(outside!, 20); edge.finish(20); advance(1000);
    assert.equal(navigation.getStepPosition(), start);
  }
  navigation.seekStep(2);
  const stale = navigation.beginPassageGesture(0); stale.update(2.37, 20);
  navigation.open(); navigation.returnToParent(); stale.finish(30);
  assert.equal(clock.getSnapshot().progress, 2.37 / 13);
  clock.dispose();
});

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

test("step controls traverse every verified checkpoint for every supported procedure length", () => {
  const source = createKpReasoningSource();
  const targets = ["distributed", "normalized", "constant-product", "constant-quotient"];
  for (let count = 1; count <= 4; count++) {
    const { clock, navigation, advance, pending } = fixture({ ...source,
      parent: { ...source.parent, targetStateId: `fraction-solve.state.${targets[count - 1]}` },
      reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, count) } });
    assert.equal(navigation.stepCount, count);
    for (const view of ["parent", "reason"]) {
      if (view === "reason") navigation.open();
      navigation.seekStep(0);
      for (let index = 1; index <= count; index++) {
        navigation.step("forward"); advance(100_000);
        assert.equal(clock.getSnapshot().progress, index / 13);
        assert.equal(pending.size, 0, "must stop, not merely pass through the checkpoint");
      }
      for (let index = count - 1; index >= 0; index--) {
        navigation.step("rewind"); advance(100_000);
        assert.equal(clock.getSnapshot().progress, index / 13);
      }
      navigation.seekStep(.7);
      navigation.step("forward", false);
      assert.equal(clock.getSnapshot().progress, 1 / 13);
      navigation.seekStep(.7);
      navigation.step("rewind", false);
      assert.equal(clock.getSnapshot().progress, 0);
      assert.throws(() => navigation.seekStep(count + 1), KpReasoningRepairGap);
      assert.throws(() => navigation.seekStep(NaN), KpReasoningRepairGap);
    }
    clock.dispose();
  }
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
