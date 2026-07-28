import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpBalancedIntroductionPresentationPlan
} from "../src/animation/balanced-introduction-presentation-plan.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createKpEquationLinearRearrangementBinding
} from "../src/rendering/equation-linear-rearrangement-bindings.ts";
import {
  compileKpEquationOperationChoreography
} from "../src/reader/renderers/equation-operation-choreography-compiler.ts";

function balancedFixture() {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations[7]!;
  const choreography = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "append-after-shift",
    direction: "forward"
  });
  assert.equal(choreography?.kind, "synchronized-balanced-introduction");
  if (choreography?.kind !== "synchronized-balanced-introduction") {
    throw new Error("Expected synchronized balanced introduction.");
  }
  return { animation, transformation, choreography };
}

test("balanced introduction compiles two atomic target branches", () => {
  const { choreography } = balancedFixture();
  const beforeWindows = structuredClone(choreography.branchSchedule.windows);
  const plan = compileKpBalancedIntroductionPresentationPlan(choreography);

  assert.equal(plan.planKind, "synchronized-balanced-introduction");
  assert.deepEqual(choreography.branchSchedule.windows, beforeWindows);
  assert.deepEqual(
    plan.roles.bundles.map(({ role }) => role),
    ["target-material", "target-material"]
  );
  assert.equal(plan.roles.groups.length, 1);
  assert.equal(plan.roles.groups[0]?.groupKind, "branch");
  assert.deepEqual(
    plan.roles.groups[0]?.bundleIds,
    plan.roles.bundles.map(({ id }) => id)
  );
});

test("balanced introduction rejects non-atomic branch timing", () => {
  const { animation, transformation, choreography } = balancedFixture();
  const binding = createKpEquationLinearRearrangementBinding({
    animation,
    transformation
  });
  const sequential = binding?.branchSchedules?.sequential;
  assert.ok(sequential);
  if (sequential === undefined) return;

  assert.throws(
    () => compileKpBalancedIntroductionPresentationPlan({
      ...choreography,
      branchSchedule: sequential
    }),
    /requires one atomic together window/
  );
});
