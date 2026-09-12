import test from "node:test";
import assert from "node:assert/strict";
import { createKpFocusDeckTravelPlayback } from "../src/tutorial/focus-deck-checkpoint-playback.ts";

test("travel is a revocable capability, not permission granted by arbitrary scroll writes", () => {
  let position = 0;
  const settled: number[] = [];
  const travel = createKpFocusDeckTravelPlayback({ last: 4, position: () => position,
    pause() {}, update: value => { position = value; }, settle: value => { settled.push(value); position = value; } });
  const first = travel.begin(0);
  first.update(.3, 20);
  const second = travel.begin(30);
  first.update(3, 40); first.finish(50);
  assert.equal(position, .3); assert.deepEqual(settled, []);
  second.update(1.4, 60); second.finish(200);
  assert.deepEqual(settled, [1]);
  second.finish(210); assert.deepEqual(settled, [1]);
  const third = travel.begin(220); travel.dispose(); travel.dispose();
  third.update(4, 230); third.finish(240);
  assert.equal(position, 1);
  assert.throws(() => travel.begin(250), /disposed/);
});

test("release uses recent velocity and rejects invalid temporal samples", () => {
  let position = 0;
  const travel = createKpFocusDeckTravelPlayback({ last: 4, position: () => position,
    pause() {}, update: value => { position = value; }, settle: value => { position = value; } });
  let session = travel.begin(0);
  assert.throws(() => session.update(NaN, 10), /finite/);
  session.update(.1, 10);
  assert.throws(() => session.update(.2, 9), /monotonic/);
  assert.throws(() => session.finish(9), /monotonic/);
  session.finish(20); assert.equal(position, 1);
  position = 0; session = travel.begin(30); session.update(.1, 40);
  session.finish(200); assert.equal(position, 0);
});

test("edge-local callers retain their declared settlement profile without another clock", () => {
  let position = 0;
  const samples: number[] = [];
  const travel = createKpFocusDeckTravelPlayback({ last: 4, position: () => position,
    pause() {}, update: value => { position = value; },
    resolveTarget: sample => { samples.push(sample.peakDisplacement); return sample.peakDisplacement >= .08 ? 1 : 0; },
    settle: value => { position = value; } });
  const session = travel.begin(0); session.update(.1, 20); session.update(.04, 200); session.finish(400, false);
  assert.deepEqual(samples, [.1]); assert.equal(position, 1);
});
