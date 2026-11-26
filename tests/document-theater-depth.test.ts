import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentRailEmergence, documentTheaterExitPresence } from '../src/reader/app/document-theater-depth.ts';

test('the final stage withdraws before sticky release and restores on reverse', () => {
  const sample = (position: number) => documentTheaterExitPresence(position, 1000, 100, 180);
  assert.equal(sample(1100), 1);
  assert.equal(sample(1190), .5);
  assert.equal(sample(1280), 0);
  assert.equal(sample(1400), 0);
  assert.deepEqual([1100, 1190, 1280, 1190, 1100].map(sample), [1, .5, 0, .5, 1]);
});

test('prose emerges at stage center and settles before leaving its reading interval', () => {
  const sample = (travel: number) => documentRailEmergence(400 + travel, 200, [{ top: 500, bottom: 580 }]);
  assert.deepEqual(sample(-1), { stage: 1, prose: [{ presence: 0, lift: 1, attention: 0 }] });
  assert.equal(sample(12).prose[0]!.presence, .5);
  assert.equal(sample(48).prose[0]!.lift, .5);
  assert.equal(sample(96).prose[0]!.lift, 0);
  assert.equal(sample(96).stage, 0);
  assert.equal(sample(250).stage, 1);
  assert.equal(sample(250).prose[0]!.presence, 1);
  assert.equal(documentRailEmergence(0, 200, []).stage, 1);
});

test('direct seeks and reverse preserve both distant passages and bounded attention', () => {
  const sample = (top: number) => documentRailEmergence(top, 200, [{ top: 500, bottom: 580 }, { top: 1200, bottom: 1800 }]);
  const positions = [0, 412, 448, 496, 800, 1112, 1196, 1700, 1900];
  assert.deepEqual(positions.map(sample), [...positions].reverse().map(sample).reverse());
  for (const position of positions) {
    const state = sample(position);
    assert.ok(state.stage >= 0 && state.stage <= 1);
    for (const prose of state.prose) assert.ok(prose.presence >= 0 && prose.presence <= 1 && prose.lift >= 0 && prose.lift <= 1);
  }
  assert.equal(sample(1700).stage, 0); // a long paragraph retains its reading turn
});
