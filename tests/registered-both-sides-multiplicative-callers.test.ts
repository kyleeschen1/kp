import assert from "node:assert/strict";
import test from "node:test";

import {
  createDivideBothSidesEquationAnimationAsset
} from "../src/animation/divide-both-sides-equation-adapter.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../src/animation/fractional-linear-equation-adapter.ts";
import {
  compileKpRegisteredBothSidesCausalBinding
} from "../src/animation/registered-both-sides-causal-binding.ts";
import {
  kpBothSidesOperationRegistrationRegistry
} from "../src/semantic/both-sides-operation-registration.ts";
import {
  createGeneratedAlgebraTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import {
  createKpEquationLinearRearrangementBinding
} from "../src/rendering/equation-linear-rearrangement-bindings.ts";

test("multiply and divide register through one data-only operation pack", () => {
  assert.deepEqual(
    kpBothSidesOperationRegistrationRegistry.entries.slice(2).map((entry) => ({
      id: entry.id,
      operationKind: entry.operationKind,
      lawId: entry.lawId,
      evidenceId: "nonzeroEvidenceId" in entry
        ? entry.nonzeroEvidenceId
        : undefined
    })),
    [
      {
        id: "multiplyBothSides",
        operationKind: "multiply",
        lawId: "law.equation.multiply-both-sides",
        evidenceId: "assumption.equality.multiply-operand-nonzero"
      },
      {
        id: "divideBothSides",
        operationKind: "divide",
        lawId: "law.equation.divide-both-sides",
        evidenceId: "assumption.equality.divide-operand-nonzero"
      }
    ]
  );
});

test("multiplication adopts shared causality without changing its branch schedule", () => {
  const animation = createFractionalLinearEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "multiplyBothSides"
  )!;
  const binding = createKpEquationLinearRearrangementBinding({
    animation,
    transformation
  })!;
  assert.equal(binding.kind, "balanced-introduction");
  assert.equal(binding.branchSchedule, undefined);
  assert.equal(
    binding.bothSidesCausalBinding?.recipe.operationKind,
    "multiply"
  );
  assert.equal(
    binding.bothSidesCausalBinding?.operation.domainEvidence.kind,
    "nonzero-operand"
  );
  assert.deepEqual(
    binding.bothSidesCausalBinding?.recipe.phases[1].applications,
    [
      {
        side: "lhs",
        entityIds: [
          "equation.fractional-linear.multiplied.lhs.multiplier.2",
          "equation.fractional-linear.multiplied.lhs.left-paren",
          "equation.fractional-linear.multiplied.lhs.right-paren"
        ]
      },
      {
        side: "rhs",
        entityIds: [
          "equation.fractional-linear.multiplied.rhs.multiplier.2",
          "equation.fractional-linear.multiplied.rhs.product"
        ]
      }
    ]
  );
});

test("division keeps structural fraction entry caller-local", () => {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "divideBothSides"
  )!;
  const binding = createKpEquationLinearRearrangementBinding({
    animation,
    transformation
  })!;
  assert.equal(binding.kind, "divide-both-sides");
  assert.equal(binding.branchSchedule, undefined);
  assert.equal(binding.bothSidesCausalBinding?.recipe.operationKind, "divide");
  assert.deepEqual(
    binding.bothSidesCausalBinding?.recipe.phases[1].applications,
    [
      {
        side: "lhs",
        entityIds: [
          "equation.divide-both-sides.divided.lhs.fraction.denominator.3",
          "equation.divide-both-sides.divided.lhs.fraction.rule"
        ]
      },
      {
        side: "rhs",
        entityIds: [
          "equation.divide-both-sides.divided.rhs.fraction.denominator.3",
          "equation.divide-both-sides.divided.rhs.fraction.rule"
        ]
      }
    ]
  );
});

test("generated division has total correspondence and exact rewind", () => {
  const fixture = createGeneratedAlgebraTutorialFixture(
    "generated.linear-solve.three-x"
  );
  const transformation = fixture.transformations.find(
    ({ transformType }) => transformType === "divideBothSides"
  )!;
  const applications = transformation.correspondenceMap!.records
    .filter(({ relation }) => relation === "introduction")
    .flatMap(({ targetSelectorIds }) => targetSelectorIds);
  const forward = compileKpRegisteredBothSidesCausalBinding({
    transformation,
    applicationEntityIds: applications,
    direction: "forward"
  })!;
  const rewind = compileKpRegisteredBothSidesCausalBinding({
    transformation,
    applicationEntityIds: applications,
    direction: "rewind"
  })!;
  assert.equal(forward.recipe.phases[1].action, "apply");
  assert.equal(rewind.recipe.phases[1].action, "withdraw");
  assert.deepEqual(
    forward.recipe.phases[0].branches,
    rewind.recipe.phases[3].branches
  );
});

test("multiplicative registration fails closed without nonzero evidence", () => {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "divideBothSides"
  )!;
  const applications = transformation.correspondenceMap!.records
    .filter(({ relation }) => relation === "introduction")
    .flatMap(({ targetSelectorIds }) => targetSelectorIds);
  assert.throws(
    () => compileKpRegisteredBothSidesCausalBinding({
      transformation: { ...transformation, assumptions: [] },
      applicationEntityIds: applications,
      direction: "forward"
    }),
    /lacks a nonzero operand assumption/
  );
});
