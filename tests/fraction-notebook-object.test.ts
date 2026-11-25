import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fractionObject, previewFractionObject } from '../src/fraction-notebook/object-compile.ts';
import { allowsObjectParent, objectProtocol, readObjectRequest, sourceLimit } from '../src/fraction-notebook/object-protocol.ts';

const canonical = readFileSync(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
test('object descriptor is stable, revisioned, preview-only and uses canonical identities', () => {
  const object = fractionObject(canonical);
  assert.deepEqual(fractionObject(canonical), object);
  assert.deepEqual(object.capabilities, ['preview']);
  assert.notEqual(fractionObject(canonical + '\n').revision, object.revision);
  assert.equal(fractionObject(canonical + '\n').id, object.id);
  const original = previewFractionObject(object, canonical);
  const steps = JSON.parse(object.source);
  steps.steps[1].content = 'Inspect the shared denominator.';
  const next = previewFractionObject({ ...object, source: JSON.stringify(steps) }, canonical);
  assert.equal(next.beats[1]!.content, 'Inspect the shared denominator.');
  assert.deepEqual(next.beats.map(b => [b.id, b.progressPermille]), original.beats.map(b => [b.id, b.progressPermille]));
  assert.deepEqual(next.notebook.cells.map(c => c.id), original.notebook.cells.map(c => c.id));
});
test('object boundary rejects stale bases, foreign IDs, invalid targets and oversized source', () => {
  const object = fractionObject(canonical), steps = JSON.parse(object.source);
  steps.steps[0].focusRefs = ['invented.target'];
  assert.throws(() => previewFractionObject({ ...object, source: JSON.stringify(steps) }, canonical));
  assert.throws(() => previewFractionObject(object, canonical + '\n'), /revision changed/);
  assert.throws(() => previewFractionObject({ ...object, id: 'other' }, canonical), /Unknown/);
  assert.throws(() => previewFractionObject({ ...object, source: 'x'.repeat(sourceLimit + 1) }, canonical), /limit/);
  assert.throws(() => previewFractionObject({ ...object, source: '{}' }, canonical));
  assert.doesNotThrow(() => previewFractionObject(object, canonical));
});
test('wire boundary requires bounded session and ordered request identities and explicit origins', () => {
  const request = { protocol: objectProtocol, kind: 'preview', session: 'session-1', request: 1, ...fractionObject(canonical) };
  assert.equal(readObjectRequest(request)?.kind, 'preview');
  for (const bad of [null, [], { ...request, protocol: 'other' }, { ...request, session: '' },
    { ...request, request: 0 }, { ...request, request: 1.5 }, { ...request, source: 'x'.repeat(sourceLimit + 1) }]) {
    assert.equal(readObjectRequest(bad), undefined);
  }
  assert.equal(readObjectRequest({ ...request, kind: 'cancel' })?.kind, 'cancel');
  assert.equal(allowsObjectParent('http://127.0.0.1:1426'), true);
  for (const origin of ['null', 'http://127.0.0.1:1426.evil.test', 'https://evil.test', 'http://127.0.0.1:9999']) assert.equal(allowsObjectParent(origin), false);
});
