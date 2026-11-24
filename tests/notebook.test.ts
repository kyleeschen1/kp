import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexNotebook, uuid, type Node } from '../src/notebook/model.ts';
import { parseNotebook, parseWorkspace } from '../src/notebook/validation.ts';
import { transact } from '../src/notebook/transactions.ts';

const load = (name: string) => parseNotebook(JSON.parse(readFileSync(new URL(`../content/notebooks/${name}.json`, import.meta.url), 'utf8')));
export const fixtures = () => [load('shared-matrix'), load('compare-inputs')];
const id = (n: number) => uuid(`10000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
test('canonical JSON retains identities, metadata and nested structure across serialization', () => {
  const docs = fixtures(); assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(docs))), docs);
  const next = transact(docs[1]!, 0, [{ type: 'metadata', id: id(24), metadata: { 'kp:goal': { tags: ['compare'], folded: false } } }]);
  assert.deepEqual(parseNotebook(JSON.parse(JSON.stringify(next))), next);
  assert.equal(indexNotebook(next).nodes.size, indexNotebook(docs[1]!).nodes.size);
});
test('move and rename preserve subtree identity and unrelated data; stale edits cannot commit', () => {
  const doc = fixtures()[1]!; const before = JSON.stringify(doc);
  const next = transact(doc, 0, [{ type: 'move', id: id(26), parentId: doc.id }, { type: 'rename', id: id(26), title: 'Other input' }]);
  assert.equal(indexNotebook(next).parents.get(id(26)), doc.id);
  assert.equal(indexNotebook(next).parents.get(id(27)), id(26));
  assert.deepEqual(indexNotebook(next).nodes.get(id(25)), indexNotebook(doc).nodes.get(id(25)));
  assert.equal(JSON.stringify(doc), before);
  assert.throws(() => transact(next, 0, [{ type: 'delete', id: id(21) }]), /changed/);
});
test('invalid multi-operation transactions, cycles, invalid parents and anchors preserve the source', () => {
  const doc = fixtures()[1]!, before = JSON.stringify(doc);
  for (const op of [
    { type: 'move', id: id(24), parentId: id(26) },
    { type: 'move', id: id(26), parentId: id(22) },
    { type: 'move', id: id(26), parentId: doc.id, beforeId: id(25) },
    { type: 'move', id: id(26), parentId: doc.id, beforeId: id(26) },
    { type: 'move', id: id(26), parentId: id(999), beforeId: id(26) }
  ] as const) assert.throws(() => transact(doc, 0, [{ type: 'rename', id: id(24), title: 'Draft' }, op]));
  assert.equal(JSON.stringify(doc), before);
  const unchanged = transact(doc, 0, [{ type: 'move', id: id(26), parentId: id(24), beforeId: id(26) }]);
  assert.deepEqual(unchanged.children, doc.children);
});
test('duplicate remaps component input identities while preserving external object references', () => {
  const doc = fixtures()[0]!; let n = 100;
  const next = transact(doc, 0, [{ type: 'duplicate', id: id(5) }], () => id(n++));
  const copy = next.children.at(-1)!; assert.equal(copy.type, 'component');
  if (copy.type !== 'component') throw new Error('Expected component');
  assert.notEqual(copy.id, id(5)); assert.notEqual(copy.inputs[0]!.id, id(6));
  assert.deepEqual(copy.inputs[0]!.default, { notebookId: doc.id, nodeId: id(3) });
  const copiedScene = [...indexNotebook({ ...doc, children: [copy] }).nodes.values()].find(n => n.type === 'scene');
  assert.equal(copiedScene?.type, 'scene');
  if (copiedScene?.type === 'scene') assert.deepEqual(copiedScene.left, { kind: 'input', inputId: copy.inputs[0]!.id });
});
test('I/O rejects identity collisions, executable fields, unknown blocks and malformed numbers', () => {
  const doc = fixtures()[0]!;
  assert.throws(() => parseWorkspace([doc, doc]), /already owned/);
  assert.throws(() => parseNotebook({ ...doc, children: [doc.children[0], doc.children[0]] }), /Duplicate/);
  assert.throws(() => parseNotebook({ ...doc, children: [{ ...doc.children[0], type: 'untrusted-script', source: 'alert(1)' }] }), /Unsupported/);
  assert.throws(() => parseNotebook({ ...doc, children: [{ ...doc.children[1], rows: [[Infinity, 2], [3, 4]] }] }), /finite/);
  assert.throws(() => parseNotebook({ ...doc, children: [{ ...doc.children[1], metadata: { onclick: 'run' } }] }), /namespace/);
  let invoked = false;
  const accessor = { ...doc }; Object.defineProperty(accessor, 'title', { enumerable: true, get() { invoked = true; return 'Executable'; } });
  assert.throws(() => parseNotebook(accessor), /accessors/); assert.equal(invoked, false);
  const sparse = Array(2); sparse[1] = doc.children[0];
  assert.throws(() => parseNotebook({ ...doc, children: sparse }), /Sparse/);
});
test('duplicate remaps internal resource references within a copied subtree', () => {
  const doc = fixtures()[0]!;
  const container: Node = { id: id(50), type: 'section', title: 'Reusable bundle', metadata: {}, children: doc.children };
  const grouped = parseNotebook({ ...doc, children: [container] }); let n = 200;
  const next = transact(grouped, 0, [{ type: 'duplicate', id: id(50) }], () => id(n++));
  const copied = indexNotebook({ ...doc, children: [next.children[1]!] }).nodes;
  const component = [...copied.values()].find(n => n.type === 'component');
  if (component?.type !== 'component') throw new Error('Missing copied component');
  assert.ok(copied.has(component.inputs[0]!.default.nodeId));
  assert.notEqual(component.inputs[0]!.default.nodeId, id(3));
});
