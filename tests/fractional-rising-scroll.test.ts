import assert from "node:assert/strict";
import test from "node:test";
import { createFractionalRisingScroll, fractionalCaptionIndex } from "../src/reader/app/fractional-rising-scroll.ts";
import { sampleKpReaderScrollProgress, sampleKpReaderScrollPosition } from "../src/reader/runtime/continuous-scroll-clock.ts";

test("each operation allows reading before moving, then holds its result", () => {
  const narrative = { stops: [0, 167, 333, 500, 667, 833, 1000].map((progressPermille, i) => ({ positionPx: 500 + i * 600, progressPermille })) };
  const geometry = createFractionalRisingScroll(narrative, 800);
  const sample = (position: number) => sampleKpReaderScrollProgress(position, geometry) * 1000;
  for (let i = 1; i < narrative.stops.length; i += 1) {
    const arrival = narrative.stops[i]!.positionPx;
    const previous = narrative.stops[i - 1]!.progressPermille;
    const next = narrative.stops[i]!.progressPermille;
    assert.equal(sample(arrival - 100), previous);
    assert.equal(sample(arrival), previous);
    assert.equal(sample(arrival + 112), previous);
    assert.equal(sample(arrival + 112 + 128), (previous + next) / 2);
    assert.equal(sample(arrival + 112 + 256 + 60), next);
  }
  for (const progress of [0, .1, .5, .583, .95, 1]) {
    assert.ok(Math.abs(sampleKpReaderScrollProgress(sampleKpReaderScrollPosition(progress, geometry), geometry) - progress) < 1e-9);
  }
});

test("invalid measurement cannot create an inverted animation interval", () => {
  const stops = [{ positionPx: 0, progressPermille: 0 }, { positionPx: 10, progressPermille: 500 }, { positionPx: 20, progressPermille: 1000 }];
  assert.throws(() => createFractionalRisingScroll({ stops }, 800), /room to read/);
  assert.throws(() => createFractionalRisingScroll({ stops }, NaN), /positive available height/);
});

test("captions stay present through motion and result hold; reverse is identical", () => {
  const positions = [0, 800, 1600];
  for (const position of [800, 912, 1040, 1168, 1247, 1248, 1600, 1248, 1247, 800]) {
    const expected = position === 1248 ? undefined : position === 1600 ? 2 : 1;
    assert.equal(fractionalCaptionIndex(positions, position, 800), expected);
  }
  assert.equal(fractionalCaptionIndex([], 0, 800), undefined);
});
