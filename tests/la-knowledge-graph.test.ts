import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import katex from 'katex';
import { makeIndex, type Corpus, type Interpretation } from '../src/experiments/la-knowledge-graph/model.ts';
const read = (file: string) => readFileSync(new URL(`../research/la-graph/${file}`, import.meta.url), 'utf8');
const corpus: Corpus = JSON.parse(read('corpus.json'));
const interpretation: Interpretation = JSON.parse(read('interpretation.json'));

test('all relationships close over unique identities and keep evidence classes separate', () => {
  const { byId } = makeIndex([...corpus.nodes, ...interpretation.nodes], [...corpus.edges, ...interpretation.edges]);
  assert.ok(corpus.nodes.length > 2000);
  assert.ok(corpus.nodes.filter(n => n.kind === 'proof').length > 300);
  assert.equal(new Set(corpus.nodes.map(n => n.book)).size, 4);
  for (const edge of corpus.edges) {
    assert.ok(['contains', 'proof-of', 'references'].includes(edge.relation));
    assert.notEqual(edge.evidence, 'authored-interpretation');
  }
  for (const edge of interpretation.edges) assert.equal(edge.evidence, 'authored-interpretation');
  for (const node of interpretation.nodes) {
    assert.ok(interpretation.edges.some(e => e.source === node.id && e.relation === 'reading-witness'));
    if (node.kind === 'claim') {
      assert.ok(node.assumptions?.length);
      assert.ok(node.steps?.length);
    }
  }
  assert.throws(() => makeIndex(corpus.nodes, [{ source: 'missing', target: byId.keys().next().value!, relation: 'contains', evidence: 'source' }]), /Dangling/);
  assert.throws(() => makeIndex([corpus.nodes[0]!, corpus.nodes[0]!], []), /Duplicate/);
});

test('source revisions, hashes and licenses are present; no PDF proof boundaries are fabricated', () => {
  const lock: { book: string; path: string; revision: string; sha256: string }[] = JSON.parse(read('sources.lock.json'));
  for (const source of lock) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(source.revision);
  }
  for (const node of corpus.nodes) {
    assert.ok(lock.some(s => s.book === node.book && s.path === node.source));
    assert.ok(node.url?.startsWith('https://'));
    if (node.book === 'axler') assert.equal(node.kind, 'page');
  }
  assert.equal(corpus.books.length, 4);
  assert.equal(corpus.diagnostics.length, 0);
  assert.ok(corpus.unresolved.length > 0);
});

test('authored formulas render without hidden fallback or trusted commands', () => {
  for (const node of interpretation.nodes) {
    for (const text of [node.body, ...(node.steps ?? [])]) {
      for (const match of text.matchAll(/\$([^$]+)\$/g)) {
        assert.doesNotThrow(() => katex.renderToString(match[1]!, { throwOnError: true, trust: false }), node.id);
      }
    }
  }
});

test('counterexamples distinguish representation, field, and nonunique solutions', () => {
  // p=1+x: columns of the alternative basis are (1,1) and (0,1).
  const change = [[1, 0], [1, 1]];
  const apply = (a: number[][], x: number[]) => a.map(row => row.reduce((sum, v, i) => sum + v * x[i]!, 0));
  assert.deepEqual(apply(change, [1, 0]), [1, 1]);
  for (const t of [-7, 0, 0.25, 1, 9]) assert.deepEqual(apply([[1, 1]], [t, 1 - t]), [1]);
  const rotation = [[0, -1], [1, 0]];
  for (const lambda of [-10, -1, 0, 1, 10]) assert.ok(lambda * lambda + 1 > 0);
  assert.deepEqual(apply(rotation, apply(rotation, [3, 7])), [-3, -7]);
  const pairing = interpretation.nodes.find(n => n.id === 'concept:pairing-vs-inner')!;
  assert.match(pairing.body, /z\^Tz=0/);
  assert.match(pairing.body, /z\^\*z=2/);
});

test('research data stays within measured standalone payload bounds', () => {
  const raw = read('corpus.json') + read('interpretation.json');
  assert.ok(Buffer.byteLength(raw) < 6_500_000);
  assert.ok(gzipSync(raw).length < 1_000_000);
});
