import assert from "node:assert/strict";
import test from "node:test";
import { createFractionalRisingScroll } from "../src/reader/app/fractional-rising-scroll.ts";
import { sampleKpReaderScrollProgress, sampleKpReaderScrollPosition } from "../src/reader/runtime/continuous-scroll-clock.ts";

test("each operation waits for its own passage to arrive and clear", () => {
  const narrative = { stops: [0, 167, 333, 500, 667, 833, 1000].map((progressPermille, i) => ({ positionPx: 500 + i * 600, progressPermille })) };
  const geometry = createFractionalRisingScroll(narrative, 800);
  const sample = (position: number) => sampleKpReaderScrollProgress(position, geometry) * 1000;
  for (let i = 1; i < narrative.stops.length; i += 1) {
    const arrival = narrative.stops[i]!.positionPx;
    const previous = narrative.stops[i - 1]!.progressPermille;
    const next = narrative.stops[i]!.progressPermille;
    assert.equal(sample(arrival - 100), previous);
    assert.equal(sample(arrival), previous);
    assert.equal(sample(arrival + 40), previous);
    assert.equal(sample(arrival + 40 + 128), (previous + next) / 2);
    assert.equal(sample(arrival + 40 + 256 + 60), next);
  }
  for (const progress of [0, .1, .5, .583, .95, 1]) {
    assert.ok(Math.abs(sampleKpReaderScrollProgress(sampleKpReaderScrollPosition(progress, geometry), geometry) - progress) < 1e-9);
  }
});

test("invalid measurement cannot create an inverted animation interval", () => {
  const stops = [{ positionPx: 0, progressPermille: 0 }, { positionPx: 10, progressPermille: 500 }, { positionPx: 20, progressPermille: 1000 }];
  assert.throws(() => createFractionalRisingScroll({ stops }, 800), /room to clear/);
  assert.throws(() => createFractionalRisingScroll({ stops }, NaN), /positive available height/);
});
