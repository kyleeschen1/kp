import assert from "node:assert/strict";
import test from "node:test";

import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";
import { kpEquationAnimationCapabilityPlan } from
  "../src/architecture/equation-animation-capability-plan.ts";

const expectedCrossDomainIds = Object.freeze([
  "capability.matrix.vector-composition",
  "capability.matrix.matrix-composition",
  "capability.matrix.linear-map-geometry",
  "capability.code.typescript-refactoring",
  "capability.code.python-refactoring",
  "capability.code.scheme-structural-evaluation",
  "capability.graph-2d.function-transformations",
  "capability.graph-2d.model-transformations",
  "capability.graph-3d.scene-transformations"
] as const);

test("cross-domain capabilities follow the exact equation order", () => {
  const equationCount = kpEquationAnimationCapabilityPlan.entries.length;
  assert.deepEqual(
    kpAnimationCapabilityPlan.entries.slice(0, equationCount).map(({ id }) => id),
    kpEquationAnimationCapabilityPlan.entries.map(({ id }) => id)
  );
  assert.deepEqual(
    kpAnimationCapabilityPlan.entries.slice(equationCount).map(({ id }) => id),
    expectedCrossDomainIds
  );
  assert.deepEqual(
    kpAnimationCapabilityPlan.entries.map(({ order }) => order),
    kpAnimationCapabilityPlan.entries.map((_, index) => index + 1)
  );
});

test("each non-equation capability requires its domain-owned frontend", () => {
  for (const entry of kpAnimationCapabilityPlan.entries) {
    if (entry.domain === "equation") continue;
    const frontendRequirements = entry.requirements.filter(
      ({ kind }) => kind === "domain-frontend"
    );
    assert.equal(frontendRequirements.length, 1, entry.id);
    assert.ok(
      frontendRequirements[0]?.authorityId.startsWith(`frontend.${entry.domain}.`),
      `${entry.id} must name a ${entry.domain} frontend`
    );
  }
});

test("shared planning does not invent cross-domain semantic authority", () => {
  for (const entry of kpAnimationCapabilityPlan.entries) {
    assert.notEqual(entry.scope.authorityId, "family.animation.universal.v1");
    for (const requirement of entry.requirements) {
      assert.equal(requirement.authorityId.startsWith("frontend.animation."), false);
      assert.equal(requirement.authorityId.startsWith("operation.animation."), false);
      assert.equal(requirement.authorityId.startsWith("renderer.animation."), false);
    }
  }
});

test("code capability rows retain language-owned frontend boundaries", () => {
  const codeFrontends = kpAnimationCapabilityPlan.entries
    .filter(({ domain }) => domain === "code")
    .flatMap(({ requirements }) => requirements)
    .filter(({ kind }) => kind === "domain-frontend")
    .map(({ authorityId }) => authorityId);
  assert.deepEqual(codeFrontends, [
    "frontend.code.typescript-compiler.v1",
    "frontend.code.python-ast.v1",
    "frontend.code.scheme-reader-evaluator.v1"
  ]);
});
