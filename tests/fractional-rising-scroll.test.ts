import assert from "node:assert/strict";
import test from "node:test";
import { createFractionalRisingScroll, fractionalCaptionFrame } from "../src/reader/app/fractional-rising-scroll.ts";
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

test("the faint preview precedes the exchange, while mathematical progress holds", () => {
  const narrative = { stops: [0, 500, 1000].map((progressPermille, i) => ({ positionPx: 500 + i * 600, progressPermille })) };
  const geometry = createFractionalRisingScroll(narrative, 800);
  const positions = narrative.stops.map((stop) => stop.positionPx);
  const exchangeStart = positions[2]! - 800 * .18;
  for (const position of [1100, 1400, exchangeStart, 1600, 1699, 1700, 1699, 1600, exchangeStart]) {
    const frame = fractionalCaptionFrame(positions, position, 800)!;
    if (position >= exchangeStart && position < 1700) {
      assert.equal(frame.preview, 1);
      assert.equal(frame.nextIndex, 2);
      assert.equal(sampleKpReaderScrollProgress(position, geometry), .5);
    }
    assert.ok(frame.exchange >= 0 && frame.exchange <= 1);
  }
  assert.equal(fractionalCaptionFrame(positions, 1700, 800)!.exchange, 0);
  assert.equal(fractionalCaptionFrame(positions, 2100, 800)!.nextIndex, undefined);
  const hint = fractionalCaptionFrame(positions, exchangeStart - 32, 800)!;
  assert.equal(hint.preview, .5);
  assert.equal(hint.exchange, 0);
  assert.equal(sampleKpReaderScrollProgress(exchangeStart - 32, geometry), .5);
  assert.equal(fractionalCaptionFrame(positions, 2100, 800)!.preview, 0);
  assert.equal(fractionalCaptionFrame([], 0, 800), undefined);
});
