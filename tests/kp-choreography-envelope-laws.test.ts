import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpChoreographyEnvelopeLaws,
  kpChoreographyDependencyEdges
} from "../src/animation/choreography-envelope-laws.ts";
import type { KpChoreographyPlan } from "../src/animation/choreography-plan.ts";

test("envelope laws accept focus, reservation, ordered act, recognition, and mirrored rewind", () => {
  const plan = envelopePlan();
  assert.deepEqual(checkKpChoreographyEnvelopeLaws(plan), {
    lawId: "animation.choreography-envelope",
    passed: true,
    failures: []
  });
  assert.deepEqual(kpChoreographyDependencyEdges(plan, "rewind"), [
    { prerequisiteId: "release", dependentId: "settle" },
    { prerequisiteId: "settle", dependentId: "act" },
    { prerequisiteId: "act", dependentId: "reflow" },
    { prerequisiteId: "reflow", dependentId: "orient" }
  ]);
});

test("envelope laws report path-specific missing prerequisites", () => {
  const plan = envelopePlan();
  const activities = plan.activities.map((activity) => ({
    ...activity,
    prerequisiteCheckpointIds: []
  }));
  const phases = plan.phases.map((phase) => ({
    ...phase,
    prerequisiteCheckpointIds: []
  }));
  const result = checkKpChoreographyEnvelopeLaws({
    ...plan,
    activities,
    phases
  } as KpChoreographyPlan);
  assert.deepEqual(result.failures.map((failure) => failure.message), [
    "Continuant reflow activity.reflow requires reserved destination and transit space.",
    "Meaningful activity activity.act requires a focus-ready checkpoint before motion.",
    "Act activity activity.act must wait for reflow completion or declare governed causal overlap.",
    "Release must require a stable recognition checkpoint from settle."
  ]);
});

test("operation-specific act may declare governed overlap with reflow", () => {
  const plan = envelopePlan();
  const activities = plan.activities.map((activity) =>
    activity.id === "activity.act"
      ? {
          ...activity,
          prerequisiteCheckpointIds: ["checkpoint.focus"],
          governedOverlap: {
            withActivityId: "activity.reflow",
            reason: "The enclosure begins after x crosses readiness."
          }
        }
      : activity
  );
  const result = checkKpChoreographyEnvelopeLaws({
    ...plan,
    activities,
    phases: plan.phases.map((phase) =>
      phase.id === "act"
        ? {
            ...phase,
            prerequisiteCheckpointIds: ["checkpoint.focus"]
          }
        : phase
    )
  } as KpChoreographyPlan);
  assert.equal(result.passed, true);
});

function envelopePlan(): KpChoreographyPlan {
  const checkpoints = [
    cp("checkpoint.focus", "orient", "focus-ready", false),
    cp("checkpoint.reserved", "orient", "space-reserved", false),
    cp("checkpoint.reflow", "reflow", "phase-complete", false),
    cp("checkpoint.act", "act", "phase-complete", false),
    cp("checkpoint.recognition", "settle", "recognition", true),
    cp("checkpoint.neutral", "release", "neutral", true)
  ] as const;
  return {
    id: "plan.envelope-law",
    kind: "kp-choreography-plan",
    timelineRefId: "timeline.shared",
    vocabulary: {
      id: "vocabulary.envelope-law",
      continuants: [],
      representationalLineages: [],
      objectConstancy: [],
      materialContinuity: [],
      motionClassifications: [
        {
          id: "motion.accommodation",
          entityIds: ["x"],
          motionClass: "accommodation",
          reason: "Reflow."
        },
        {
          id: "motion.meaningful",
          entityIds: ["wrapper"],
          motionClass: "meaningful",
          reason: "Operation."
        }
      ]
    },
    phases: [
      phase("orient", [], "checkpoint.focus"),
      phase("reflow", ["orient"], "checkpoint.reflow", [
        "checkpoint.focus",
        "checkpoint.reserved"
      ]),
      phase("act", ["reflow"], "checkpoint.act", [
        "checkpoint.focus",
        "checkpoint.reflow"
      ]),
      phase("settle", ["act"], "checkpoint.recognition"),
      phase("release", ["settle"], "checkpoint.neutral", [
        "checkpoint.recognition"
      ])
    ],
    activities: [
      {
        id: "activity.reflow",
        phaseId: "reflow",
        kind: "move-continuant",
        entityIds: ["x"],
        summary: "Move x.",
        motionClassificationIds: ["motion.accommodation"],
        dependsOnActivityIds: [],
        prerequisiteCheckpointIds: ["checkpoint.reserved"]
      },
      {
        id: "activity.act",
        phaseId: "act",
        kind: "execute-operation",
        entityIds: ["wrapper"],
        summary: "Wrap x.",
        motionClassificationIds: ["motion.meaningful"],
        dependsOnActivityIds: [],
        prerequisiteCheckpointIds: [
          "checkpoint.focus",
          "checkpoint.reflow"
        ]
      }
    ],
    checkpoints
  } as KpChoreographyPlan;
}

function phase(
  id: "orient" | "reflow" | "act" | "settle" | "release",
  dependsOnPhaseIds: readonly ("orient" | "reflow" | "act" | "settle")[],
  completionCheckpointId: string,
  prerequisiteCheckpointIds: readonly string[] = []
) {
  return {
    id,
    mode: "active",
    activityIds:
      id === "reflow"
        ? ["activity.reflow"]
        : id === "act"
          ? ["activity.act"]
          : [`activity.${id}.placeholder`],
    dependsOnPhaseIds,
    prerequisiteCheckpointIds,
    completionCheckpointId
  } as const;
}

function cp(
  id: string,
  phaseId: "orient" | "reflow" | "act" | "settle" | "release",
  kind:
    | "focus-ready"
    | "space-reserved"
    | "phase-complete"
    | "recognition"
    | "neutral",
  stable: boolean
) {
  return { id, phaseId, kind, requirement: id, stable } as const;
}
