import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpCanonicalAnimationConstructionBudget,
  kpCanonicalAnimationConstructionBudget,
  findKpCanonicalDevelopmentArtifacts,
  type KpCanonicalAnimationConstructionBudgetMeasurement
} from "./check-canonical-animation-construction-budgets.ts";

test("canonical animation budgets accept every frozen maximum exactly", () => {
  assert.deepEqual(checkKpCanonicalAnimationConstructionBudget({
    budget: kpCanonicalAnimationConstructionBudget,
    measurement: measurement(kpCanonicalAnimationConstructionBudget)
  }), []);
});

test("canonical animation budgets report every independent regression", () => {
  const over = Object.fromEntries(
    Object.entries(kpCanonicalAnimationConstructionBudget).map(
      ([key, value]) => [key, value + 1]
    )
  ) as unknown as typeof kpCanonicalAnimationConstructionBudget;
  const issues = checkKpCanonicalAnimationConstructionBudget({
    budget: kpCanonicalAnimationConstructionBudget,
    measurement: measurement(over, ["assets/canonicalAnimationReview.js"])
  });

  assert.deepEqual(
    issues.map(({ metric }) => metric),
    [
      ...Object.keys(kpCanonicalAnimationConstructionBudget),
      "ordinaryReaderLeakFiles"
    ]
  );
});

function measurement(
  metrics: typeof kpCanonicalAnimationConstructionBudget,
  ordinaryReaderLeakFiles: readonly string[] = []
): KpCanonicalAnimationConstructionBudgetMeasurement {
  return {
    ...metrics,
    developmentArtifactLeaks: [],
    ordinaryReaderLeakFiles
  };
}

test("production review policy rejects development artifacts instead of requiring them", () => {
  assert.deepEqual(findKpCanonicalDevelopmentArtifacts({ "index.html": { file: "assets/main.js" } }), []);
  const leaks = findKpCanonicalDevelopmentArtifacts({
    "canonical-animation-review.html": { file: "assets/review.js" },
    "glyph-reconciliation-experiment.html": { file: "assets/glyph.js" }
  });
  assert.equal(leaks.length, 2);
  assert.deepEqual(checkKpCanonicalAnimationConstructionBudget({
    budget: kpCanonicalAnimationConstructionBudget,
    measurement: { ...measurement(kpCanonicalAnimationConstructionBudget), developmentArtifactLeaks: leaks }
  }).map(({ metric }) => metric), ["developmentArtifactLeaks"]);
});
