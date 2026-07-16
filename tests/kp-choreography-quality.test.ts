import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpChoreographyQuality,
  type KpChoreographyQualitySample
} from "../src/animation/choreography-quality.ts";

const calm: KpChoreographyQualitySample[] = [
  sample(0, { focusReadiness: 0, reflowProgress: 0 }),
  sample(0.2, { focusReadiness: 0.7, reflowProgress: 0.4 }),
  sample(0.4, { focusReadiness: 1, reflowProgress: 1, actProgress: 0.1 }),
  sample(0.7, {
    focusReadiness: 1,
    reflowProgress: 1,
    actProgress: 1,
    materialContinuity: 0.8
  }),
  sample(0.9, {
    focusReadiness: 1,
    reflowProgress: 1,
    actProgress: 1,
    stableCheckpoint: true
  }),
  sample(1, {
    focusReadiness: 1,
    reflowProgress: 1,
    actProgress: 1,
    stableCheckpoint: true
  })
];

test("calm phase-ordered choreography passes measurable gates", () => {
  const report = evaluateKpChoreographyQuality({ samples: calm });
  assert.equal(report.passedAutomatedGates, true);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.calibrationSource, "dashboard-exemplar-baseline-v0");
});

test("quality diagnostics cover perceptual order and exact settlement", () => {
  const report = evaluateKpChoreographyQuality({
    samples: [
      sample(0, {}),
      sample(0.5, {
        focusReadiness: 0.2,
        explanatorySalience: 0,
        reflowProgress: 0.5,
        actProgress: 0.4,
        eliminationProgress: 0.2,
        causeLegibility: 0.1,
        groupSeparation: 0.9,
        maximumGroupSeparation: 0.3,
        materialContinuity: 0.1
      }),
      sample(1, {
        focusReadiness: 1,
        reflowProgress: 1,
        actProgress: 1,
        residualTransform: 0.2,
        residualDeformation: 0.1,
        speed: 0.3,
        stableCheckpoint: true
      })
    ]
  });
  assert.equal(report.passedAutomatedGates, false);
  assert.deepEqual(report.diagnostics.map((item) => item.code), [
    "choreography.focus-lead",
    "choreography.attention-gap",
    "choreography.premature-act",
    "choreography.premature-elimination",
    "choreography.cohesion",
    "choreography.material-continuity",
    "choreography.residual-transform",
    "choreography.residual-deformation",
    "choreography.endpoint-stillness"
  ]);
});

test("automated quality reports retain an explicit human review requirement", () => {
  const report = evaluateKpChoreographyQuality({ samples: calm });
  assert.equal(report.subjectiveReviewRequired, true);
  assert.ok(report.humanReviewRubric.includes("organic-coherence"));
  assert.ok(report.humanReviewRubric.includes("typographic-integrity"));
  assert.ok(report.humanReviewRubric.includes("visual-restraint"));
});

test("declared causal overlap is not misreported as premature act", () => {
  const report = evaluateKpChoreographyQuality({
    samples: [
      sample(0, {}),
      sample(0.5, {
        focusReadiness: 0.8,
        reflowProgress: 0.8,
        actProgress: 0.2,
        governedReflowActOverlap: true
      })
    ]
  });
  assert.equal(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "choreography.premature-act"
    ),
    false
  );
});

function sample(
  progress: number,
  override: Partial<KpChoreographyQualitySample>
): KpChoreographyQualitySample {
  return {
    progress,
    focusReadiness: 0,
    explanatorySalience: 1,
    reflowProgress: 0,
    actProgress: 0,
    governedReflowActOverlap: false,
    eliminationProgress: 0,
    causeLegibility: 1,
    groupSeparation: 0.1,
    maximumGroupSeparation: 0.4,
    residualTransform: 0,
    residualDeformation: 0,
    speed: 0,
    materialContinuity: 1,
    stableCheckpoint: false,
    ...override
  };
}
