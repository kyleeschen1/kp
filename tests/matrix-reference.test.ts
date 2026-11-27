import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { editMatrixVectorDocument, readMatrixSnapshot, serializeMatrixSnapshot, MathResourceGap } from '../src/math-resources/data-api.ts';
import { createMatrixVectorRuntime } from '../src/math-resources/public-api.ts';
import { columnExampleFromVectorProduct, numberOf } from '../src/experiments/matrix-column-combinations/model.ts';
import { readReferenceRecord, referenceSeed, replaceReference, type ReferenceRecord } from '../src/matrix-reference/record.ts';
import { createReferenceSession, type MountReference } from '../src/matrix-reference/session.ts';

const fixture = JSON.parse(readFileSync(new URL('../content/notebooks/matrix-object-exemplar.json', import.meta.url), 'utf8')).matrixResources[0];
const seed = referenceSeed(fixture);
const file = (source: unknown, name = 'matrix.json') => ({ name, size: 1000, text: async () => JSON.stringify(source) });
function harness() {
  let stored = seed, closed = 0, failSave = false;
  const cards: { disposed: number; revealed: boolean; settled: (p: number) => void }[] = [];
  const errors: unknown[] = [], changes: ReferenceRecord[] = [];
  const mount: MountReference = (record, settled) => {
    const runtime = createMatrixVectorRuntime(record.source);
    try { columnExampleFromVectorProduct(runtime.explanation().product); } finally { runtime.dispose(); }
    const card = { disposed: 0, revealed: false, settled }; cards.push(card);
    settled(record.view.progress);
    return { reveal() { card.revealed = true; }, pause() {}, dispose() { card.disposed++; } };
  };
  const session = createReferenceSession({ async change(fn) {
    if (failSave) throw new Error('Disk unavailable'); stored = fn(stored);
  }, close() { closed++; } }, seed, mount, record => changes.push(record), error => errors.push(error));
  return { session, cards, errors, changes, stored: () => stored, closed: () => closed,
    failSave() { failSave = true; }, conflict() { stored = { ...stored, revision: stored.revision + 1 }; } };
}
test('snapshot JSON preserves identities and numeric truth; explanation is derived, never serialized', () => {
  let source = readMatrixSnapshot(fixture);
  source = editMatrixVectorDocument(source, { kind: 'matrix', field: 'a00', text: '-2' });
  source = editMatrixVectorDocument(source, { kind: 'vector', field: 'x', text: '0' });
  const json = serializeMatrixSnapshot(source), restored = readMatrixSnapshot(JSON.parse(json));
  assert.deepEqual(restored, source); assert.equal(restored.id, seed.source.id);
  assert.deepEqual(Object.keys(JSON.parse(json)).sort(), ['id', 'matrix', 'occurrences', 'result', 'schemaVersion', 'vector']);
  const runtime = createMatrixVectorRuntime(restored);
  assert.deepEqual(columnExampleFromVectorProduct(runtime.explanation().product).combination.result.entries.map(numberOf), [2, 2]);
  runtime.dispose();
  assert.throws(() => serializeMatrixSnapshot(editMatrixVectorDocument(source, { kind: 'vector', field: 'x', text: '-' })), MathResourceGap);
});
test('storage validates view independently and rejects stale revisions without rewriting source', () => {
  for (const progress of [-1, 2, NaN, Infinity, '0']) assert.throws(() => readReferenceRecord({ ...seed, view: { ...seed.view, progress } }), MathResourceGap);
  assert.throws(() => readReferenceRecord({ ...seed, revision: -1 }), MathResourceGap);
  assert.throws(() => readReferenceRecord({ ...seed, extra: true }), MathResourceGap);
  assert.throws(() => replaceReference(seed, 1, seed), /another tab/);
  const next = replaceReference(seed, 0, { ...seed, view: { ...seed.view, progress: .5 } });
  assert.equal(next.revision, 1); assert.deepEqual(next.source, seed.source);
});
test('settling and replacing cannot save an old player into the new snapshot', async () => {
  const h = harness(); assert.equal(h.stored().revision, 0);
  h.cards[0]!.settled(.5); await h.session.idle(); assert.equal(h.stored().view.progress, .5);
  const source = editMatrixVectorDocument(seed.source, { kind: 'matrix', field: 'a00', text: '3' });
  await h.session.importFile(file(source)); assert.deepEqual(h.stored().source, source);
  assert.equal(h.stored().view.progress, 0); assert.equal(h.cards[0]!.disposed, 1);
  h.cards[0]!.settled(1); await h.session.idle(); assert.equal(h.stored().view.progress, 0);
  h.cards[1]!.settled(1); await h.session.idle(); assert.equal(h.stored().view.progress, 1);
  h.session.dispose(); h.session.dispose(); assert.equal(h.closed(), 1); assert.equal(h.cards[1]!.disposed, 1);
});
test('malformed, incomplete and unsupported paint preserve the last visible and saved card', async () => {
  const h = harness();
  for (const source of [{}, { ...fixture, schemaVersion: 9 },
    editMatrixVectorDocument(seed.source, { kind: 'matrix', field: 'a00', text: '-' }),
    editMatrixVectorDocument(seed.source, { kind: 'matrix', field: 'a00', text: '0.00000001' })]) {
    await h.session.importFile(file(source)); assert.deepEqual(h.stored(), seed); assert.equal(h.cards[0]!.disposed, 0);
  }
  assert.equal(h.errors.length, 4); assert.match(String(h.errors.at(-1)), /scientific notation/);
  await h.session.importFile({ name: 'large.json', size: 65537, text: async () => { throw new Error('Must not read'); } });
  assert.match(String(h.errors.at(-1)), /64 KiB/); h.session.dispose();
});
test('a slower file read cannot replace the newer request; disposal cancels pending reads', async () => {
  const h = harness(); let release = (_: string) => {};
  const delayed = new Promise<string>(resolve => { release = resolve; });
  const old = h.session.importFile({ name: 'old.json', size: 1, text: () => delayed });
  await h.session.importFile(file(seed.source, 'new.json')); release(JSON.stringify(seed.source)); await old;
  assert.equal(h.stored().view.filename, 'new.json'); assert.equal(h.cards.length, 2);
  let finish = (_: string) => {};
  const pending = h.session.importFile({ name: 'cancel.json', size: 1, text: () => new Promise(resolve => { finish = resolve; }) });
  h.session.dispose(); finish(JSON.stringify(seed.source)); await pending;
  assert.equal(h.stored().view.filename, 'new.json'); assert.equal(h.cards.length, 2);
});
test('storage failure or another tab keeps the visible card and disposes the candidate', async () => {
  for (const failure of ['failSave', 'conflict'] as const) {
    const h = harness(); h[failure](); await h.session.importFile(file(seed.source));
    assert.equal(h.cards[0]!.disposed, 0); assert.equal(h.cards[1]!.disposed, 1);
    assert.equal(h.cards[1]!.revealed, false); assert.equal(h.errors.length, 1);
    assert.equal(h.stored().view.filename, seed.view.filename); h.session.dispose();
  }
});
test('disposal during a pending transaction releases both presentations and cannot revive the host', async () => {
  let finish = () => {}, entered = () => {}, stored = seed;
  const pending = new Promise<void>(resolve => { entered = resolve; });
  const cards: { disposed: number; revealed: number }[] = [];
  const changes: ReferenceRecord[] = [], errors: unknown[] = [];
  const session = createReferenceSession({ change: fn => new Promise<void>((resolve, reject) => {
    finish = () => { try { stored = fn(stored); resolve(); } catch (error) { reject(error); } }; entered();
  }), close() {} }, seed, () => {
    const card = { disposed: 0, revealed: 0 }; cards.push(card);
    return { pause() {}, reveal() { card.revealed++; }, dispose() { card.disposed++; } };
  }, record => changes.push(record), error => errors.push(error));
  const imported = session.importFile(file(seed.source)); await pending; session.dispose(); finish(); await imported;
  assert.equal(stored.revision, 0); assert.deepEqual(cards, [{ disposed: 1, revealed: 1 }, { disposed: 1, revealed: 0 }]);
  assert.equal(changes.length, 1); assert.equal(errors.length, 0);
});
