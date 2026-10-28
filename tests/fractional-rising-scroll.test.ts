import assert from 'node:assert/strict';
import test from 'node:test';
import { createFractionalRisingScroll, fractionalPassageCadence, fractionalPassageIndex } from '../src/reader/app/fractional-rising-scroll.ts';
import { sampleKpReaderScrollProgress, sampleKpReaderScrollPosition } from '../src/reader/runtime/continuous-scroll-clock.ts';

test('measured unequal passages hold their equation through arrival, reading, inspection and release', () => {
  for (const height of [400, 800, 1100]) {
    const cadence = fractionalPassageCadence(height);
    let positionPx = 300;
    const stops = [0, 167, 333, 500, 667, 833, 1000].map((progressPermille, index) => {
      positionPx += cadence.hold + 200 + index * 50;
      return { positionPx, progressPermille };
    });
    const geometry = createFractionalRisingScroll({ stops }, height);
    const sample = (position: number) => sampleKpReaderScrollProgress(position, geometry) * 1000;
    for (let i = 1; i < stops.length; i++) {
      const arrival = stops[i]!.positionPx;
      const previous = stops[i - 1]!.progressPermille;
      const result = stops[i]!.progressPermille;
      assert.equal(sample(arrival - 1), previous);
      assert.equal(sample(arrival + cadence.read), previous);
      assert.ok(Math.abs(sample(arrival + cadence.read + cadence.act / 2) - (previous + result) / 2) < 1e-8);
      assert.equal(sample(arrival + cadence.hold), result);
      assert.equal(fractionalPassageIndex(stops.map((stop) => stop.positionPx), arrival), i);
    }
    for (const progress of [0, .1, .5, .583, .95, 1, .95, .5, 0]) {
      assert.ok(Math.abs(sampleKpReaderScrollProgress(sampleKpReaderScrollPosition(progress, geometry), geometry) - progress) < 1e-9);
    }
  }
});

test('invalid geometry cannot truncate an operation to fit overlapping paragraphs', () => {
  const stops = [{ positionPx: 0, progressPermille: 0 }, { positionPx: 10, progressPermille: 500 }, { positionPx: 20, progressPermille: 1000 }];
  assert.throws(() => createFractionalRisingScroll({ stops }, 800), /room to read/);
  assert.throws(() => createFractionalRisingScroll({ stops }, NaN), /positive available height/);
});

test('a comment between operations holds its existing result without an artificial animation interval', () => {
  const geometry = createFractionalRisingScroll({ stops: [
    { positionPx: 0, progressPermille: 0 },
    { positionPx: 600, progressPermille: 500 },
    { positionPx: 1200, progressPermille: 500 },
    { positionPx: 1800, progressPermille: 1000 }
  ] }, 800);
  for (const position of [1200, 1300, 1500, 1800]) {
    assert.equal(sampleKpReaderScrollProgress(position, geometry), .5);
  }
  assert.equal(geometry.stops.filter((stop) => stop.positionPx >= 1200 && stop.positionPx < 1800).length, 1);
});
