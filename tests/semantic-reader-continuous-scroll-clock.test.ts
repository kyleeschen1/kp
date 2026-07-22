import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderContinuousScrollClock,
  sampleKpReaderScrollProgress
} from "../src/reader/runtime/public-api.ts";

const geometry = { startPx: 100, endPx: 1_100 } as const;
const checkpoints = [
  { id: "read", progressPermille: 0 },
  { id: "subtract", progressPermille: 333 },
  { id: "cancel", progressPermille: 667 },
  { id: "solve", progressPermille: 1_000 }
] as const;

test("premeasured scroll geometry maps every position to continuous progress", () => {
  assert.equal(sampleKpReaderScrollProgress(0, geometry), 0);
  assert.equal(sampleKpReaderScrollProgress(100, geometry), 0);
  assert.equal(sampleKpReaderScrollProgress(600, geometry), 0.5);
  assert.equal(sampleKpReaderScrollProgress(1_100, geometry), 1);
  assert.equal(sampleKpReaderScrollProgress(2_000, geometry), 1);

  const samples = Array.from({ length: 101 }, (_, index) =>
    sampleKpReaderScrollProgress(100 + index * 10, geometry)
  );
  assert.ok(samples.every((sample, index) => index === 0
    || Math.abs(sample - samples[index - 1]!) <= 0.010_001));
});

test("clock follows forward and reverse scroll exactly with active checkpoints", () => {
  const clock = createKpReaderContinuousScrollClock({
    id: "clock.story.solve-x",
    geometry,
    checkpoints
  });
  const forward = clock.samplePosition(600);
  const reverse = clock.samplePosition(350);
  assert.equal(forward.progress, 0.5);
  assert.equal(forward.direction, "forward");
  assert.equal(forward.checkpointId, "subtract");
  assert.equal(reverse.progress, 0.25);
  assert.equal(reverse.direction, "rewind");
  assert.equal(reverse.checkpointId, "read");
  assert.equal(reverse.sequence, forward.sequence + 1);
});

test("geometry refresh is explicit and ordinary samples need only a number", () => {
  const clock = createKpReaderContinuousScrollClock({
    id: "clock.story.solve-x",
    geometry
  });
  assert.equal(clock.samplePosition(600).progress, 0.5);
  clock.updateGeometry({ startPx: 200, endPx: 2_200 });
  assert.equal(clock.samplePosition(1_200).progress, 0.5);
  assert.throws(() => clock.updateGeometry({ startPx: 10, endPx: 10 }), /end must follow start/);
  clock.dispose();
  assert.throws(() => clock.samplePosition(1_200), /is disposed/);
});

test("subscribers observe one immutable sample per supplied position", () => {
  const clock = createKpReaderContinuousScrollClock({
    id: "clock.story.solve-x",
    geometry
  });
  const seen: number[] = [];
  const unsubscribe = clock.subscribe((sample) => seen.push(sample.progress));
  clock.samplePosition(200);
  clock.samplePosition(300);
  unsubscribe();
  clock.samplePosition(400);
  assert.deepEqual(seen, [0.1, 0.2]);
});

test("piecewise beat stops interpolate continuously across unequal narrative spans", () => {
  const piecewise = {
    stops: [
      { positionPx: 100, progressPermille: 0 },
      { positionPx: 300, progressPermille: 430 },
      { positionPx: 900, progressPermille: 780 },
      { positionPx: 1_100, progressPermille: 1_000 }
    ]
  } as const;

  assert.equal(sampleKpReaderScrollProgress(0, piecewise), 0);
  assert.equal(sampleKpReaderScrollProgress(200, piecewise), 0.215);
  assert.equal(sampleKpReaderScrollProgress(600, piecewise), 0.605);
  assert.equal(sampleKpReaderScrollProgress(1_200, piecewise), 1);

  const clock = createKpReaderContinuousScrollClock({
    id: "clock.story.piecewise",
    geometry: piecewise,
    checkpoints
  });
  assert.equal(clock.samplePosition(600).direction, "forward");
  assert.equal(clock.samplePosition(200).direction, "rewind");
  assert.throws(() => clock.updateGeometry({
    stops: [
      { positionPx: 100, progressPermille: 100 },
      { positionPx: 200, progressPermille: 1_000 }
    ]
  }), /must span progress 0 through 1000/);
});
