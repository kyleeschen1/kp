import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry, available, commandRows, createRowPickerSession, target, unavailable, type Row } from '../src/interaction/public-api.ts';

const fruits = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pear'];
const rows: readonly Row<{ name: string }>[] = fruits.map((name, index) => ({
  id: `fruit-${index}`, resource: { name }, actions: ['choose'], facets: { kind: [index < 3 ? 'first' : 'rest'] },
  fields: { title: { text: name, display: 'primary', search: 'fuzzy' }, private: { text: 'not-searchable', display: 'annotation', search: 'none' } }
}));

test('the bounded window retains every result and selection survives narrowing by identity', () => {
  const picker = createRowPickerSession({ execute: () => ({ ok: true }) });
  picker.open(rows); assert.equal(picker.snapshot().total, 12); assert.equal(picker.snapshot().visible.length, 5);
  picker.move(11); assert.equal(picker.snapshot().selected, 'fruit-11'); assert.equal(picker.snapshot().offset, 7);
  assert.equal(picker.snapshot().visible.at(-1)?.row.resource, rows[11]?.resource);
  picker.query('pear'); assert.equal(picker.snapshot().total, 1); assert.equal(picker.snapshot().selected, 'fruit-11');
  picker.query(''); assert.equal(picker.snapshot().selected, 'fruit-11'); assert.equal(picker.snapshot().offset, 7);
  picker.filter({ kind: ['first'] }); assert.equal(picker.snapshot().total, 3); assert.equal(picker.snapshot().visible.length, 3);
  picker.filter({ kind: [] }); assert.equal(picker.snapshot().total, 0); assert.equal(picker.snapshot().selected, undefined);
  picker.filter({}); picker.query('not-searchable'); assert.equal(picker.snapshot().total, 0);
  picker.close(); assert.equal(picker.snapshot().visible.length, 0);
});

test('command rows retain captured targets and revalidate current command ownership', async () => {
  const seen: string[] = [];
  let selected = 'source-a';
  const registry = new CommandRegistry(() => ({ scope: 'workspace' }), () => {});
  const command = registry.targeted({ id: 'open', title: 'Open source', category: 'Sources', keywords: ['inspect'],
    target: () => target(selected), run: source => { seen.push(source); } });
  const picker = createRowPickerSession({ state: (row: Row<ReturnType<typeof command.prepare>>) => row.resource.state(), execute: row => row.resource.execute() });
  picker.open(commandRows(registry.snapshot())); selected = 'source-b'; picker.query('inspect');
  assert.equal((await picker.accept()).ok, true); assert.deepEqual(seen, ['source-a']);
  picker.open(commandRows(registry.snapshot())); command.dispose();
  registry.add({ id: 'open', title: 'Replacement', category: 'Sources', run: () => { seen.push('replacement'); } });
  assert.equal((await picker.accept()).ok, false); assert.deepEqual(seen, ['source-a']);
  assert.equal(picker.snapshot().open, true); picker.dispose(); registry.dispose();
});

test('disabled targets stay open; accepting closes before execution and cannot duplicate the action', async () => {
  let ready = false, calls = 0, release: (() => void) | undefined;
  const picker = createRowPickerSession({ state: () => ready ? available() : unavailable('Wait for source'), execute: async () => {
    assert.equal(picker.snapshot().open, false); calls++; await new Promise<void>(resolve => { release = resolve; }); return { ok: true };
  } });
  picker.open(rows);
  assert.deepEqual(await picker.accept(), { ok: false, reason: 'Wait for source' }); assert.equal(calls, 0);
  ready = true; const pending = picker.accept(); assert.equal(calls, 1);
  assert.equal((await picker.accept()).ok, false);
  picker.open(rows); picker.query('cherry'); release?.(); await pending;
  assert.equal(picker.snapshot().open, true); assert.equal(picker.snapshot().query, 'cherry'); picker.dispose();
});

test('disposed sessions release rows/listeners and cannot reopen or execute', async () => {
  let calls = 0, updates = 0;
  const picker = createRowPickerSession({ execute: () => { calls++; return { ok: true }; } });
  picker.subscribe(() => { updates++; }); picker.open(rows); picker.dispose(); const atDisposal = updates;
  picker.dispose(); picker.query('apple'); picker.move(1); picker.filter({}); picker.refresh();
  assert.equal(updates, atDisposal); assert.equal(picker.snapshot().visible.length, 0);
  assert.equal((await picker.accept()).ok, false); assert.equal(calls, 0);
  assert.throws(() => picker.open(rows), /owner has closed/); assert.throws(() => picker.subscribe(() => {}), /owner has closed/);
});

test('invalid identities and window bounds cannot replace a valid session', () => {
  assert.throws(() => createRowPickerSession({ maxVisible: 0, execute: () => ({ ok: true }) }), /between 1 and 50/);
  assert.throws(() => createRowPickerSession({ maxVisible: 2.5, execute: () => ({ ok: true }) }), /between 1 and 50/);
  const picker = createRowPickerSession({ execute: () => ({ ok: true }) }); picker.open(rows);
  assert.throws(() => picker.open([rows[0]!, rows[0]!]), /unique/); assert.equal(picker.snapshot().total, 12);
  picker.move(NaN); assert.equal(picker.snapshot().selected, 'fruit-0');
  const filters = { kind: ['first'] }; picker.filter(filters); filters.kind.length = 0;
  picker.query(''); assert.equal(picker.snapshot().total, 3);
});

test('failed execution reports an explicit result without changing a newer opening', async () => {
  const picker = createRowPickerSession({ execute: async () => { picker.open(rows); throw new Error('source unavailable'); } });
  picker.open(rows);
  assert.deepEqual(await picker.accept(), { ok: false, reason: 'source unavailable' });
  assert.equal(picker.snapshot().open, true); assert.equal(picker.snapshot().total, 12);
});
