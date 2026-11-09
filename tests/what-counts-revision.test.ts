import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { reviseWhatCountsReading } from '../scripts/what-counts-revision.ts';
import { compileWhatCountsLesson } from '../scripts/what-counts-reader-page.ts';
import { readWhatCountsArticle, readingDigest, registerWhatCountsReadings, whatCountsReadingsPath, whatCountsRoot } from '../scripts/what-counts-readings.ts';

function fixture(run: (root: string, draft: string) => void) {
  const scratch = resolve(whatCountsRoot, 'tmp/codex');
  mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(resolve(scratch, 'what-counts-revision-'));
  try {
    const raw = readFileSync(resolve(whatCountsRoot, whatCountsReadingsPath), 'utf8');
    for (const registration of registerWhatCountsReadings(JSON.parse(raw)).values()) {
      for (const revision of [registration, ...registration.previous ?? []]) {
        const file = resolve(root, revision.articlePath);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, readWhatCountsArticle(revision));
      }
    }
    const product = registerWhatCountsReadings(JSON.parse(raw)).get('product')!;
    const draft = readWhatCountsArticle(product, root);
    // Exercise the legacy-to-pinned upgrade even after the real candidate has
    // been saved through this workflow. Other registered readings stay intact.
    const registrations = JSON.parse(raw);
    registrations.product = { articlePath: 'content/authoring/algebra/what-counts-product.article.md',
      version: 'product.1', title: product.title, description: product.description };
    writeFileSync(resolve(root, registrations.product.articlePath), draft);
    writeFileSync(resolve(root, whatCountsReadingsPath), JSON.stringify(registrations, null, 2) + '\n');
    run(root, draft);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const registry = (root: string) => JSON.parse(readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'));
const render = (root: string, href: string) => compileWhatCountsLesson(href, registry(root), revision => readWhatCountsArticle(revision, root));
const tree = (root: string) => readdirSync(root, { recursive: true }).filter(path => typeof path === 'string').sort();
const check = (root: string, markdown: string) => reviseWhatCountsReading({ reading: 'product', markdown, mode: { kind: 'check' } }, root);
const apply = (root: string, markdown: string, expectedBasis = check(root, markdown).basis) =>
  reviseWhatCountsReading({ reading: 'product', markdown, mode: { kind: 'apply', expectedBasis } }, root);
const draftTwo = (draft: string) => draft + '\nKeep the count separate from the amount in one copy.\n';

test('selected readings are pinned and freezing the accepted readings preserves their exact HTML', () => {
  const selected = registry(whatCountsRoot);
  for (const [id, reading] of registerWhatCountsReadings(selected)) {
    assert.match(reading.sha256 ?? '', /^[a-f0-9]{64}$/);
    assert.ok(reading.articlePath.startsWith(`content/authoring/algebra/readings/${id}/`));
  }
  for (const [id, articlePath] of [
    ['whole', 'content/authoring/algebra/what-counts.article.md'],
    ['zero', 'content/authoring/algebra/what-counts-zero.article.md']
  ] as const) {
    const legacy = { ...selected, [id]: { ...selected[id], articlePath } };
    const url = '/reader/what-counts/?reading=' + id;
    const sameBytesAtLegacyPath = compileWhatCountsLesson(url, legacy, revision =>
      revision.articlePath === articlePath ? readWhatCountsArticle(selected[id]) : readWhatCountsArticle(revision));
    assert.ok(compileWhatCountsLesson(url, selected) === sameBytesAtLegacyPath,
      'Moving the source to a pinned snapshot must preserve HTML, anchors and hydration');
  }
});

test('checking does not select a draft; applying preserves exact prior readings and the default', () => fixture((root, draft) => {
  const beforeTree = tree(root), beforeRegistry = readFileSync(resolve(root, whatCountsReadingsPath), 'utf8');
  const original = render(root, '/reader/what-counts/');
  const saved = render(root, '/reader/what-counts/?kpVersion=1&kpProgress=333');
  const proposal = check(root, draftTwo(draft));
  assert.equal(proposal.status, 'checked');
  assert.deepEqual(tree(root), beforeTree);
  assert.equal(readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'), beforeRegistry);
  assert.throws(() => render(root, proposal.previewPath), /Unknown revision/);
  const applied = apply(root, draftTwo(draft), proposal.basis);
  assert.equal(applied.status, 'applied');
  assert.equal(applied.version, proposal.version);
  assert.match(render(root, applied.previewPath), /Keep the count separate/);
  assert.doesNotMatch(render(root, applied.previousPath), /Keep the count separate/);
  assert.equal(render(root, '/reader/what-counts/'), original);
  assert.equal(render(root, '/reader/what-counts/?kpVersion=1&kpProgress=333'), saved);
  assert.equal(registry(root).product.previous.at(-1).version, 'product.1');
  assert.ok(!tree(root).some(path => path.endsWith('.lock') || path.endsWith('.tmp')));
}));

test('invalid drafts and unknown semantic references leave the last valid selection intact', () => fixture((root, draft) => {
  const first = apply(root, draft);
  const before = readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'), paths = tree(root);
  const html = render(root, first.previewPath);
  for (const invalid of [
    '# No checked story\n',
    draft.replace('"beats": [', '"beats": broken ['),
    draft.replace(/("focusRefs":\s*\[\s*)"state.what-counts.repeated"/, '$1"state.foreign"'),
    draft.replace('passage.state.what-counts.collected', 'passage.missing-operation'),
    draft.replace('"progressPermille": 333', '"progressPermille": 500'),
    draft.replace('animation.composed-algebra-v2.7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61', 'animation.unknown'),
    'x'.repeat(100_001)
  ]) {
    assert.throws(() => check(root, invalid));
    assert.throws(() => apply(root, invalid, check(root, draftTwo(draft)).basis));
    assert.equal(readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'), before);
    assert.deepEqual(tree(root), paths);
    assert.equal(render(root, first.previewPath), html);
  }
}));

test('both registry edits and edits to legacy unpinned sources invalidate an outstanding proposal', () => fixture((root, draft) => {
  const proposal = check(root, draftTwo(draft));
  assert.throws(() => apply(root, draftTwo(draft) + '\nA different valid draft.\n', proposal.basis), /revision.stale/);
  const before = readFileSync(resolve(root, whatCountsReadingsPath), 'utf8');
  const changed = registry(root);
  changed.zero.description += ' Updated metadata.';
  writeFileSync(resolve(root, whatCountsReadingsPath), JSON.stringify(changed));
  assert.throws(() => apply(root, draftTwo(draft), proposal.basis), /revision.stale/);
  writeFileSync(resolve(root, whatCountsReadingsPath), before);
  writeFileSync(resolve(root, registry(root).product.articlePath), draft + '\nEdited elsewhere.\n');
  assert.throws(() => apply(root, draftTwo(draft), proposal.basis), /revision.stale/);
  assert.ok(!tree(root).some(path => path.endsWith('.lock')));
}));

test('selected snapshots are independent of the working draft, immutable, and checked on reload', () => fixture((root, draft) => {
  const draftPath = registry(root).product.articlePath;
  const first = apply(root, draft);
  const html = render(root, first.previewPath);
  writeFileSync(resolve(root, draftPath), '# Invalid working draft');
  assert.equal(render(root, first.previewPath), html);
  writeFileSync(resolve(root, registry(root).product.articlePath), draft + '\nAltered snapshot.\n');
  assert.throws(() => render(root, first.previewPath), /retained reading changed/);
  assert.throws(() => check(root, draftTwo(draft)), /retained reading changed/);
}));

test('unchanged bytes are idempotent and restoring an older revision keeps both exact addresses', () => fixture((root, draft) => {
  const first = apply(root, draft), firstHtml = render(root, first.previewPath);
  const initialPaths = tree(root), initialRegistry = readFileSync(resolve(root, whatCountsReadingsPath), 'utf8');
  assert.equal(apply(root, draft).status, 'unchanged');
  assert.deepEqual(tree(root), initialPaths);
  assert.equal(readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'), initialRegistry);
  const second = apply(root, draftTwo(draft));
  const restored = apply(root, draft);
  assert.equal(restored.version, first.version);
  assert.equal(render(root, restored.previewPath), firstHtml);
  assert.match(render(root, second.previewPath), /Keep the count separate/);
  assert.doesNotThrow(() => registerWhatCountsReadings(registry(root)));
}));

test('another writer keeps its lock and a snapshot collision cannot replace valid content', () => fixture((root, draft) => {
  const proposal = check(root, draftTwo(draft));
  const before = readFileSync(resolve(root, whatCountsReadingsPath), 'utf8');
  const lock = resolve(root, whatCountsReadingsPath + '.lock');
  writeFileSync(lock, 'another writer');
  assert.throws(() => apply(root, draftTwo(draft), proposal.basis), /revision.busy/);
  assert.equal(readFileSync(lock, 'utf8'), 'another writer');
  rmSync(lock);
  const path = resolve(root, `content/authoring/algebra/readings/product/${proposal.sourceSha256}.article.md`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'conflicting immutable bytes');
  assert.throws(() => apply(root, draftTwo(draft), proposal.basis), /revision.snapshot/);
  assert.equal(readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'), before);
  assert.equal(readFileSync(path, 'utf8'), 'conflicting immutable bytes');
  assert.ok(!tree(root).some(path => path.endsWith('.lock') || path.endsWith('.tmp')));
}));

test('a failure after writing the new snapshot removes only its own unselected file', () => fixture((root, draft) => {
  const proposal = check(root, draftTwo(draft));
  const before = readFileSync(resolve(root, whatCountsReadingsPath), 'utf8');
  const previous = resolve(root, `content/authoring/algebra/readings/product/${readingDigest(draft)}.article.md`);
  mkdirSync(dirname(previous), { recursive: true });
  writeFileSync(previous, 'conflicting prior snapshot');
  const paths = tree(root);
  assert.throws(() => apply(root, draftTwo(draft), proposal.basis), /revision.snapshot/);
  assert.deepEqual(tree(root), paths);
  assert.equal(readFileSync(resolve(root, whatCountsReadingsPath), 'utf8'), before);
  assert.equal(readFileSync(previous, 'utf8'), 'conflicting prior snapshot');
  assert.doesNotThrow(() => render(root, '/reader/what-counts/?reading=product'));
}));

test('metadata participates in version identity and old metadata remains at its old address', () => fixture((root, draft) => {
  const first = apply(root, draft);
  const input = { reading: 'product', markdown: draft, title: 'Counting copies of a whole', description: 'A revised description.' };
  const proposal = reviseWhatCountsReading({ ...input, mode: { kind: 'check' } }, root);
  const result = reviseWhatCountsReading({ ...input, mode: { kind: 'apply', expectedBasis: proposal.basis } }, root);
  assert.notEqual(result.version, first.version);
  assert.match(render(root, result.previewPath), /Counting copies of a whole/);
  assert.doesNotMatch(render(root, first.previewPath), /Counting copies of a whole/);
  assert.equal(result.sourceSha256, first.sourceSha256);
}));
