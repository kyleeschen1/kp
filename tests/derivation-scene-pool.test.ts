import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDerivationScenePool } from '../src/tutorial/mechanics-relations/derivation-scene-pool.ts';

function scene(cacheKey: string) {
  let disposed = 0, removed = 0;
  return { cacheKey, element: { hidden: false, remove() { removed++; }, removeAttribute(_name: string) {} },
    session: { dispose() { disposed++; } }, counts: () => ({ disposed, removed }) };
}
test('scene handoff has one idle owner and transfer never disposes the active successor', () => {
  const pool = createDerivationScenePool<ReturnType<typeof scene>>(2), a = scene('a');
  pool.put(a);
  assert.throws(() => pool.put(a));
  assert.equal(pool.take('a'), a);
  assert.equal(pool.take('a'), undefined);
  pool.clear(); assert.equal(a.counts().disposed, 0);
  pool.put(a); pool.clear(); pool.clear();
  assert.equal(a.counts().disposed, 1);
});
test('bounded retention disposes replacements and invalidated geometry exactly once', () => {
  const pool = createDerivationScenePool<ReturnType<typeof scene>>(2);
  const a = scene('a'), b = scene('b'), replacement = scene('a'), c = scene('c');
  pool.put(a); pool.put(b); pool.put(replacement);
  assert.equal(a.counts().disposed, 1);
  pool.put(c);
  assert.equal(replacement.counts().disposed, 1);
  assert.equal(pool.take('a'), undefined);
  pool.clear();
  assert.equal(b.counts().disposed, 1); assert.equal(c.counts().disposed, 1);
  for (const capacity of [0, -1, NaN, 1.5]) assert.throws(() => createDerivationScenePool(capacity));
});
test('page retirement also disposes outstanding paint leases returned later', () => {
  const pool = createDerivationScenePool<ReturnType<typeof scene>>(2), a = scene('a'), lease = scene('lease');
  pool.put(a); pool.close(); pool.put(lease); pool.close();
  assert.equal(a.counts().disposed, 1); assert.equal(lease.counts().disposed, 1);
  assert.equal(pool.take('lease'), undefined);
});
