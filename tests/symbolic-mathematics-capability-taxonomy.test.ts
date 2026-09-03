import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationTransformationCoverage } from
  "../src/architecture/animation-transformation-coverage.ts";
import { kpEquationAnimationCapabilityPlan } from
  "../src/architecture/equation-animation-capability-plan.ts";
import {
  kpCalculusBcSymbolicMathematicsTaxonomy
} from "../src/architecture/symbolic-mathematics-capability-taxonomy.ts";

test("Calculus BC taxonomy is an ordered projection of canonical capabilities", () => {
  assert.deepEqual(
    kpCalculusBcSymbolicMathematicsTaxonomy.groups.map(({ id }) => id),
    [
      "algebra-functions",
      "trigonometric-syntax",
      "inequalities-piecewise",
      "sequences-series",
      "limits",
      "calculus-operators",
      "polar-parametric",
      "differential-equations",
      "taylor-series"
    ]
  );
  const canonicalIds = new Set(
    kpEquationAnimationCapabilityPlan.entries.map(({ id }) => id)
  );
  for (const group of kpCalculusBcSymbolicMathematicsTaxonomy.groups) {
    assert.ok(group.capabilityIds.length > 0, group.id);
    for (const capabilityId of group.capabilityIds) {
      assert.ok(canonicalIds.has(capabilityId), `${group.id}: ${capabilityId}`);
    }
  }
});

test("new curriculum capability rows retain their evidence-derived maturity", () => {
  const coverage = createKpAnimationTransformationCoverage();
  for (const capabilityId of [
    "capability.equation.trigonometric-transformations",
    "capability.equation.piecewise-transformations",
    "capability.equation.sequence-series-transformations",
    "capability.equation.limit-transformations",
    "capability.equation.differentiation-transformations",
    "capability.equation.polar-parametric-transformations",
    "capability.equation.differential-equation-transformations",
    "capability.equation.taylor-series-transformations"
  ]) {
    const entry = coverage.entries.find((candidate) =>
      candidate.capabilityId === capabilityId
    );
    assert.equal(entry?.status, "Missing", capabilityId);
    assert.equal(entry?.requirements.every(({ evidenceSourceIds }) =>
      evidenceSourceIds.length === 0
    ), true, capabilityId);
  }

  const integration = coverage.entries.find(({ capabilityId }) =>
    capabilityId === "capability.equation.integration-transformations"
  );
  assert.equal(integration?.status, "Exemplar");
  assert.ok(integration?.requirements.some(({ evidenceSourceIds }) =>
    evidenceSourceIds.length > 0
  ));
});

test("curriculum declarations do not duplicate capability authority IDs", () => {
  const curriculumCapabilityIds = new Set(
    kpCalculusBcSymbolicMathematicsTaxonomy.groups.flatMap(
      ({ capabilityIds }) => capabilityIds
    )
  );
  const authorityOwners = new Map<string, string>();
  for (const entry of kpEquationAnimationCapabilityPlan.entries) {
    if (!curriculumCapabilityIds.has(entry.id)) continue;
    const previous = authorityOwners.get(entry.scope.authorityId);
    assert.equal(previous, undefined,
      `${entry.scope.authorityId} is shared by ${previous} and ${entry.id}`);
    authorityOwners.set(entry.scope.authorityId, entry.id);
  }
});
