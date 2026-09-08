import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { bindCodeReasoningEvidence, createCodeReasoningSource, captureCodeReasoningReturn, restoreCodeReasoningReturn, KpCodeReasoningRepairGap } from "../src/experiments/reusable-reasoning/code-evidence.ts";
import { createCodeReasoningNavigator } from "../src/experiments/reusable-reasoning/code-navigation.ts";
import { createKpReaderTimelinePlaybackClock } from "../src/reader/runtime/timeline-playback-clock.ts";

test("code reasoning retains language-owned identities, source bytes and bounded behavioral evidence", () => {
  const evidence = bindCodeReasoningEvidence();
  assert.equal(evidence.context.checkpointKind, "pedagogical-stage");
  assert.equal(evidence.context.steps.length, 7);
  assert.equal(evidence.context.sources.length, 2);
  assert.equal(evidence.context.certificate.scope, "declared-cases-only");
  assert.equal(evidence.context.certificate.cases.length, 3);
  assert.ok(evidence.context.certificate.cases.every(item => item.equivalent));
  for (const [index, step] of evidence.context.steps.entries()) {
    assert.equal(step.timelineProgress, evidence.runtime.score.stages[index]!.checkpointMs / evidence.runtime.score.durationMs);
    assert.ok(step.sourceBlockId.length > 0);
    assert.ok(step.html.length > 0);
  }
  for (const revision of evidence.context.sources) {
    assert.equal(revision, evidence.runtime.semantics.revisions.find(item => item.revisionId === revision.revisionId));
    for (const entity of revision.entities) assert.equal(entity.sourceRange.revisionId, revision.revisionId);
  }
});

test("code prose cannot reorder a language transformation or mint proof authority", () => {
  const source = createCodeReasoningSource();
  for (const bad of [{ ...source, stageIds: [...source.stageIds].reverse() }, { ...source, sourceRevisionId: "foreign" },
    { ...source, verified: true }, { ...source, geometry: {} }, { ...source, constructor: "foreign" }, { ...source, explanation: "" }]) {
    assert.throws(() => bindCodeReasoningEvidence(bad), KpCodeReasoningRepairGap);
  }
  const before = bindCodeReasoningEvidence(source);
  const after = bindCodeReasoningEvidence({ ...source, statement: "An editorial variation." });
  assert.notEqual(before.revisionId, after.revisionId);
  assert.deepEqual(before.context.certificate, after.context.certificate);
});

test("code extraction restores every exact handoff and fractional return but rejects foreign context", () => {
  const evidence = bindCodeReasoningEvidence();
  for (const progress of [...evidence.context.steps.map(step => step.timelineProgress), .271828]) {
    const position = captureCodeReasoningReturn(evidence, progress);
    assert.deepEqual(restoreCodeReasoningReturn(evidence, JSON.parse(JSON.stringify(position))), position);
    assert.throws(() => restoreCodeReasoningReturn(evidence, { ...position, stageId: "equation.state" }), KpCodeReasoningRepairGap);
    assert.throws(() => restoreCodeReasoningReturn(evidence, { ...position, revisionId: "foreign" }), KpCodeReasoningRepairGap);
  }
  assert.throws(() => captureCodeReasoningReturn(evidence, NaN), KpCodeReasoningRepairGap);
  const source = readFileSync(new URL("../src/experiments/reusable-reasoning/code-evidence.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:fraction|equation)|createKpReaderTimelinePlaybackClock|from ["']typescript["']/);
});

test("code navigation uses unequal authored checkpoints and revokes stale gesture authority", () => {
  const evidence = bindCodeReasoningEvidence();
  let now = 0, id = 0;
  const pending = new Map<number, (at: number) => void>();
  const clock = createKpReaderTimelinePlaybackClock({ id: "test.code-reasoning", durationMs: 14000,
    scheduler: { now: () => now, request: callback => { pending.set(++id, callback); return id; }, cancel: key => { pending.delete(key); } } });
  const navigation = createCodeReasoningNavigator(evidence, clock);
  for (const [index, step] of evidence.context.steps.entries()) {
    navigation.seek(index);
    assert.equal(clock.getSnapshot().progress, step.timelineProgress);
    assert.equal(navigation.position(), index);
  }
  const drag = navigation.begin(0); drag.update(2.37, 20);
  const before = clock.getSnapshot().progress;
  navigation.open(); navigation.returnToParent(); drag.finish(30, false);
  assert.equal(clock.getSnapshot().progress, before);
  navigation.seek(1); navigation.seek(2, true);
  now = 500; const frames = [...pending.values()]; pending.clear(); frames.forEach(frame => frame(now));
  assert.ok(clock.getSnapshot().progress > .16 && clock.getSnapshot().progress < .34);
  navigation.open(); assert.equal(pending.size, 0); navigation.returnToParent();
  const gesture = navigation.begin(now); gesture.update(.7, now + 20); navigation.dispose(); gesture.finish(now + 30);
  assert.equal(navigation.position(), .7);
  assert.throws(() => navigation.open(), /disposed/);
  clock.dispose();
});
