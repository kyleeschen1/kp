import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { uuid } from '../src/notebook/model.ts';
import { parseNotebook } from '../src/notebook/validation.ts';
import { resolveNotebook, flattenBlocks } from '../src/notebook/resolve.ts';
import { transact } from '../src/notebook/transactions.ts';
import { replaceNotebook } from '../src/notebook/persistence.ts';
const load = (name: string) => parseNotebook(JSON.parse(readFileSync(new URL(`../content/notebooks/${name}.json`, import.meta.url), 'utf8')));
const fixtures = () => [load('shared-matrix'), load('compare-inputs')];
const id = (n: number) => uuid(`10000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
const blocks = (docs = fixtures()) => flattenBlocks(resolveNotebook(docs, id(20)).blocks);
test('imports bind explicit resources and reuse the same canonical semantic object', () => {
  const scenes = blocks().filter(b => b.scene); assert.equal(scenes.length, 2);
  const [a, b] = scenes; assert.ok(a?.scene && b?.scene);
  assert.equal(a.scene.env.A, b.scene.env.A);
  assert.notEqual(a.key, b.key); assert.notEqual(a.scene.env.B, b.scene.env.B);
  assert.deepEqual(a.scene.combination.result.entries.map(v => v.expression.value), [4, 10]);
});
test('local input edits invalidate one scene; shared edits affect both; prose and reorder affect neither', () => {
  const docs = fixtures(), initial = blocks(docs).filter(b => b.scene);
  const changed = [docs[0]!, transact(docs[1]!, 0, [{ type: 'matrix', id: id(22), rows: [[3,0],[1,1]] }])];
  const after = blocks(changed).filter(b => b.scene);
  assert.notEqual(initial[0]!.signature, after[0]!.signature); assert.equal(initial[1]!.signature, after[1]!.signature);
  const shared = blocks([transact(docs[0]!, 0, [{ type: 'matrix', id: id(3), rows: [[2,2],[3,4]] }]), docs[1]!]).filter(b => b.scene);
  assert.ok(shared.every((b, i) => b.signature !== initial[i]!.signature));
  const moved = blocks([docs[0]!, transact(docs[1]!, 0, [{ type: 'move', id: id(26), parentId: id(20) }, { type: 'prose', id: id(21), text: 'New explanation' }])]).filter(b => b.scene);
  assert.deepEqual(moved.map(b => [b.key,b.signature]), initial.map(b => [b.key,b.signature]));
});
test('imports report deletion, wrong types, stale input IDs and cycles without silent fallback', () => {
  const docs = fixtures();
  const removed = blocks([transact(docs[0]!, 0, [{ type: 'delete', id: id(3) }]), docs[1]!]);
  assert.ok(removed.some(b => b.problem?.code === 'missing-reference'));
  const invalid = transact(docs[1]!, 0, [{ type: 'bind', id: id(25), inputId: id(7), source: { notebookId: id(20), nodeId: id(21) } }]);
  assert.ok(blocks([docs[0]!, invalid]).some(b => b.problem?.code === 'binding-type'));
  const stale = transact(docs[1]!, 0, [{ type: 'bind', id: id(25), inputId: id(999), source: { notebookId: id(20), nodeId: id(22) } }]);
  assert.ok(blocks([docs[0]!, stale]).some(b => b.problem?.code === 'unknown-input'));
  const cyclic = transact(docs[0]!, 0, [{ type: 'insert', parentId: id(5), node: { id: id(100), type: 'import', title: 'Recursive', metadata: {}, source: { notebookId: id(1), nodeId: id(5) }, policy: 'live', bindings: {} } }]);
  assert.ok(blocks([cyclic, docs[1]!]).some(b => b.problem?.code === 'reference-cycle'));
});
test('moving a scene outside its component produces an explicit unbound-input diagnostic', () => {
  const docs = fixtures(), moved = transact(docs[0]!, 0, [{ type: 'move', id: id(9), parentId: id(1) }]);
  const resolved = flattenBlocks(resolveNotebook([moved, docs[1]!], id(1)).blocks);
  assert.equal(resolved.find(b => b.node.id === id(9))?.problem?.code, 'unbound-input');
});
test('workspace compare-and-swap rejects stale replacements and identity collisions', () => {
  const docs = fixtures(), edited = transact(docs[1]!, 0, [{ type: 'rename', id: id(24), title: 'New title' }]);
  const saved = replaceNotebook(docs, 0, edited);
  assert.equal(saved[1]!.revision, 1); assert.deepEqual(saved[0], docs[0]);
  assert.throws(() => replaceNotebook(saved, 0, edited), /changed/);
  assert.throws(() => replaceNotebook(saved, null, docs[1]!), /changed/);
  assert.deepEqual(blocks(JSON.parse(JSON.stringify(saved))).map(b => b.key), blocks(saved).map(b => b.key));
});
