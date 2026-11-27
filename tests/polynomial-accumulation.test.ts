import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { polynomials, getPolynomial, readBound, readAccumulationUrl, sampleAccumulation, exactIntegral, exactText, numeric, exactValue, formatReadout, AccumulationGap } from '../src/math/authoring/polynomial-accumulation.ts';
import { compileExpression, differentiate } from '../src/math/expression.ts';
import { addKpRationals, negateKpRational, equalKpRationals } from '../domains/math/exact-rational.ts';
import { graphModel, graphParts } from '../src/experiments/polynomial-accumulation/graph.ts';
import { renderAccumulationReference } from '../src/experiments/polynomial-accumulation/view.ts';
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
test('power-rule primitives differentiate back to all six functions and match exact evaluations', () => {
  for (const model of polynomials) {
    const derivative = compileExpression(differentiate(model.F, 'x'));
    for (let ticks = -300; ticks <= 300; ticks += 13) {
      close(derivative({ x: ticks / 100 }), model.evaluate({ x: ticks / 100 }));
      close(numeric(exactValue(model.primitive, ticks)), model.evaluatePrimitive({ x: ticks / 100 }));
    }
    for (const root of model.roots) assert.equal(exactValue(model.coefficients, root).numerator, 0n);
  }
});
test('oriented integrals preserve additivity, reversal and equal-bound zero exactly', () => {
  for (const model of polynomials) for (let a = -300; a <= 300; a += 31) for (let b = -300; b <= 300; b += 47) {
    const ab = exactIntegral(model, a, b), ba = exactIntegral(model, b, a);
    assert.ok(equalKpRationals(ab, negateKpRational(ba)));
    assert.ok(equalKpRationals(ab, addKpRationals(exactIntegral(model, a, 23), exactIntegral(model, 23, b))));
    assert.equal(exactIntegral(model, a, a).numerator, 0n);
  }
});
test('root partitions distinguish cancellation and geometric area, including tangent and zero cases', () => {
  const q = sampleAccumulation(getPolynomial('quadratic'), -200, 200, 1);
  assert.equal(exactText(q.signed), '4/3'); assert.equal(exactText(q.geometric), '4');
  assert.deepEqual(q.segments.map(s => [s.left, s.right, s.sign]), [[-200, -100, 'above'], [-100, 100, 'below'], [100, 200, 'above']]);
  const line = sampleAccumulation(getPolynomial('linear'), -200, 200, 1);
  assert.equal(exactText(line.signed), '0'); assert.equal(exactText(line.geometric), '4');
  assert.equal(exactText(sampleAccumulation(getPolynomial('negative'), 200, -200, 1).signed), '4');
  assert.equal(exactText(sampleAccumulation(getPolynomial('square'), -300, 300, 1).geometric), '18');
  assert.deepEqual(sampleAccumulation(getPolynomial('zero'), -300, 300, 1).segments, []);
  for (const model of polynomials) for (let a = -300; a <= 300; a += 37) {
    const f = sampleAccumulation(model, a, 173, 1), r = sampleAccumulation(model, 173, a, 1);
    assert.ok(equalKpRationals(f.geometric, r.geometric)); assert.ok(f.area + 1e-12 >= Math.abs(f.total));
    close(f.area, numeric(f.above) + numeric(f.below));
    close(f.total, (a <= 173 ? 1 : -1) * (numeric(f.above) - numeric(f.below)));
  }
});
test('bounded source admission never silently rounds extra precision or admits partial and foreign syntax', () => {
  for (const text of ['', '-', '1e0', '0x1', '3.01', '-3.01', '1/2', '.001', 'Infinity', '9'.repeat(13)]) assert.throws(() => readBound(text), AccumulationGap);
  for (const text of ['-3', '3', '2.01', '-.07', '0.29', '+.1']) assert.equal(readBound(text), Math.round(Number(text) * 100));
  assert.throws(() => getPolynomial('cubic'), AccumulationGap);
  for (const params of ['case=cubic', 'a=-4', 'b=1.001', 'p=NaN', 'p=1.1', 'p=-0.1', 'p=']) assert.throws(() => readAccumulationUrl(new URLSearchParams(params)), AccumulationGap);
  for (const p of [-1, NaN, Infinity, 2]) assert.throws(() => sampleAccumulation(polynomials[0]!, -200, 200, p), AccumulationGap);
  assert.throws(() => sampleAccumulation(polynomials[0]!, 2.3, 200, .5), AccumulationGap);
});
test('direct seek, reverse, endpoint quantization and URL reconstruction preserve source and paint', () => {
  for (const model of polynomials) for (const [a, b] of [[-200, 200], [200, -173], [0, 0]] as const) {
    const graphs = graphModel(model, a);
    for (const p of [0, .1, .3333, .5, .999, 1]) {
      const frame = sampleAccumulation(model, a, b, p), paint = graphParts(model, graphs, frame);
      const restored = readAccumulationUrl(new URLSearchParams({ case: model.id, a: String(a / 100), b: String(b / 100), p: String(p) }));
      assert.deepEqual(sampleAccumulation(restored.model, restored.a, restored.b, restored.progress), frame);
      sampleAccumulation(model, a, b, 1); sampleAccumulation(model, a, b, 0);
      assert.deepEqual(graphParts(model, graphs, sampleAccumulation(model, a, b, p)), paint);
      assert.equal(frame.x, Math.round(a + (b - a) * p));
      assert.doesNotMatch(JSON.stringify(paint), /NaN|Infinity/);
    }
  }
});
test('readouts have fixed precision and explicit bounded values', () => {
  assert.equal(formatReadout('total', -.00001), '0.000'); assert.equal(formatReadout('total', -18), '-18.000');
  assert.equal(formatReadout('x', 2.1), '2.10'); assert.equal(formatReadout('value', -3), '-3.000');
  for (const value of [NaN, Infinity, 19, -19]) assert.throws(() => formatReadout('total', value), AccumulationGap);
});
test('committed static page retains full geometry, exact results and native definitions', () => {
  const html = renderAccumulationReference();
  assert.equal(readFileSync(new URL('../experiments/polynomial-accumulation/index.html', import.meta.url), 'utf8'), html);
  assert.equal((html.match(/<svg /g) ?? []).length, 2);
  assert.match(html, /data-exact="signed">4\/3/); assert.match(html, /data-exact="geometric">4</);
  assert.match(html, /data-entity="accumulation.below"/); assert.match(html, /<math /); assert.match(html, /<noscript>/);
  assert.ok(html.indexOf('data-part="above"') < html.indexOf('class="graph-axis'));
});
