import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createMatrixVectorDocument, editMatrixVectorDocument, readMatrixSnapshot, serializeMatrixSnapshot, MathResourceGap } from '../src/math-resources/data-api.ts';
import { newId } from '../src/notebook/model.ts';
import { createMatrixVectorRuntime } from '../src/math-resources/public-api.ts';
import { columnExampleFromVectorProduct, numberOf } from '../src/experiments/matrix-column-combinations/model.ts';
import { readReferenceRecord, referenceSeed, replaceReference } from '../src/matrix-reference/record.ts';
import { migrateReference, readReferenceShelf, replaceShelf, selectedCard, type ReferenceShelf } from '../src/matrix-reference/shelf.ts';
import { createReferenceSession, type MountReference, type PendingImport } from '../src/matrix-reference/session.ts';

const fixture = JSON.parse(readFileSync(new URL('../content/notebooks/matrix-object-exemplar.json', import.meta.url), 'utf8')).matrixResources[0];
const legacy = referenceSeed(fixture), seed = migrateReference(legacy);
const file = (source: unknown, name = 'matrix.json') => ({ name, size: 1000, text: async () => JSON.stringify(source) });
function harness(initial = seed) {
  let stored = initial, closed = 0, failSave = false, pending: PendingImport | undefined;
  const cards: { disposed: number; revealed: boolean; progress: number; settled: (p: number) => void; seek: (p: number) => void }[] = [];
  const errors: unknown[] = [], changes: ReferenceShelf[] = [];
  const mount: MountReference = (record, settled) => {
    const runtime = createMatrixVectorRuntime(record.source);
    try { columnExampleFromVectorProduct(runtime.explanation().product); } finally { runtime.dispose(); }
    const card = { disposed: 0, revealed: false, progress: record.view.progress, settled,
      seek(p: number) { card.progress = p; settled(p); } }; cards.push(card);
    settled(record.view.progress);
    return { reveal() { card.revealed = true; }, pause() { settled(card.progress); }, dispose() { card.disposed++; } };
  };
  const session = createReferenceSession({ async change(fn) {
    if (failSave) throw new Error('Disk unavailable'); stored = fn(stored);
  }, close() { closed++; } }, initial, mount, record => changes.push(record), error => errors.push(error), value => { pending = value; });
  return { session, cards, errors, changes, stored: () => stored, closed: () => closed, pending: () => pending,
    failSave() { failSave = true; }, conflict() { stored = { ...stored, revision: stored.revision + 1 }; } };
}
test('snapshot JSON preserves identities and signed/zero truth; explanation is derived, never serialized', () => {
  let source = readMatrixSnapshot(fixture);
  source = editMatrixVectorDocument(source, { kind: 'matrix', field: 'a00', text: '-2' });
  source = editMatrixVectorDocument(source, { kind: 'vector', field: 'x', text: '0' });
  const json = serializeMatrixSnapshot(source), restored = readMatrixSnapshot(JSON.parse(json));
  assert.deepEqual(restored, source); assert.equal(restored.id, legacy.source.id);
  assert.deepEqual(Object.keys(JSON.parse(json)).sort(), ['id', 'matrix', 'occurrences', 'result', 'schemaVersion', 'vector']);
  const runtime = createMatrixVectorRuntime(restored);
  assert.deepEqual(columnExampleFromVectorProduct(runtime.explanation().product).combination.result.entries.map(numberOf), [2, 2]); runtime.dispose();
  assert.throws(() => serializeMatrixSnapshot(editMatrixVectorDocument(source, { kind: 'vector', field: 'x', text: '-' })), MathResourceGap);
});
test('legacy view validation and stale revision checks remain available for rollback', () => {
  for (const progress of [-1, 2, NaN, Infinity, '0']) assert.throws(() => readReferenceRecord({ ...legacy, view: { ...legacy.view, progress } }), MathResourceGap);
  assert.throws(() => readReferenceRecord({ ...legacy, revision: -1 }), MathResourceGap);
  assert.throws(() => readReferenceRecord({ ...legacy, extra: true }), MathResourceGap);
  assert.throws(() => replaceReference(legacy, 1, legacy), /another tab/);
  assert.deepEqual(replaceReference(legacy, 0, legacy).source, legacy.source);
});
test('migration preserves source and view; card identities and selection are independent validated data', () => {
  const saved = { ...legacy, revision: 8, view: { progress: .5, filename: 'Original.json' } }, before = structuredClone(saved);
  const migrated = migrateReference(saved), card = selectedCard(migrated);
  assert.deepEqual(saved, before); assert.deepEqual(card.source, saved.source); assert.deepEqual(card.view, saved.view);
  assert.notEqual(card.id, card.source.id); assert.equal(card.name, 'Original');
  assert.deepEqual(readReferenceShelf(JSON.parse(JSON.stringify(migrated))), migrated);
  for (const invalid of [{ ...seed, selected: newId() }, { ...seed, cards: [] }, { ...seed, cards: [card, card] },
    { ...seed, cards: [{ ...selectedCard(seed), name: ' ' }] }, { ...seed, revision: -1 },
    { ...seed, cards: Array.from({ length: 51 }, () => ({ ...card, id: newId() })) }]) assert.throws(() => readReferenceShelf(invalid));
  assert.throws(() => replaceShelf(seed, 1, seed), /another tab/);
});
test('three sources keep names and positions through switching; only selected presentation stays live', async () => {
  const h = harness(), first = seed.selected;
  h.cards[0]!.seek(.5); await h.session.idle();
  await h.session.rename(first, 'Shear');
  await h.session.importFile(file(createMatrixVectorDocument(), 'Second.json')); const second = h.stored().selected;
  h.cards.at(-1)!.seek(1); await h.session.idle();
  await h.session.importFile(file(createMatrixVectorDocument(), 'Third.json')); const third = h.stored().selected;
  h.cards.at(-1)!.seek(1 / 3); await h.session.idle();
  await h.session.select(first); assert.equal(h.cards.at(-1)!.progress, .5);
  assert.equal(selectedCard(h.stored()).name, 'Shear');
  await h.session.select(second); assert.equal(h.cards.at(-1)!.progress, 1);
  await h.session.select(third); assert.equal(h.cards.at(-1)!.progress, 1 / 3);
  assert.equal(h.cards.filter(c => !c.disposed).length, 1); assert.equal(h.stored().cards.length, 3);
  const restored = harness(readReferenceShelf(JSON.parse(JSON.stringify(h.stored()))));
  assert.equal(restored.cards[0]!.progress, 1 / 3); restored.session.dispose();
  h.session.dispose(); h.session.dispose(); assert.equal(h.closed(), 1); assert.ok(h.cards.every(c => c.disposed === 1));
});
test('same-source import requires a decision; updating one named copy cannot alter its sibling', async () => {
  const h = harness(), original = seed.selected;
  await h.session.rename(original, 'Original'); h.cards[0]!.seek(.5); await h.session.idle();
  const source = editMatrixVectorDocument(legacy.source, { kind: 'matrix', field: 'a00', text: '3' });
  const before = h.stored(); await h.session.importFile(file(source));
  assert.ok(h.pending()); assert.deepEqual(h.stored(), before);
  await h.session.confirmImport({ kind: 'copy' }); const copy = h.stored().selected;
  assert.notEqual(copy, original); assert.equal(selectedCard(h.stored()).source.id, legacy.source.id);
  assert.equal(selectedCard(h.stored()).view.progress, 0);
  await h.session.rename(copy, 'Variation'); h.cards.at(-1)!.seek(1); await h.session.idle();
  const changed = editMatrixVectorDocument(source, { kind: 'matrix', field: 'a00', text: '4' });
  await h.session.importFile(file(changed)); await h.session.confirmImport({ kind: 'update', cardId: original });
  assert.equal(h.stored().cards.length, 2); assert.equal(selectedCard(h.stored()).name, 'Original');
  assert.equal(selectedCard(h.stored()).view.progress, .5); assert.deepEqual(selectedCard(h.stored()).source, changed);
  assert.deepEqual(h.stored().cards.find(c => c.id === copy)!.source, source);
  assert.equal(h.stored().cards.find(c => c.id === copy)!.view.progress, 1);
  h.cards[0]!.settled(0); await h.session.idle(); assert.equal(selectedCard(h.stored()).view.progress, .5);
  await h.session.importFile(file(source)); h.session.cancelImport(); await h.session.confirmImport({ kind: 'copy' });
  assert.equal(h.stored().cards.length, 2); h.session.dispose();
});
test('malformed and unsupported imports leave the last visible and saved card intact', async () => {
  const h = harness();
  for (const source of [{}, { ...fixture, schemaVersion: 9 },
    editMatrixVectorDocument(legacy.source, { kind: 'matrix', field: 'a00', text: '-' }),
    editMatrixVectorDocument(legacy.source, { kind: 'matrix', field: 'a00', text: '0.00000001' })]) {
    await h.session.importFile(file(source)); if (h.pending()) await h.session.confirmImport({ kind: 'update', cardId: seed.selected });
    assert.deepEqual(h.stored(), seed); assert.equal(h.cards[0]!.disposed, 0);
  }
  assert.equal(h.errors.length, 4); assert.match(String(h.errors.at(-1)), /scientific notation/);
  await h.session.importFile({ name: 'large.json', size: 65537, text: async () => { throw new Error('Must not read'); } });
  assert.match(String(h.errors.at(-1)), /64 KiB/); h.session.dispose();
});
test('updating a source cannot silently replace the persistent identities inside it', async () => {
  const h = harness(), matrixId = newId();
  const source = readMatrixSnapshot({ ...legacy.source, matrix: { ...legacy.source.matrix, id: matrixId },
    result: { ...legacy.source.result, matrix: matrixId } });
  await h.session.importFile(file(source)); await h.session.confirmImport({ kind: 'update', cardId: seed.selected });
  assert.match(String(h.errors[0]), /changes the matrix, vector or result identity/); assert.deepEqual(h.stored(), seed);
  await h.session.importFile(file(source)); await h.session.confirmImport({ kind: 'copy' });
  assert.equal(h.stored().cards.length, 2); assert.deepEqual(selectedCard(h.stored()).source, source); h.session.dispose();
});
test('slower reads, navigation and disposal cancel stale imports', async () => {
  const h = harness(); let release = (_: string) => {};
  const old = h.session.importFile({ name: 'old.json', size: 1, text: () => new Promise(resolve => { release = resolve; }) });
  await h.session.importFile(file(createMatrixVectorDocument(), 'new.json'));
  release(JSON.stringify(createMatrixVectorDocument())); await old;
  assert.equal(selectedCard(h.stored()).view.filename, 'new.json'); assert.equal(h.stored().cards.length, 2);
  let finish = (_: string) => {};
  const pending = h.session.importFile({ name: 'cancel.json', size: 1, text: () => new Promise(resolve => { finish = resolve; }) });
  await h.session.select(seed.selected); finish(JSON.stringify(createMatrixVectorDocument())); await pending;
  assert.equal(h.stored().cards.length, 2); assert.equal(h.stored().selected, seed.selected);
  const cancelled = h.session.importFile({ name: 'dispose.json', size: 1, text: () => new Promise(resolve => { finish = resolve; }) });
  h.session.dispose(); finish(JSON.stringify(createMatrixVectorDocument())); await cancelled; assert.equal(h.stored().cards.length, 2);
});
test('storage failure or another tab preserves the visible card and disposes its candidate', async () => {
  for (const failure of ['failSave', 'conflict'] as const) {
    const h = harness(); h[failure](); await h.session.importFile(file(createMatrixVectorDocument()));
    assert.equal(h.cards[0]!.disposed, 0); assert.equal(h.cards[1]!.disposed, 1);
    assert.equal(h.cards[1]!.revealed, false); assert.equal(h.errors.length, 1); assert.equal(h.stored().cards.length, 1); h.session.dispose();
  }
});
test('disposal during a pending write releases both presentations without reviving the host', async () => {
  let finish = () => {}, entered = () => {}, stored = seed;
  const pending = new Promise<void>(resolve => { entered = resolve; });
  const cards: { disposed: number; revealed: number }[] = [], changes: ReferenceShelf[] = [], errors: unknown[] = [];
  const session = createReferenceSession({ change: fn => new Promise<void>((resolve, reject) => {
    finish = () => { try { stored = fn(stored); resolve(); } catch (error) { reject(error); } }; entered();
  }), close() {} }, seed, () => {
    const card = { disposed: 0, revealed: 0 }; cards.push(card);
    return { pause() {}, reveal() { card.revealed++; }, dispose() { card.disposed++; } };
  }, record => changes.push(record), error => errors.push(error), () => {});
  const imported = session.importFile(file(createMatrixVectorDocument())); await pending; session.dispose(); finish(); await imported;
  assert.equal(stored.revision, 0); assert.deepEqual(cards, [{ disposed: 1, revealed: 1 }, { disposed: 1, revealed: 0 }]);
  assert.equal(changes.length, 1); assert.equal(errors.length, 0);
});
