import assert from 'node:assert/strict';
import test from 'node:test';
import { documentPassageOperation } from '../src/reader/app/document-passage-progress.ts';
import { createDocumentTheaterScroll, documentPassageIndex } from '../src/reader/app/document-theater-scroll.ts';
import { sampleKpReaderScrollProgress } from '../src/reader/runtime/continuous-scroll-clock.ts';

test('operation sliders retain passage ownership at repeated source/result holds and in reverse', () => {
  const stops = [0, 167, 333, 500, 667, 833, 1000].map((progressPermille, i) => ({ positionPx: 500 + i * 600, progressPermille }));
  const geometry = createDocumentTheaterScroll({ stops }, 800);
  for (let i = 1; i < stops.length; i++) {
    const operation = documentPassageOperation(stops[i - 1]!.progressPermille, stops[i]!.progressPermille);
    for (const fraction of [0, .25, .5, .999, 1, .5, 0, 1]) {
      const target = operation.seek(geometry, fraction);
      assert.ok(Math.abs(sampleKpReaderScrollProgress(target.position, geometry) * 1000 - target.progress) < 1e-8);
      assert.ok(Math.abs(operation.fraction(target.progress) - fraction) < 1e-8);
      assert.equal(documentPassageIndex(stops.map((stop) => stop.positionPx), target.position), i);
    }
    assert.equal(operation.fraction(0), 0);
    assert.equal(operation.fraction(1000), 1);
  }
});

test('invalid or missing operation intervals cannot silently seek another passage', () => {
  for (const [start, end] of [[500, 500], [667, 500], [-1, 500], [0, 1001], [NaN, 1000]]) {
    assert.throws(() => documentPassageOperation(start!, end!), /increasing checkpoints/);
  }
  const operation = documentPassageOperation(500, 667);
  assert.throws(() => operation.fraction(NaN), /finite/);
  assert.throws(() => operation.seek({ stops: [] }, .5), /missing/);
});
