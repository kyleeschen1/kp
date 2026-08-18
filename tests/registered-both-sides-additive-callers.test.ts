import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from
  "../src/animation/linear-solve-adapter.ts";
import {
  kpEquationLinearRearrangementKindForTransformType
} from "../src/animation/equation-linear-rearrangement-kind.ts";
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

test("add and subtract register through one data-only operation pack", () => {
  assert.deepEqual(
    kpBothSidesOperationRegistrationRegistry.ids.slice(0, 2),
    ["addBothSides", "subtractBothSides"]
  );
  assert.deepEqual(
    kpBothSidesOperationRegistrationRegistry.entries.slice(0, 2)
      .map((entry) => ({
        id: entry.id,
        operationKind: entry.operationKind,
        lawId: entry.lawId
      })),
    [
      {
        id: "addBothSides",
        operationKind: "add",
        lawId: "law.equation.add-both-sides"
      },
      {
        id: "subtractBothSides",
        operationKind: "subtract",
        lawId: "law.equation.subtract-both-sides"
      }
    ]
  );
  assert.equal(
    containsExecutableValue(kpBothSidesOperationRegistrationRegistry),
    false
  );
});

function containsExecutableValue(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (Array.isArray(value)) return value.some(containsExecutableValue);
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).some(containsExecutableValue);
}

test("canonical subtraction binding carries the shared recipe without paint drift", () => {
  const animation = createLinearSolveAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "subtractBothSides"
  )!;
  const binding = createKpEquationLinearRearrangementBinding({
    animation,
    transformation
  })!;
  assert.equal(binding.kind, "balanced-introduction");
  assert.equal(binding.branchSchedule?.strategy.kind, "together");
  assert.deepEqual(
    binding.branchSchedule?.operation.branches.map(({ id, entityIds }) => ({
      id,
      entityIds
    })),
    [
      {
        id: "lhs",
        entityIds: ["equation.linear-solve.after-subtract.lhs.minus3"]
      },
      {
        id: "rhs",
        entityIds: [
          "equation.linear-solve.after-subtract.rhs.minus",
          "equation.linear-solve.after-subtract.rhs.3"
        ]
      }
    ]
  );
  assert.equal(
    binding.bothSidesCausalBinding?.recipe.operationKind,
    "subtract"
  );
  assert.deepEqual(
    binding.bothSidesCausalBinding?.recipe.phases.map(({ id }) => id),
    [
      "prepare-branches",
      "synchronize-application",
      "preserve-relation",
      "settle-branches"
    ]
  );
});

test("generated addition compiles the same recipe in both directions", () => {
  const fixture = createGeneratedAlgebraTutorialFixture(
    "generated.linear-solve.z-minus-4"
  );
  const transformation = fixture.transformations.find(
    ({ transformType }) => transformType === "addBothSides"
  )!;
  const forward = compileKpRegisteredBothSidesCausalBinding({
    transformation,
    direction: "forward"
  })!;
  const rewind = compileKpRegisteredBothSidesCausalBinding({
    transformation,
    direction: "rewind"
  })!;
  assert.equal(
    kpEquationLinearRearrangementKindForTransformType("addBothSides"),
    "balanced-introduction"
  );
  assert.equal(forward.operation.operation.kind, "add");
  assert.equal(forward.recipe.phases[1].action, "apply");
  assert.equal(rewind.recipe.phases[1].action, "withdraw");
  assert.deepEqual(
    forward.recipe.phases[1].applications,
    rewind.recipe.phases[1].applications
  );
});

test("registered additive callers fail closed on law or branch drift", () => {
  const fixture = createGeneratedAlgebraTutorialFixture(
    "generated.linear-solve.z-minus-4"
  );
  const transformation = fixture.transformations.find(
    ({ transformType }) => transformType === "addBothSides"
  )!;
  assert.throws(
    () => compileKpRegisteredBothSidesCausalBinding({
      transformation: {
        ...transformation,
        lawRefs: [{ id: "law.equation.subtract-both-sides", level: "strict" }]
      },
      direction: "forward"
    }),
    /lacks strict law.equation.add-both-sides authority/
  );
});
