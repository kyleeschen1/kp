import assert from 'node:assert/strict';
import test from 'node:test';
import { Script } from 'node:vm';
import { compileWhatCountsLesson } from '../scripts/what-counts-reader-page.ts';
import { compactKpCompiledReaderHtml } from '../src/reader/compiler/compiled-reader-html.ts';
import { createReaderStartupHandoff } from '../src/reader/app/reader-startup-handoff.ts';

function harness() {
  const frames = new Map<number, () => void>();
  let next = 0, commits = 0;
  const handoff = createReaderStartupHandoff({
    requestFrame(callback) { frames.set(++next, callback); return next; },
    cancelFrame(id) { frames.delete(id); },
    commit() { commits++; }
  });
  const tick = () => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback());
  };
  return { handoff, tick, frames, commits: () => commits };
}

test('a restored location and a successful stable frame are both required before handoff', () => {
  const h = harness();
  h.handoff.rendered(); h.tick();
  assert.equal(h.commits(), 0);
  h.handoff.arm(); h.tick();
  assert.equal(h.commits(), 0);
  h.handoff.rendered();
  assert.equal(h.commits(), 0);
  h.tick();
  assert.equal(h.commits(), 1);
  h.handoff.arm(); h.handoff.rendered(); h.tick();
  assert.equal(h.commits(), 1);
});

test('font/viewport reservation invalidates even an already queued handoff', () => {
  const h = harness(); h.handoff.arm(); h.handoff.rendered();
  const stale = [...h.frames.values()][0]!;
  h.handoff.invalidate(); stale(); h.tick();
  assert.equal(h.commits(), 0);
  // A failed render never calls rendered; no timer can promote that surface.
  h.tick(); assert.equal(h.commits(), 0);
  h.handoff.rendered(); h.tick();
  assert.equal(h.commits(), 1);
});

test('continuous samples do not starve readiness, and disposal rejects late callbacks', () => {
  const h = harness(); h.handoff.arm();
  for (let index = 0; index < 30; index++) h.handoff.rendered();
  assert.equal(h.frames.size, 1); h.tick();
  assert.equal(h.commits(), 1);
  const abandoned = harness(); abandoned.handoff.arm(); abandoned.handoff.rendered();
  const stale = [...abandoned.frames.values()][0]!;
  abandoned.handoff.dispose(); stale(); abandoned.tick();
  abandoned.handoff.arm(); abandoned.handoff.rendered(); abandoned.tick();
  assert.equal(abandoned.commits(), 0);
});

test('compiled early layout is executable, bounded, and precedes enhancement', () => {
  const html = compileWhatCountsLesson();
  const code = html.match(/<script data-kp-document-layout>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(code);
  assert.ok(Buffer.byteLength(code) < 8_000, 'Critical layout must stay small; do not embed the compositor.');
  assert.doesNotThrow(() => new Script(code));
  const compacted = compactKpCompiledReaderHtml(html).match(/<script data-kp-document-layout>([\s\S]*?)<\/script>/)?.[1];
  assert.equal(compacted, code, 'Production HTML compaction must preserve embedded code bytes.');
  assert.ok(html.indexOf('data-kp-document-layout') < html.indexOf('type="module"'));
  // Both normal and exceptional paths release the small initial layout gate.
  assert.match(code, /finally\s*\{delete document\.documentElement\.dataset\.kpDocumentPreparing/);
});
