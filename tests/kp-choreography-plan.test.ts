import assert from "node:assert/strict";
import test from "node:test";

import {
  activeKpChoreographyPhase,
  createKpChoreographyPlan,
  noOpKpChoreographyPhase,
  validateKpChoreographyPlan,
  type KpChoreographyPlan
} from "../src/animation/choreography-plan.ts";
import type { KpChoreographyVocabulary } from "../src/animation/choreography-vocabulary.ts";

const vocabulary: KpChoreographyVocabulary = {
  id: "vocabulary.function-wrap",
  continuants: [
    {
      id: "continuant.wrap.x",
      meaning: "x persists as the wrapped argument.",
      relation: "role-change",
      source: { entityId: "source.x", selectorIds: ["source.x"] },
      target: { entityId: "target.x", selectorIds: ["target.x"] },
      identityAuthority: {
        kind: "canonical-operation",
        operationId: "kp.core.wrap",
        bindingId: "binding.argument"
      }
    }
  ],
  representationalLineages: [],
  objectConstancy: [
    {
      id: "constancy.wrap.x",
      continuantId: "continuant.wrap.x",
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind"]
    }
  ],
  materialContinuity: [
    {
      id: "material.wrap.x",
      mode: "continuant-motion",
      sourceEntityIds: ["source.x"],
      targetEntityIds: ["target.x"],
      authorityRef: { kind: "continuant", continuantId: "continuant.wrap.x" },
      summary: "x moves continuously into argument position."
    }
  ],
  motionClassifications: [
    {
      id: "motion.wrap.focus",
      entityIds: ["source.x"],
      motionClass: "attention",
      reason: "Preview the causal argument."
    },
    {
      id: "motion.wrap.reflow",
      entityIds: ["source.x", "target.x"],
      motionClass: "accommodation",
      reason: "Move x into the reserved argument slot."
    },
    {
      id: "motion.wrap.act",
      entityIds: ["target.wrapper"],
      motionClass: "meaningful",
      reason: "The wrapper communicates function application."
    }
  ]
};

const checkpoints = [
  checkpoint("checkpoint.orient.ready", "orient", "focus-ready", false),
  checkpoint("checkpoint.reflow.complete", "reflow", "phase-complete", false),
  checkpoint("checkpoint.act.complete", "act", "phase-complete", false),
  checkpoint("checkpoint.settle.recognized", "settle", "recognition", true),
  checkpoint("checkpoint.release.neutral", "release", "neutral", true)
] as const;

const activities = [
  activity("activity.orient.focus", "orient", "focus", ["source.x"], [
    "motion.wrap.focus"
  ]),
  activity(
    "activity.reflow.x",
    "reflow",
    "move-continuant",
    ["continuant.wrap.x"],
    ["motion.wrap.reflow"]
  ),
  activity(
    "activity.act.wrap",
    "act",
    "execute-operation",
    ["target.wrapper"],
    ["motion.wrap.act"]
  ),
  activity(
    "activity.settle.hold",
    "settle",
    "recognition-hold",
    ["target.x", "target.wrapper"],
    []
  ),
  activity(
    "activity.release.focus",
    "release",
    "release-attention",
    ["target.x"],
    []
  )
] as const;

function validPlan(): KpChoreographyPlan {
  return createKpChoreographyPlan({
    id: "choreography.function-wrap",
    timelineRefId: "timeline.generated.function-wrap.shared",
    vocabulary,
    phases: [
      activeKpChoreographyPhase({
        id: "orient",
        activityIds: ["activity.orient.focus"],
        completionCheckpointId: "checkpoint.orient.ready"
      }),
      activeKpChoreographyPhase({
        id: "reflow",
        activityIds: ["activity.reflow.x"],
        dependsOnPhaseIds: ["orient"],
        prerequisiteCheckpointIds: ["checkpoint.orient.ready"],
        completionCheckpointId: "checkpoint.reflow.complete"
      }),
      activeKpChoreographyPhase({
        id: "act",
        activityIds: ["activity.act.wrap"],
        dependsOnPhaseIds: ["reflow"],
        prerequisiteCheckpointIds: ["checkpoint.reflow.complete"],
        completionCheckpointId: "checkpoint.act.complete"
      }),
      activeKpChoreographyPhase({
        id: "settle",
        activityIds: ["activity.settle.hold"],
        dependsOnPhaseIds: ["act"],
        prerequisiteCheckpointIds: ["checkpoint.act.complete"],
        completionCheckpointId: "checkpoint.settle.recognized"
      }),
      activeKpChoreographyPhase({
        id: "release",
        activityIds: ["activity.release.focus"],
        dependsOnPhaseIds: ["settle"],
        prerequisiteCheckpointIds: ["checkpoint.settle.recognized"],
        completionCheckpointId: "checkpoint.release.neutral"
      })
    ],
    activities,
    checkpoints
  });
}

test("universal choreography plan carries five semantic phases on one timeline", () => {
  const plan = validPlan();
  assert.equal(plan.kind, "kp-choreography-plan");
  assert.equal(plan.timelineRefId, "timeline.generated.function-wrap.shared");
  assert.deepEqual(
    plan.phases.map((phase) => phase.id),
    ["orient", "reflow", "act", "settle", "release"]
  );
  assert.deepEqual(validateKpChoreographyPlan(plan), []);
});

test("mandatory phases may be explicit justified no-ops", () => {
  const plan = validPlan();
  const phases = plan.phases.map((phase) =>
    phase.id === "orient"
      ? noOpKpChoreographyPhase({
          id: "orient",
          reason: "The causal entity is already perceptually dominant.",
          completionCheckpointId: "checkpoint.orient.ready"
        })
      : phase
  );
  assert.deepEqual(validateKpChoreographyPlan({ ...plan, phases }), []);
});

test("plan validation rejects missing or reordered envelope phases", () => {
  const plan = validPlan();
  const issues = validateKpChoreographyPlan({
    ...plan,
    phases: plan.phases.slice(1)
  });
  assert.deepEqual(issues[0], {
    path: "phases",
    message:
      "Choreography phases must be exactly orient, reflow, act, settle, release in that order."
  });
});

test("plan validation requires explicit no-op reasons and valid checkpoints", () => {
  const plan = validPlan();
  const invalidNoOp = {
    ...noOpKpChoreographyPhase({
      id: "orient",
      reason: "",
      completionCheckpointId: "checkpoint.missing"
    })
  };
  const issues = validateKpChoreographyPlan({
    ...plan,
    phases: [invalidNoOp, ...plan.phases.slice(1)]
  });
  assert.ok(issues.some((issue) => issue.path === "phases[0].noOpReason"));
  assert.ok(
    issues.some((issue) => issue.path === "phases[0].completionCheckpointId")
  );
});

test("semantic plans reject coordinates, keyframes, and a second timing system", () => {
  const plan = validPlan();
  const imported = {
    ...plan,
    keyframes: [{ x: 12, y: 4 }],
    durationMs: 900
  } as KpChoreographyPlan & {
    keyframes?: unknown;
    durationMs?: number;
  };
  const issues = validateKpChoreographyPlan(imported);
  assert.deepEqual(
    issues.filter((issue) => issue.message.includes("not allowed")),
    [
      {
        path: "$.keyframes",
        message: "Concrete choreography instruction keyframes is not allowed."
      },
      {
        path: "$.keyframes[0].x",
        message: "Concrete choreography instruction x is not allowed."
      },
      {
        path: "$.keyframes[0].y",
        message: "Concrete choreography instruction y is not allowed."
      },
      {
        path: "$.durationMs",
        message: "Concrete choreography instruction durationMs is not allowed."
      }
    ]
  );
});

function checkpoint(
  id: string,
  phaseId: "orient" | "reflow" | "act" | "settle" | "release",
  kind:
    | "focus-ready"
    | "phase-complete"
    | "recognition"
    | "neutral",
  stable: boolean
) {
  return {
    id,
    phaseId,
    kind,
    requirement: `${id} requirement`,
    stable
  } as const;
}

function activity(
  id: string,
  phaseId: "orient" | "reflow" | "act" | "settle" | "release",
  kind:
    | "focus"
    | "move-continuant"
    | "execute-operation"
    | "recognition-hold"
    | "release-attention",
  entityIds: readonly string[],
  motionClassificationIds: readonly string[]
) {
  return {
    id,
    phaseId,
    kind,
    entityIds,
    summary: `${id} summary`,
    motionClassificationIds,
    dependsOnActivityIds: [],
    prerequisiteCheckpointIds: []
  } as const;
}
