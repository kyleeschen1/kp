import assert from "node:assert/strict";
import test from "node:test";

import {
  planKpMotionField,
  validateKpMotionFieldIntent,
  type KpMotionFieldIntent
} from "../src/animation/motion-field.ts";

const radicalIntent: KpMotionFieldIntent = {
  id: "motion-field.radical-notation",
  groupEntityIds: ["exponent.numerator", "exponent.bar", "exponent.denominator"],
  purpose: "representational-succession",
  sourceRegion: "upper-right",
  targetRegion: "center",
  readingDirection: "left-to-right",
  traversalDirection: "forward",
  cohesion: {
    anchorEntityIds: ["exponent.bar"],
    maximumSeparation: 0.2,
    maximumStaggerSpan: 0.18,
    preserveTokenOrder: true,
    maximumCrossings: 0,
    minimumVisibleMaterial: 0.25,
    exactTargetRegrouping: true
  }
};

test("representational succession prefers opposite-corner reconciliation", () => {
  const field = planKpMotionField(radicalIntent);
  assert.equal(field.curvatureFamily, "opposite-corner");
  assert.equal(field.reconciliationRegion, "target-opposite-corner");
  assert.equal(field.depthPlane, "foreground");
  assert.equal(field.pathCandidates[0], "opposite-corner");
  assert.equal(field.dominantDirection, "convergent");
});

test("continuant reflow remains restrained on the baseline plane", () => {
  const field = planKpMotionField({
    ...radicalIntent,
    id: "motion-field.continuant-x",
    groupEntityIds: ["x"],
    purpose: "continuant-reflow",
    sourceRegion: "center",
    targetRegion: "lower-right",
    cohesion: {
      ...radicalIntent.cohesion,
      anchorEntityIds: ["x"]
    }
  });
  assert.equal(field.curvatureFamily, "shortest-curvature");
  assert.equal(field.depthPlane, "baseline");
  assert.equal(field.dominantDirection, "diagonal");
});

test("semantic branches receive mirrored shared fields", () => {
  const field = planKpMotionField({
    ...radicalIntent,
    id: "motion-field.distribution",
    purpose: "semantic-branch"
  });
  assert.equal(field.branchSymmetry, "mirrored");
  assert.equal(field.curvatureFamily, "mirrored-branch-arcs");
  assert.deepEqual(field.pathCandidates, ["above", "below"]);
});

test("cohesion rejects anchors outside the semantic group", () => {
  assert.deepEqual(
    validateKpMotionFieldIntent({
      ...radicalIntent,
      cohesion: {
        ...radicalIntent.cohesion,
        anchorEntityIds: ["unrelated"]
      }
    }),
    [{
      path: "cohesion.anchorEntityIds",
      message: "Motion-field anchor unrelated is outside the group."
    }]
  );
});

test("motion fields reject arbitrary authored routing", () => {
  const imported = {
    ...radicalIntent,
    controlPoints: [{ x: 10, y: 20 }]
  } as KpMotionFieldIntent & { controlPoints: unknown };
  assert.deepEqual(
    validateKpMotionFieldIntent(imported)
      .filter((issue) => issue.message.includes("not allowed")),
    [
      {
        path: "$.controlPoints",
        message: "Arbitrary motion-field routing field controlPoints is not allowed."
      },
      {
        path: "$.controlPoints[0].x",
        message: "Arbitrary motion-field routing field x is not allowed."
      },
      {
        path: "$.controlPoints[0].y",
        message: "Arbitrary motion-field routing field y is not allowed."
      }
    ]
  );
});
