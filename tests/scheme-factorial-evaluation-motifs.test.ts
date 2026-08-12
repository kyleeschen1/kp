import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSchemeFactorialEvaluationMotifs,
  sampleKpSchemeBranchMotif,
  sampleKpSchemePrimitiveMotif,
  sampleKpSchemeSummaryMotif
} from "../src/animation/scheme-factorial-evaluation-motifs.ts";
import { kpSchemeFactorialScore } from
  "../src/semantic/scheme-factorial-score.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const trace = readKpSchemeFactorialTraceArtifact().trace;
const motifs = compileKpSchemeFactorialEvaluationMotifs({
  trace,
  score: kpSchemeFactorialScore
});

test("branch motifs encode truth and collapse only the dormant branch", () => {
  assert.equal(motifs.branches.length, 4);
  assert.deepEqual(motifs.branches.map(({ branch }) => branch),
    ["alternative", "alternative", "alternative", "consequent"]);
  assert.ok(motifs.branches.every(({ selectedExpressionId,
    dormantExpressionId, dormantTreatment }) =>
    selectedExpressionId !== dormantExpressionId &&
    dormantTreatment === "collapse-to-particles"));
  const middle = sampleKpSchemeBranchMotif(0.6);
  assert.equal(middle.predicateEmphasis, 1);
  assert.ok(middle.selectedEmphasis > 0);
  assert.ok(middle.dormantParticleProgress > 0);
});

test("trusted primitives stay local and retain exact result lineage", () => {
  assert.deepEqual(new Set(motifs.primitives.map(({ primitive }) => primitive)),
    new Set(["=", "-", "*"]));
  assert.ok(motifs.primitives.every(({ expansion, argumentValueIds,
    resultValueId }) => expansion === "local-only" &&
    argumentValueIds.length === 2 && resultValueId.length > 0));
  const frame = sampleKpSchemePrimitiveMotif(0.8);
  assert.equal(frame.inputGatherProgress, 1);
  assert.ok(frame.resultRevealProgress > 0);
});

test("summary motif groups exact middle calls without accelerating events", () => {
  assert.equal(motifs.summary.representation, "stacked-recursion-rhythm");
  assert.equal(motifs.summary.callSuspensionEventIds.length, 2);
  assert.equal(motifs.summary.parameterBindingEventIds.length, 2);
  assert.ok(motifs.summary.eventIds.every((id) =>
    trace.events.some((event) => event.id === id)));
  assert.deepEqual(sampleKpSchemeSummaryMotif(motifs.summary, 0), {
    progress: 0,
    completedRepetitions: 0,
    activeRepetitionProgress: 0
  });
  assert.deepEqual(sampleKpSchemeSummaryMotif(motifs.summary, 1), {
    progress: 1,
    completedRepetitions: 2,
    activeRepetitionProgress: 1
  });
});

test("motifs cannot be mistaken for structural folding", () => {
  assert.ok(motifs.branches.every(({ kind }) => kind === "branch-decision"));
  assert.ok(motifs.primitives.every(({ kind }) =>
    kind === "trusted-local-reduction"));
  assert.equal(motifs.summary.kind, "semantic-summary");
  assert.doesNotMatch(JSON.stringify(motifs),
    /structural|parenthesis|membrane|fold|unfold/i);
});

test("all motif samplers are direct-seek and reverse stable", () => {
  for (const sample of [
    sampleKpSchemeBranchMotif,
    sampleKpSchemePrimitiveMotif
  ]) {
    const ascending = Array.from({ length: 101 }, (_, index) =>
      sample(index / 100));
    const descending = Array.from({ length: 101 }, (_, index) =>
      sample((100 - index) / 100)).reverse();
    assert.deepEqual(descending, ascending);
    assert.throws(() => sample(Number.NaN), /finite/);
  }
});
