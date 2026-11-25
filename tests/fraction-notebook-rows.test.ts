import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchRows } from '../src/editor-rows/matching.ts';
import { matchesFacets, orderRows, retainRow, toggleFacet, type Row } from '../src/editor-rows/model.ts';
import { parseVimReference } from '../src/editor-commands/vim-reference.ts';
import { bindingSupport, surfaces, workspaceBindings } from '../src/editor-commands/vim-coverage.ts';
import { vimRows, vimTags, vimFacetGroups } from '../src/editor-commands/vim-rows.ts';

const sample: Row<{ id: string }> = { id: 'file:1', resource: { id: 'original-file-id' }, actions: ['files.open'],
  fields: { title: { text: 'Apricot notes', display: 'primary', search: 'fuzzy' },
    size: { text: '1234 bytes', display: 'annotation', search: 'none' },
    alias: { text: 'orchard', display: 'hidden', search: 'literal', label: 'Alias' } },
  facets: { kind: ['file', 'note'], status: ['draft'] } };
const entries = [...workspaceBindings, ...parseVimReference(readFileSync(new URL('../vendor/vim-9.2.0000/index.txt', import.meta.url), 'utf8'))];

test('rows match only declared fields and carry exact winning spans plus the original resource', () => {
  assert.equal(matchRows([sample], '1234').length, 0);
  const [match] = matchRows([sample], 'apt orchard'); assert.ok(match);
  assert.strictEqual(match.row.resource, sample.resource); assert.deepEqual(match.row.actions, ['files.open']);
  assert.deepEqual(match.fields, [ { field: 'title', ranges: [[0, 2], [6, 7]] }, { field: 'alias', ranges: [[0, 7]] } ]);
  assert.equal(matchRows([sample], 'orchard nope').length, 0);
  const literal: Row<null> = { ...sample, resource: null, fields: { text: { text: 'a.*b', display: 'primary', search: 'literal' } } };
  assert.deepEqual(matchRows([literal], '.*')[0]?.fields[0]?.ranges, [[1, 3]]);
});

test('case folding and astral characters retain valid source offsets for highlights', () => {
  const row: Row<null> = { ...sample, resource: null, fields: { text: { text: '😀İtem', display: 'primary', search: 'fuzzy' } } };
  assert.deepEqual(matchRows([row], '😀')[0]?.fields[0]?.ranges, [[0, 2]]);
  assert.deepEqual(matchRows([row], 'i')[0]?.fields[0]?.ranges, [[2, 3]]);
  assert.deepEqual(matchRows([row], 'i\u0307')[0]?.fields[0]?.ranges, [[2, 3]]);
});

test('facets use OR inside groups, AND across groups and distinguish unrestricted from empty', () => {
  assert.equal(matchesFacets(sample, {}), true);
  assert.equal(matchesFacets(sample, { kind: ['task', 'file'], status: ['draft'] }), true);
  assert.equal(matchesFacets(sample, { kind: ['file'], status: ['done'] }), false);
  assert.equal(matchesFacets(sample, { kind: [] }), false);
  assert.equal(matchesFacets(sample, { kind: [], status: ['draft'] }, 'kind'), true);
  const group = { id: 'kind', label: 'Kind', values: [{ id: 'file', label: 'File', key: 'f' }, { id: 'note', label: 'Note', key: 'n' }] };
  const next = toggleFacet({}, group, 'file'); assert.deepEqual(next, { kind: ['note'] });
  assert.deepEqual(toggleFacet(next, group, 'note'), { kind: [] }); assert.strictEqual(toggleFacet(next, group, 'invented'), next);
});

test('sorting and narrowing preserve stable row selection independently of row positions', () => {
  const other: Row<{ id: string }> = { ...sample, id: 'file:2', fields: { title: { text: 'Apple', display: 'primary', search: 'fuzzy' } }, facets: { kind: ['task'] } };
  const matches = matchRows([sample, other], 'ap');
  const sorted = orderRows(matches, { by: 'field', id: 'title' }); assert.equal(sorted[0]?.row.id, 'file:2');
  assert.equal(retainRow(sorted, 'file:1'), 'file:1'); assert.equal(retainRow(sorted, 'removed'), 'file:2'); assert.equal(retainRow([], 'file:1'), undefined);
  assert.equal(orderRows(matches, { by: 'facet', id: 'kind' })[0]?.row.id, 'file:1');
});

test('the Vim adapter preserves all reference identities and support claims across eight surfaces', () => {
  for (const surface of Object.keys(surfaces) as (keyof typeof surfaces)[]) {
    const rows = vimRows(entries, surface, 'mac'); assert.equal(rows.length, 1369); assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    for (let index = 0; index < entries.length; index++) {
      const row = rows[index]!, entry = entries[index]!; assert.strictEqual(row.resource.entry, entry);
      assert.deepEqual(row.resource.support, bindingSupport(entry, surface, 'mac'));
      for (const group of vimFacetGroups) assert.ok(row.facets[group.id]?.every(value => group.values.some(option => option.id === value)));
    }
  }
});

test('operators, operands, motions, Ex and domains remain independent and aliases reveal their match', () => {
  const entry = (tag: string) => { const value = entries.find(entry => entry.tag === tag); assert.ok(value); return value; };
  assert.deepEqual(vimTags(entry('d')).role, ['operation', 'operator']); assert.deepEqual(vimTags(entry('w')).role, ['motion']);
  assert.deepEqual(vimTags(entry('i_<BS>')).role, ['operation']); assert.deepEqual(vimTags(entry('i_<CR>')).role, ['operation']);
  assert.deepEqual(vimTags(entry('i_<Left>')).role, ['motion']); assert.deepEqual(vimTags(entry('c_CTRL-B')).role, ['motion']);
  assert.ok(entries.filter(entry => entry.moves).every(entry => vimTags(entry).role.includes('motion')));
  assert.deepEqual(vimTags(entry('v_iw')).role, ['text-object']); assert.deepEqual(vimTags(entry('v_iw')).mode, ['operator', 'visual']);
  assert.deepEqual(vimTags(entry(':next')).role, ['motion']); assert.deepEqual(vimTags(entry(':next')).mode, ['ex']);
  assert.deepEqual(vimTags(entry('message')).domain, ['chat']); assert.deepEqual(vimTags(entry('message')).role, ['motion']);
  const rows = vimRows(entries, 'notebook', 'mac');
  assert.equal(matchRows(rows, 'substitute')[0]?.row.resource.entry.tag, ':substitute');
  assert.equal(matchRows(rows, ':write')[0]?.row.resource.entry.tag, ':write');
  for (const query of ['diw', 'macro', '3w', ':%s/foo/bar/g']) {
    const hits = matchRows(rows, query); assert.ok(hits.length); assert.ok(hits.some(hit => hit.fields.some(field => field.field === 'aliases')));
  }
  const keys = vimFacetGroups.flatMap(group => group.values.map(value => value.key)); assert.equal(new Set(keys).size, keys.length);
  assert.ok(!keys.includes('q') && !keys.includes('r'));
});
