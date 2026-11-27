import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sampleCircle, readAngle, readCircleUrl, toProgress, fromProgress, nextQuarter, formatReadout, CircleTrigGap } from '../src/experiments/circle-trig/model.ts';
import { renderCircleReference } from '../src/experiments/circle-trig/view.ts';
import { graphAttributes } from '../src/experiments/circle-trig/graph.ts';

const close = (a: number, b: number, tolerance = 1e-12) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≠ ${b}`);
test('quarter turns retain exact coordinate and axis truth across negative and repeated turns', () => {
  const expected = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
  for (let angle = -360; angle <= 720; angle += 90) {
    const frame = sampleCircle(angle), pair = expected[((angle / 90) % 4 + 4) % 4]!;
    assert.deepEqual([frame.x, frame.y], pair); assert.match(frame.region, /axis/);
    assert.equal(Object.is(frame.x, -0), false); assert.equal(Object.is(frame.y, -0), false);
  }
});
test('one angle owns both coordinates, periodicity, quadrant signs and the unit-radius invariant', () => {
  for (let angle = -359.5; angle <= 360; angle += 7.125) {
    const a = sampleCircle(angle), b = sampleCircle(angle + 360), radians = angle * Math.PI / 180;
    close(a.x, Math.cos(radians)); close(a.y, Math.sin(radians)); close(a.x ** 2 + a.y ** 2, 1);
    close(a.x, b.x); close(a.y, b.y); assert.equal(a.entities, b.entities);
    assert.ok(a.wrapped >= 0 && a.wrapped < 360);
  }
  assert.match(sampleCircle(210).region, /III/); assert.match(sampleCircle(-30).region, /IV/);
  for (const delta of [-.000001, .000001]) {
    assert.notEqual(sampleCircle(90 + delta).x, 0);
    assert.equal(Math.sign(sampleCircle(90 + delta).x), -Math.sign(delta));
  }
  for (const angle of [-1e-14, 1e-14]) {
    const frame = sampleCircle(angle);
    assert.equal(Math.sign(frame.y), Math.sign(angle)); assert.notEqual(frame.y, 0);
    assert.match(frame.region, angle < 0 ? /IV/ : /I:/);
  }
});
test('admission rejects partial, exotic, unbounded and nonfinite sources while preserving explicit decimals', () => {
  for (const text of ['', '-', '1e', '0x10', 'Infinity', 'NaN', '721', '-361', '9'.repeat(25), '1/2', '10deg']) assert.throws(() => readAngle(text), CircleTrigGap);
  for (const text of ['-30', '.5', '+45.125', ' 360 ', '1e-14']) assert.equal(readAngle(text), Number(text));
  assert.equal(readCircleUrl(new URLSearchParams()), 45);
  assert.equal(readCircleUrl(new URLSearchParams({ angle: String(1e-14) })), 1e-14);
  assert.throws(() => readCircleUrl(new URLSearchParams('angle=1e300')), CircleTrigGap);
  assert.throws(() => readCircleUrl(new URLSearchParams('angle=no')), CircleTrigGap);
  for (const angle of [NaN, Infinity, -361, 721]) assert.throws(() => sampleCircle(angle), CircleTrigGap);
});
test('pure seek and reverse reconstruct the same graph attributes without traversing prior frames', () => {
  for (const angle of [-360, -45, 0, 45, 90, 210, 360, 570, 720]) {
    close(fromProgress(toProgress(angle)), angle);
    const forward = graphAttributes(sampleCircle(angle));
    sampleCircle(720); sampleCircle(-360);
    assert.deepEqual(graphAttributes(sampleCircle(angle)), forward);
    for (const attributes of Object.values(forward)) for (const value of Object.values(attributes)) assert.ok(Number.isFinite(Number(value)));
  }
  assert.equal(nextQuarter(-45, 1), 0); assert.equal(nextQuarter(-45, -1), -90);
  assert.equal(nextQuarter(90, 1), 180); assert.equal(nextQuarter(90, -1), 0);
  assert.equal(nextQuarter(720, 1), 720); assert.equal(nextQuarter(-360, -1), -360);
  for (const p of [-1, 2, NaN]) assert.throws(() => fromProgress(p), CircleTrigGap);
});
test('numeric presentation reserves precision, normalizes rounded zero and never admits invalid geometry', () => {
  assert.equal(formatReadout('x', -.00001), '0.000'); assert.equal(formatReadout('y', -1), '-1.000');
  assert.equal(formatReadout('angle', 99.99), '100.0'); assert.equal(formatReadout('angle', -360), '-360.0');
  assert.equal(formatReadout('wrapped', 359.99), '360.0');
  assert.throws(() => formatReadout('x', 1.00001), CircleTrigGap); assert.throws(() => formatReadout('angle', NaN), CircleTrigGap);
});
test('committed static reference uses the same source and contains native math and complete diagrams', () => {
  const html = renderCircleReference();
  assert.equal(readFileSync(new URL('../experiments/circle-trig/index.html', import.meta.url), 'utf8'), html);
  assert.equal((html.match(/<svg /g) ?? []).length, 2); assert.equal((html.match(/<math /g) ?? []).length, 3);
  assert.match(html, /At 210°/); assert.match(html, /570°/); assert.match(html, /<noscript>/);
  assert.match(html, /data-entity="circle-trig.cosine"/); assert.match(html, /data-entity="circle-trig.sine"/);
});
