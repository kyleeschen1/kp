import assert from 'node:assert/strict';
import test from 'node:test';
import { compileKpVectorDotProjectionSemanticModel } from '../src/animation/vector-dot-projection-semantic-model.ts';
import { sampleDotProjectionModel } from '../src/animation/dot-projection-model-frame.ts';
import { examples, prepareProjection, readProjectionUrl, beatIds } from '../src/experiments/inner-product-projection/model.ts';
import { notation, mathHtml } from '../src/experiments/inner-product-projection/notation.ts';

test('editable examples preserve signed projection, zero source and undefined direction', () => {
  for (const example of examples) {
    const result = prepareProjection([String(example.a[0]), String(example.a[1]), String(example.b[0]), String(example.b[1])]);
    if (example.id === 'zero-target') { assert.equal(result.status, 'undefined'); continue; }
    assert.equal(result.status, 'ready'); if (result.status !== 'ready') continue;
    assert.equal(Math.sign(result.model.dotProduct), example.id === 'positive' ? 1 : example.id === 'negative' ? -1 : 0);
    if (example.id === 'zero-source') assert.equal(result.model.angleRadians, null);
    for (const beat of beatIds) for (const latex of notation(result.model, beat)) assert.match(mathHtml(latex), /class="katex"/);
  }
});
test('bounded integer cohort preserves decomposition, perpendicularity and reversal of direction', () => {
  for (let ax = -5; ax <= 5; ax++) for (let ay = -5; ay <= 5; ay++) for (const [bx, by] of [[1, 1], [-3, 2], [0, -1], [4, 0]]) {
    const result = prepareProjection([String(ax), String(ay), String(bx), String(by)]);
    const reverse = prepareProjection([String(ax), String(ay), String(-bx!), String(-by!)]);
    assert.equal(result.status, 'ready'); assert.equal(reverse.status, 'ready');
    if (result.status !== 'ready' || reverse.status !== 'ready') continue;
    const m = result.model, r = m.residualVector, p = m.projectionVector;
    assert.ok(Math.abs(r[0] * bx! + r[1] * by!) < 1e-12);
    assert.ok(Math.abs(p[0] * by! - p[1] * bx!) < 1e-12);
    assert.ok(Math.abs(p[0] + r[0] - ax) < 1e-12); assert.ok(Math.abs(p[1] + r[1] - ay) < 1e-12);
    for (const index of [0, 1] as const) assert.ok(Math.abs(reverse.model.projectionVector[index] - p[index]) < 1e-12);
    const end = sampleDotProjectionModel(m, 1); assert.deepEqual(end.dropPoint, p);
    assert.deepEqual(sampleDotProjectionModel(m, 0).dropPoint, m.sourceVector);
    const progresses = [0, .125, .25, .6875, .75, .875, 1];
    const forward = progresses.map(progress => sampleDotProjectionModel(m, progress));
    for (const [index, progress] of progresses.entries()) {
      sampleDotProjectionModel(m, 1 - progress);
      assert.deepEqual(sampleDotProjectionModel(m, progress), forward[index]);
    }
  }
});
test('unsafe intermediate arithmetic fails at the compiler, before any representation', () => {
  const result = compileKpVectorDotProjectionSemanticModel({ id: 'unsafe', sourceVectorId: 'a', targetVectorId: 'b',
    projectionVectorId: 'p', residualVectorId: 'r', sourceVector: [Number.MAX_SAFE_INTEGER, 0], targetVector: [1, 1] });
  assert.equal(result.status, 'rejected'); if (result.status === 'rejected') assert.equal(result.diagnostics[0]?.code, 'vector.arithmetic.unsafe');
});
test('draft and URL boundaries reject partial, nonfinite, fractional and ambiguous inputs', () => {
  for (const value of ['', '-', '0.5', 'Infinity', 'NaN', '1e2', '1001', '0x10'])
    assert.equal(prepareProjection([value, '2', '1', '1']).status, 'invalid');
  for (const query of ['a=1,2', 'a=1,2,3&b=4', 'a=1,2&b=3,4&beat=unknown', 'a=1,2&b=3,4&a=4,5'])
    assert.equal(readProjectionUrl(new URLSearchParams(query)).status, 'invalid');
  for (const beat of beatIds) {
    const result = readProjectionUrl(new URLSearchParams({ a: '-4,2', b: '1,1', beat }));
    assert.equal(result.status, 'ready'); if (result.status === 'ready') assert.equal(result.progress, beatIds.indexOf(beat) / 8);
  }
  const valid = prepareProjection(['4', '2', '1', '1']); assert.equal(valid.status, 'ready');
  if (valid.status === 'ready') for (const value of [NaN, Infinity, -1, 1.01]) assert.throws(() => sampleDotProjectionModel(valid.model, value), RangeError);
});
