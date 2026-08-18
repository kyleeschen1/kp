import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpBothSidesCausalRecipe
} from "../src/animation/both-sides-causal-recipe.ts";
import {
  kpCanonicalLogExponentSymbolMotionPlans
} from "../src/animation/log-exponent-symbol-motion.ts";
import {
  compileKpRegisteredBothSidesCausalBinding
} from "../src/animation/registered-both-sides-causal-binding.ts";
import {
  kpBothSidesOperationRegistrationRegistry
} from "../src/semantic/both-sides-operation-registration.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../src/semantic/log-exponent-transformation-tree.ts";

test("apply-log and log-base division register as data-only operations", () => {
  assert.deepEqual(
    kpBothSidesOperationRegistrationRegistry.entries.slice(4).map((entry) => ({
      id: entry.id,
      operationKind: entry.operationKind,
      selection: entry.applicationSelection.kind
    })),
    [
      {
        id: "applyNaturalLogBothSides",
        operationKind: "apply-injective-function",
        selection: "introduced-targets"
      },
      {
        id: "divideBothSidesByLogBase",
        operationKind: "divide",
        selection: "correspondence-records"
      }
    ]
  );
});

test("canonical wrap motion carries shared injective-function causality", () => {
  const plan = kpCanonicalLogExponentSymbolMotionPlans[0]!;
  const binding = plan.bothSidesCausalBinding!;
  assert.equal(binding.operation.operation.kind, "apply-injective-function");
  assert.equal(
    binding.operation.domainEvidence.kind,
    "injective-function-domain"
  );
  assert.equal(plan.functionWrapInvocationGroup?.branches.length, 2);
  assert.deepEqual(binding.recipe.phases[1].applications, [
    {
      side: "lhs",
      entityIds: [
        "logged.left.log",
        "logged.left.log.operator",
        "logged.left.log.open",
        "logged.left.log.close"
      ]
    },
    {
      side: "rhs",
      entityIds: ["logged.right.log", "logged.right.log.operator"]
    }
  ]);
});

test("log-base division binds the same divisor across its two occurrences", () => {
  const extraction = kpCanonicalLogExponentSymbolMotionPlans[1]!;
  const division = kpCanonicalLogExponentSymbolMotionPlans[2]!;
  const binding = division.bothSidesCausalBinding!;
  assert.equal(extraction.bothSidesCausalBinding, undefined);
  assert.equal(binding.operation.operation.kind, "divide");
  assert.equal(binding.operation.domainEvidence.kind, "nonzero-operand");
  assert.deepEqual(binding.recipe.phases[1].applications, [
    { side: "lhs", entityIds: ["extracted.left.log"] },
    { side: "rhs", entityIds: ["solved.denominator.log"] }
  ]);
  assert.deepEqual(
    division.contract.rigidCompounds.map(({ id }) => id),
    [
      "motion-unit.transformation.log-exponent.divide-by-log-base.log-seven",
      "motion-unit.transformation.log-exponent.divide-by-log-base.log-two"
    ]
  );
});

test("logarithmic causal projection rewinds exactly and fails on domain drift", () => {
  const operation = kpCanonicalLogExponentTransformationTree.operations[0]!;
  const branchRoles = Object.freeze({
    ...operation.sourceRoles.branchByOccurrenceId,
    ...operation.targetRoles.branchByOccurrenceId
  });
  const forward = compileKpRegisteredBothSidesCausalBinding({
    transformation: operation.transformation,
    branchRoles,
    direction: "forward"
  })!;
  const rewind = compileKpBothSidesCausalRecipe({
    operation: forward.operation,
    direction: "rewind"
  });
  assert.deepEqual(forward.recipe.phases[0].branches, rewind.phases[3].branches);
  assert.throws(
    () => compileKpRegisteredBothSidesCausalBinding({
      transformation: {
        ...operation.transformation,
        assumptions: ["assumption.log-exponent.power-positive"]
      },
      branchRoles,
      direction: "forward"
    }),
    /lacks assumption assumption.log-exponent.right-positive/
  );
});
