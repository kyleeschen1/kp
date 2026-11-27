import assert from "node:assert/strict";
import test from "node:test";
import { prepareSaddleSection, readSaddleSectionSource, readSaddleSectionView, initialSectionView,
  sampleSaddleSection, createSectionPlayback, describeSaddleSection, type SaddleSectionSource } from "../src/animation-player/public-api.ts";
import { initialOccurrences, readReferenceState } from "../src/experiments/saddle-section-reference/state.ts";
import { resolveSectionFrame, sectionHeight } from "../src/experiments/direct-webgl-graph/section.ts";
import { resolveSectionFrame as sharedFrame } from "../src/animation-player/section-model.ts";

const source: SaddleSectionSource = { kind: "kp.saddle-section.v1", id: "test:section", denominator: 4, y: 1 };
function scheduler() {
  let now = 0, next = 0; const callbacks = new Map<number, (time: number) => void>();
  return { now: () => now, request(callback: (time: number) => void) { callbacks.set(++next, callback); return next; },
    cancel(handle: number) { callbacks.delete(handle); }, step(ms: number) { now += ms; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(now)); },
    pending: () => callbacks.size };
}
test("external sources/views reject unsupported data without choosing a substitute", () => {
  for (const invalid of [null, [], {}, { ...source, kind: "sphere" }, { ...source, extra: true }, { ...source, id: "<script>" },
    { ...source, y: NaN }, { ...source, y: 3.001 }, { ...source, denominator: Infinity }, { ...source, denominator: 3.99 }]) {
    assert.equal(readSaddleSectionSource(invalid).status, "repair-required");
  }
  for (const invalid of [null, { ...initialSectionView, inspection: 1.001 }, { ...initialSectionView, elevation: -76 },
    { ...initialSectionView, azimuth: NaN }, { ...initialSectionView, surplus: 1 }]) assert.equal(readSaddleSectionView(invalid).status, "repair-required");
  for (const denominator of [4, 8]) for (const y of [-3, 3]) assert.equal(readSaddleSectionSource({ ...source, denominator, y }).status, "ready");
  const inherited = Object.assign(Object.create(source), { a: 1, b: 2, c: 3, d: 4 });
  assert.equal(readSaddleSectionSource(inherited).status, "repair-required");
});
test("prepared authority is immutable, privately registered, and preserves the original section policy", () => {
  const mutable = { ...source }; const prepared = prepareSaddleSection(mutable); mutable.y = 2;
  assert.equal(prepared.source.y, 1); assert.ok(Object.isFrozen(prepared.source));
  assert.throws(() => sampleSaddleSection({ ...prepared }, initialSectionView), /Prepare/);
  assert.equal(resolveSectionFrame, sharedFrame);
  for (const y of [-3, -1, 0, 3]) for (const denominator of [4, 6, 8]) for (const inspection of [0, .2, .5, .99, 1]) {
    const frame = sampleSaddleSection(prepareSaddleSection({ ...source, y, denominator }), { ...initialSectionView, inspection });
    assert.equal(frame.vertex, sectionHeight(0, y, denominator));
    assert.deepEqual(frame.surface, sharedFrame({ y, inspection }, initialSectionView).surface);
    if (inspection === 1) assert.equal(frame.surface.kind, "absent");
    if (inspection === 0) assert.equal(frame.surface.kind, "slab");
  }
});
test("occurrences reverse independently, preserve saved cameras, and cancel all work on disposal", () => {
  const clock = scheduler(), prepared = prepareSaddleSection(source);
  const a = createSectionPlayback(prepared, { scheduler: clock }), b = createSectionPlayback(prepared, { scheduler: clock });
  a.setCamera(408, 33); a.play(); clock.step(800);
  assert.equal(a.snapshot().view.inspection, .5); assert.equal(b.snapshot().view.inspection, 0);
  a.play("rewind"); clock.step(800);
  assert.deepEqual(a.snapshot().frame.camera, { inspection: 0, azimuth: 408, elevation: 33 });
  a.seek(1); assert.equal(a.snapshot().frame.surface.kind, "absent");
  let paused = 0; const unsubscribe = a.subscribe(state => { if (state.status === "paused") paused++; });
  a.pause(); assert.equal(paused, 1); unsubscribe();
  a.updateSource(prepareSaddleSection({ ...source, y: -2, denominator: 8 }));
  assert.equal(a.snapshot().view.inspection, 1); assert.equal(b.snapshot().source.y, 1);
  assert.equal(a.snapshot().frame.vertex, -.5);
  const before = a.snapshot();
  assert.throws(() => a.updateSource(prepareSaddleSection({ ...source, id: "different" })), /identity/);
  assert.throws(() => a.seek(NaN)); assert.deepEqual(a.snapshot(), before);
  a.play("rewind"); b.play(); assert.equal(clock.pending(), 2);
  a.dispose(); a.dispose(); b.dispose(); assert.equal(clock.pending(), 0);
  assert.throws(() => a.snapshot(), /disposed/); assert.throws(() => a.seek(0), /disposed/);
});
test("reference URLs round trip precise source and view and reject malformed occurrences atomically", () => {
  assert.notEqual(initialOccurrences[0]!.source.id, initialOccurrences[1]!.source.id, "Editable copies retain distinct source identities");
  const input = [{ source: { ...source, denominator: 4.123456789, y: -1.7654321 }, view: { inspection: .567891, azimuth: 408, elevation: -15 } },
    { source, view: initialSectionView }];
  const decoded = readReferenceState(JSON.stringify(input)); assert.equal(decoded.status, "ready");
  if (decoded.status === "ready") assert.deepEqual(decoded.occurrences, input);
  assert.equal(describeSaddleSection(input[0]!.source), "y = -1.7654321 → z = (x² − (-1.7654321)²) / 4.123456789");
  for (const raw of ["{", "[]", JSON.stringify([input[0], { source: { ...source, denominator: 2 }, view: initialSectionView }])])
    assert.equal(readReferenceState(raw).status, "repair-required");
});
