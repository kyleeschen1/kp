import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareComposition, sampleComposition, presets, readCompositionUrl, CompositionGap } from '../src/experiments/composition-area/model.ts';

test('noncommuting pair retains both ordered products and exact corner images', () => {
  const m = prepareComposition(presets[0].values);
  assert.deepEqual(m.ba.matrix, [[2, 2], [0, 1]]);
  assert.deepEqual(m.ab.matrix, [[2, 1], [0, 1]]);
  assert.deepEqual(m.ba.corners, [[0, 0], [2, 0], [4, 1], [2, 1]]);
  assert.equal(m.commutes, false); assert.equal(m.ba.signedArea, 2); assert.equal(m.ab.signedArea, 2);
  assert.notEqual(m.ba.id, m.ab.id);
});
test('reflection, singular collapse, identity and zero preserve determinant meaning', () => {
  const r = prepareComposition(presets[1].values); assert.equal(r.ba.signedArea, -1); assert.equal(r.ab.signedArea, -1);
  const s = prepareComposition(presets[2].values); assert.equal(s.ba.signedArea, 0); assert.equal(s.ab.signedArea, 0);
  assert.deepEqual(s.ba.corners, [[0, 0], [1, 1], [1, 1], [0, 0]]);
  assert.equal(prepareComposition(presets[3].values).commutes, true);
  const z = prepareComposition(Array.from({ length: 8 }, () => '0'));
  assert.equal(z.ba.signedArea, 0); assert.deepEqual(z.ba.corners, [[0, 0], [0, 0], [0, 0], [0, 0]]);
});
test('bounded varied matrices obey determinant multiplication and sequential application', () => {
  for (let k = 0; k < 60; k++) {
    const draft = Array.from({ length: 8 }, (_, i) => String(((k + 1) * (i + 3) + i * i) % 11 - 5));
    const m = prepareComposition(draft);
    assert.ok(Math.abs(m.ba.signedArea - m.a.signedArea * m.b.signedArea) < 1e-8);
    assert.ok(Math.abs(m.ba.signedArea - m.ab.signedArea) < 1e-8);
    // Independent oracle pressures the domain-product adapter/order.
    for (const [first, second, end] of [[m.a, m.b, m.ba], [m.b, m.a, m.ab]] as const) {
      first.corners.forEach((p, i) => assert.deepEqual(end.corners[i], second.matrix.map(row => (row[0] * p[0] + row[1] * p[1]) || 0)));
    }
  }
});
test('sampler preserves exact endpoints, direct seek/reverse and common framing', () => {
  for (const preset of presets) {
    const m = prepareComposition(preset.values);
    assert.strictEqual(sampleComposition(m, 0).left, m.unit.corners);
    assert.strictEqual(sampleComposition(m, .5).left, m.a.corners);
    assert.strictEqual(sampleComposition(m, 1).left, m.ba.corners);
    assert.strictEqual(sampleComposition(m, 1).right, m.ab.corners);
    for (const p of [.1, .49, .5, .51, .9, 1, .2]) {
      const frame = sampleComposition(m, p); sampleComposition(m, 1 - p);
      assert.deepEqual(sampleComposition(m, p), frame);
      assert.ok([...frame.left, ...frame.right].every(v => v[0] >= m.xDomain[0] && v[0] <= m.xDomain[1] && v[1] >= m.yDomain[0] && v[1] <= m.yDomain[1]));
      assert.ok(Math.abs((m.xDomain[1] - m.xDomain[0]) - (m.yDomain[1] - m.yDomain[0])) < 1e-12);
    }
    assert.throws(() => sampleComposition(m, NaN), CompositionGap);
    assert.throws(() => sampleComposition(m, -1), CompositionGap);
  }
});
test('invalid drafts and links cannot silently enter the model', () => {
  for (const text of ['', '-', '1.5', 'Infinity', '6', '1e0', '00000000000000']) {
    assert.throws(() => prepareComposition([text, ...presets[0].values.slice(1)]), CompositionGap);
  }
  assert.throws(() => prepareComposition(['1']), CompositionGap);
  assert.throws(() => readCompositionUrl(new URLSearchParams('beat=missing')), CompositionGap);
  assert.throws(() => readCompositionUrl(new URLSearchParams('p=NaN')), CompositionGap);
  assert.throws(() => readCompositionUrl(new URLSearchParams('m=1,2')), CompositionGap);
  const link = readCompositionUrl(new URLSearchParams({ m: presets[1].values.join(','), beat: 'composed', p: '.75' }));
  assert.equal(link.progress, .75); assert.deepEqual(link.draft, presets[1].values);
});
