import test from 'node:test';
import assert from 'node:assert/strict';
import { fruits, matchFruits } from '../src/fraction-notebook/fruit-matches.ts';
import { querySchema, singleLine } from '../src/fraction-notebook/picker-query.ts';

test('fruit matches rank prefixes before substrings, retain ordered fuzzy matches and cap visible suggestions', () => {
  assert.deepEqual(matchFruits('ap').map(match => match.label), ['Apple', 'Apricot', 'Grape', 'Grapefruit', 'Papaya']);
  assert.deepEqual(matchFruits('apric').map(match => match.label), ['Apricot']);
  assert.deepEqual(matchFruits('gpf').map(match => match.label), ['Grapefruit']);
  assert.deepEqual(matchFruits('gpf')[0]?.positions, [0, 3, 5]);
  assert.deepEqual(matchFruits(''), []); assert.deepEqual(matchFruits('   '), []);
  assert.deepEqual(matchFruits('xyz'), []); assert.deepEqual(matchFruits('zzapple'), []);
  assert.deepEqual(matchFruits('  AP  '), matchFruits('ap'));
  assert.equal(new Set(fruits.map(fruit => fruit.id)).size, fruits.length);
  for (const fruit of fruits) assert.equal(matchFruits(fruit.label)[0]?.id, fruit.id);
});

test('every emphasized character realizes the query in order and ranking is deterministic', () => {
  for (const query of ['a', 'ap', 'pp', 'ae', 'bbr', 'gpf', 'dragon fruit', 'e', 'berry', '🍊']) {
    const matches = matchFruits(query);
    assert.ok(matches.length <= 5); assert.deepEqual(matchFruits(query), matches);
    assert.equal(new Set(matches.map(match => match.id)).size, matches.length);
    for (const match of matches) {
      assert.equal(match.positions.map(index => match.label[index]).join('').toLowerCase(), query);
      assert.ok(match.positions.every((position, index) => index === 0 || position > match.positions[index - 1]!));
    }
  }
});

test('query schema admits one unformatted paragraph and paste normalization removes line breaks', () => {
  const paragraph = querySchema.node('paragraph', null, querySchema.text('ap'));
  querySchema.node('doc', null, paragraph).check();
  assert.throws(() => querySchema.node('doc', null, [paragraph, paragraph]));
  assert.deepEqual(Object.keys(querySchema.marks), []);
  assert.equal(singleLine('Dragon\r\nfruit\t\u2028\u2029test'), 'Dragon fruit test');
});
