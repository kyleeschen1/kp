import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { bindCodeReasoningEvidence, createCodeReasoningSource, captureCodeReasoningReturn, restoreCodeReasoningReturn, KpCodeReasoningRepairGap } from "../src/experiments/reusable-reasoning/code-evidence.ts";

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
    { ...source, verified: true }, { ...source, geometry: {} }, { ...source, explanation: "" }]) {
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
