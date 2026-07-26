import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpCanonicalAnimationConstructionBudget,
  kpCanonicalAnimationConstructionBudget,
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
    reviewFiles: ["assets/canonicalAnimationReview.js"],
    ordinaryReaderLeakFiles
  };
}
