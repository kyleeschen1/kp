import assert from "node:assert/strict";
import test from "node:test";

import { kpEquationAnimationCapabilityPlan } from
  "../src/architecture/equation-animation-capability-plan.ts";
import { kpCalculusBcSymbolicMathematicsTaxonomy } from
  "../src/architecture/symbolic-mathematics-capability-taxonomy.ts";
import { finiteBinderExpansionPreflight } from
  "./fixtures/finite-binder-expansion-preflight.ts";

test("finite binder expansion has one narrow planned authority boundary", () => {
  const capability = kpEquationAnimationCapabilityPlan.entries.find(({ id }) =>
    id === finiteBinderExpansionPreflight.capabilityId
  );

  assert.ok(capability);
  assert.equal(capability.title, "Finite sum and product expansion");
  assert.equal(
    capability.scope.authorityId,
    "family.equation.finite-binder-expansion.v1"
  );
  assert.deepEqual(
    capability.requirements.map(({ id }) => id),
    finiteBinderExpansionPreflight.requirementIds
  );
  assert.doesNotMatch(
    capability.requirements.map(({ summary }) => summary).join(" "),
    /differential|derivative|integral|calculus/iu
  );
});

test("finite binders belong to sequences while calculus stays separate", () => {
  const sequences = kpCalculusBcSymbolicMathematicsTaxonomy.groups.find(
    ({ id }) => id === "sequences-series"
  );
  const calculus = kpCalculusBcSymbolicMathematicsTaxonomy.groups.find(
    ({ id }) => id === "calculus-operators"
  );

  assert.ok(sequences?.capabilityIds.includes(
    finiteBinderExpansionPreflight.capabilityId
  ));
  assert.equal(calculus?.capabilityIds.includes(
    finiteBinderExpansionPreflight.capabilityId
  ), false);
  assert.deepEqual(calculus?.capabilityIds, [
    "capability.equation.differentiation-transformations",
    "capability.equation.integration-transformations"
  ]);
});
