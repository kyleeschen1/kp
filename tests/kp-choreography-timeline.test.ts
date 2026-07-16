import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpChoreographyTimeline,
  sampleKpChoreographyTimeline
} from "../src/animation/choreography-timeline.ts";
import type { KpChoreographyPlan } from "../src/animation/choreography-plan.ts";

test("timeline compiles the envelope onto one normalized shared clock", () => {
  const timeline = compileKpChoreographyTimeline({
    id: "timeline.choreography",
    plan: plan()
  });
  assert.equal(timeline.sharedTimelineRefId, "timeline.animation.shared");
  assert.deepEqual(timeline.phases.map((phase) => phase.phaseId), [
    "orient", "reflow", "act", "settle", "release"
  ]);
  assert.equal(timeline.phases[0]?.start, 0);
  assert.equal(timeline.phases[4]?.end, 1);
  assert.ok(timeline.phases[0]!.readinessAt > timeline.phases[0]!.start);
  assert.ok(timeline.phases[3]!.recognitionAt! < timeline.phases[3]!.end);
});

test("direct seek is stateless and rewind mirrors semantic progress", () => {
  const timeline = compileKpChoreographyTimeline({
    id: "timeline.choreography",
    plan: plan()
  });
  const first = sampleKpChoreographyTimeline({ timeline, progress: 0.37 });
  const second = sampleKpChoreographyTimeline({ timeline, progress: 0.37 });
  const rewind = sampleKpChoreographyTimeline({
    timeline,
    progress: 0.63,
    direction: "rewind"
  });
  assert.deepEqual(first, second);
  assert.equal(rewind.semanticProgress, first.semanticProgress);
  assert.deepEqual(rewind.activePhaseIds, first.activePhaseIds);
});

test("act overlaps reflow only when the plan declares governed overlap", () => {
  const sequential = compileKpChoreographyTimeline({
    id: "timeline.sequential",
    plan: plan()
  });
  const governedPlan = plan();
  const governed = compileKpChoreographyTimeline({
    id: "timeline.governed",
    plan: {
      ...governedPlan,
      activities: governedPlan.activities.map((activity) =>
        activity.id === "activity.act"
          ? {
              ...activity,
              governedOverlap: {
                withActivityId: "activity.reflow",
                reason: "The enclosure begins after readiness."
              }
            }
          : activity
      )
    }
  });
  const sequentialReflow = sequential.phases.find((phase) => phase.phaseId === "reflow")!;
  const sequentialAct = sequential.phases.find((phase) => phase.phaseId === "act")!;
  const governedReflow = governed.phases.find((phase) => phase.phaseId === "reflow")!;
  const governedAct = governed.phases.find((phase) => phase.phaseId === "act")!;
  assert.equal(sequentialAct.start, sequentialReflow.end);
  assert.ok(governedAct.start < governedReflow.end);
});

test("compound attention bridge begins only after recognition", () => {
  const timeline = compileKpChoreographyTimeline({
    id: "timeline.compound",
    plan: plan(),
    attentionBridgeTargetId: "next.operation.focus"
  });
  const recognition = timeline.phases.find((phase) => phase.phaseId === "settle")!.recognitionAt!;
  assert.equal(timeline.attentionBridge?.start, recognition);
  assert.equal(
    sampleKpChoreographyTimeline({
      timeline,
      progress: recognition
    }).attentionBridgeActive,
    true
  );
});

function plan(): KpChoreographyPlan {
  const phase = (
    id: "orient" | "reflow" | "act" | "settle" | "release",
    activityId: string,
    checkpointId: string
  ) => ({
    id,
    mode: "active" as const,
    activityIds: [activityId],
    dependsOnPhaseIds: [],
    prerequisiteCheckpointIds: [],
    completionCheckpointId: checkpointId
  });
  const activity = (
    id: string,
    phaseId: "orient" | "reflow" | "act" | "settle" | "release"
  ) => ({
    id,
    phaseId,
    kind:
      phaseId === "orient" ? "focus" as const :
      phaseId === "reflow" ? "move-continuant" as const :
      phaseId === "act" ? "execute-operation" as const :
      phaseId === "settle" ? "recognition-hold" as const :
      "release-attention" as const,
    entityIds: [phaseId],
    summary: phaseId,
    motionClassificationIds: [],
    dependsOnActivityIds: [],
    prerequisiteCheckpointIds: []
  });
  const checkpoint = (
    id: string,
    phaseId: "orient" | "reflow" | "act" | "settle" | "release",
    kind: "focus-ready" | "space-reserved" | "phase-complete" | "recognition" | "neutral",
    stable = false
  ) => ({ id, phaseId, kind, requirement: id, stable });
  return {
    id: "plan.timeline",
    kind: "kp-choreography-plan",
    timelineRefId: "timeline.animation.shared",
    vocabulary: {
      id: "vocabulary.timeline",
      continuants: [],
      representationalLineages: [],
      objectConstancy: [],
      materialContinuity: [],
      motionClassifications: []
    },
    phases: [
      phase("orient", "activity.orient", "checkpoint.focus"),
      phase("reflow", "activity.reflow", "checkpoint.reflow"),
      phase("act", "activity.act", "checkpoint.act"),
      phase("settle", "activity.settle", "checkpoint.recognition"),
      phase("release", "activity.release", "checkpoint.neutral")
    ],
    activities: [
      activity("activity.orient", "orient"),
      activity("activity.reflow", "reflow"),
      activity("activity.act", "act"),
      activity("activity.settle", "settle"),
      activity("activity.release", "release")
    ],
    checkpoints: [
      checkpoint("checkpoint.focus", "orient", "focus-ready"),
      checkpoint("checkpoint.space", "orient", "space-reserved"),
      checkpoint("checkpoint.reflow", "reflow", "phase-complete"),
      checkpoint("checkpoint.act", "act", "phase-complete"),
      checkpoint("checkpoint.recognition", "settle", "recognition", true),
      checkpoint("checkpoint.neutral", "release", "neutral", true)
    ]
  };
}
