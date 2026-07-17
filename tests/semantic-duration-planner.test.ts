import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpSemanticDurationLaws,
  planKpSemanticDuration,
  sampleKpSemanticDurationPlan,
  type KpSemanticDurationAction,
  type KpSemanticDurationPlan
} from "../src/animation/semantic-duration-planner.ts";

test("up to five semantic actions each receive their full minimum duration", () => {
  const result = planKpSemanticDuration({
    id: "duration.five-actions",
    actions: actions(5)
  });
  assert.equal(result.status, "planned");
  if (result.status !== "planned") return;
  assert.equal(result.plan.policy, "full-sequence");
  assert.equal(result.plan.totalDurationMs, 5_000);
  assert.deepEqual(result.plan.segments.map((segment) => segment.durationMs),
    [1_000, 1_000, 1_000, 1_000, 1_000]);
  assert.deepEqual(evaluateKpSemanticDurationLaws(result.plan), []);
});

test("long semantic work cannot be silently accelerated without a policy", () => {
  const result = planKpSemanticDuration({
    id: "duration.six-actions",
    actions: actions(6)
  });
  assert.equal(result.status, "policy-required");
  assert.equal(result.diagnostics[0]?.code, "duration.policy-required");
  assert.match(result.diagnostics[0]?.message ?? "", /cannot be silently reduced/);
});

test("explicit long form preserves every action minimum", () => {
  const result = planKpSemanticDuration({
    id: "duration.long-form",
    actions: actions(8),
    longSequencePolicy: "long-form"
  });
  assert.equal(result.status, "planned");
  if (result.status !== "planned") return;
  assert.equal(result.plan.totalDurationMs, 8_000);
  assert.equal(result.plan.segments.length, 8);
  assert.equal(result.plan.compressionApplied, false);
});

test("pattern compression shows first two and final actions around one labeled sweep", () => {
  const result = planKpSemanticDuration({
    id: "duration.compressed",
    actions: actions(8, "matrix-row-dot"),
    longSequencePolicy: "pattern-compression",
    compression: {
      patternId: "matrix-row-dot",
      sweepMinimumDurationMs: 1_400
    }
  });
  assert.equal(result.status, "planned");
  if (result.status !== "planned") return;
  assert.deepEqual(result.plan.segments.map((segment) => segment.presentation), [
    "full-action",
    "full-action",
    "pattern-sweep",
    "full-action"
  ]);
  assert.deepEqual(result.plan.segments[2]?.representedActionIds, [
    "action.2", "action.3", "action.4", "action.5", "action.6"
  ]);
  assert.equal(result.plan.segments[2]?.disclosure, "explicit-repeated-pattern");
  assert.equal(result.plan.representedActionCount, 8);
  assert.equal(result.plan.compressedActionCount, 5);
  assert.equal(result.plan.totalDurationMs, 4_400);
  assert.deepEqual(evaluateKpSemanticDurationLaws(result.plan), []);

  const sweep = sampleKpSemanticDurationPlan({ plan: result.plan, elapsedMs: 2_700 });
  assert.equal(sweep.presentation, "pattern-sweep");
  assert.deepEqual(sweep.representedActionIds, result.plan.segments[2]?.representedActionIds);
});

test("compression rejects unproven repetition and invalid sweep minima", () => {
  const mismatch = planKpSemanticDuration({
    id: "duration.bad-pattern",
    actions: actions(7, "row-dot").map((action, index) =>
      index === 4 ? { ...action, repeatPatternId: "different-work" } : action
    ),
    longSequencePolicy: "pattern-compression",
    compression: { patternId: "row-dot", sweepMinimumDurationMs: 1_000 }
  });
  assert.equal(mismatch.status, "rejected");
  assert.equal(mismatch.diagnostics[0]?.code, "duration.compression-pattern-mismatch");

  const invalidMinimum = planKpSemanticDuration({
    id: "duration.bad-sweep",
    actions: actions(7, "row-dot"),
    longSequencePolicy: "pattern-compression",
    compression: { patternId: "row-dot", sweepMinimumDurationMs: 0 }
  });
  assert.equal(invalidMinimum.status, "rejected");
  assert.equal(invalidMinimum.diagnostics[0]?.code, "duration.compression-spec-required");
});

test("duration laws diagnose accelerated full actions and unmarked sweeps", () => {
  const result = planKpSemanticDuration({
    id: "duration.law-fixture",
    actions: actions(7, "repeat"),
    longSequencePolicy: "pattern-compression",
    compression: { patternId: "repeat", sweepMinimumDurationMs: 1_000 }
  });
  assert.equal(result.status, "planned");
  if (result.status !== "planned") return;
  const invalid: KpSemanticDurationPlan = {
    ...result.plan,
    segments: result.plan.segments.map((segment, index) => index === 0
      ? { ...segment, durationMs: 100 }
      : index === 2
        ? { ...segment, disclosure: "full", patternId: undefined }
        : segment)
  };
  const codes = evaluateKpSemanticDurationLaws(invalid).map((issue) => issue.code);
  assert.ok(codes.includes("duration.full-action-accelerated"));
  assert.ok(codes.includes("duration.unmarked-compression"));
});

function actions(count: number, repeatPatternId?: string): readonly KpSemanticDurationAction[] {
  return Array.from({ length: count }, (_value, semanticRank) => ({
    id: `action.${semanticRank}`,
    semanticRank,
    minimumDurationMs: 1_000,
    ...(repeatPatternId === undefined ? {} : { repeatPatternId })
  }));
}
