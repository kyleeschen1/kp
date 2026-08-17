import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpAnimationCapabilityPlan,
  KpAnimationCapabilityPlanError
} from "../src/architecture/animation-capability-plan.ts";

function validPlan(): Record<string, unknown> {
  return {
    schemaVersion: "kp.animation-capability-plan.v1",
    kind: "animation-capability-plan",
    id: "plan.kp.animation-capabilities",
    title: "Animation capability plan",
    entries: [{
      id: "capability.equation.function-wrap",
      domain: "equation",
      order: 10,
      title: "Wrap an expression in a function",
      scope: {
        kind: "operation",
        authorityId: "operation.equation.function-wrap"
      },
      requirements: [{
        id: "requirement.equation.function-wrap.recipe",
        kind: "canonical-recipe",
        authorityId: "recipe.equation.function-wrap",
        summary: "A registered compiler-owned wrap recipe."
      }]
    }]
  };
}

test("capability plan preserves authored order and freezes requirements", () => {
  const plan = defineKpAnimationCapabilityPlan(validPlan());

  assert.equal(plan.schemaVersion, "kp.animation-capability-plan.v1");
  assert.equal(plan.entries[0]?.domain, "equation");
  assert.equal(plan.entries[0]?.order, 10);
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.entries));
  assert.ok(Object.isFrozen(plan.entries[0]?.requirements));
});

test("capability plan rejects readiness and presentation authority", () => {
  const input = validPlan();
  const entry = (input["entries"] as Record<string, unknown>[])[0]!;
  entry["readiness"] = "direct";
  entry["status"] = "complete";
  entry["timing"] = { durationMs: 400 };

  assert.throws(
    () => defineKpAnimationCapabilityPlan(input),
    (error: unknown) => {
      assert.ok(error instanceof KpAnimationCapabilityPlanError);
      assert.deepEqual(
        error.diagnostics.map(({ path, code }) => ({ path, code })),
        [
          {
            path: "$.entries[0].readiness",
            code: "capability-plan.field.unknown"
          },
          {
            path: "$.entries[0].status",
            code: "capability-plan.field.unknown"
          },
          {
            path: "$.entries[0].timing",
            code: "capability-plan.field.unknown"
          }
        ]
      );
      return true;
    }
  );
});

test("capability plan rejects duplicate IDs, requirements, and unordered rows", () => {
  const input = validPlan();
  const first = (input["entries"] as Record<string, unknown>[])[0]!;
  const firstRequirement = (first["requirements"] as Record<string, unknown>[])[0]!;
  first["requirements"] = [firstRequirement, { ...firstRequirement }];
  input["entries"] = [
    first,
    { ...first, order: 5, requirements: [{
      ...firstRequirement,
      id: "requirement.equation.function-wrap.exemplar"
    }] }
  ];

  assert.throws(
    () => defineKpAnimationCapabilityPlan(input),
    (error: unknown) => {
      assert.ok(error instanceof KpAnimationCapabilityPlanError);
      const codes = error.diagnostics.map(({ code }) => code);
      assert.ok(codes.includes("capability-plan.requirement.duplicate"));
      assert.ok(codes.includes("capability-plan.id.duplicate"));
      assert.ok(codes.includes("capability-plan.order.unsorted"));
      return true;
    }
  );
});

test("capability plan rejects incomplete and non-namespaced requirements", () => {
  const input = validPlan();
  const entry = (input["entries"] as Record<string, unknown>[])[0]!;
  entry["requirements"] = [{
    id: "plain",
    kind: "renderer-geometry",
    authorityId: "also plain",
    summary: ""
  }];

  assert.throws(
    () => defineKpAnimationCapabilityPlan(input),
    (error: unknown) => {
      assert.ok(error instanceof KpAnimationCapabilityPlanError);
      assert.deepEqual(
        error.diagnostics.map(({ path }) => path),
        [
          "$.entries[0].requirements[0].id",
          "$.entries[0].requirements[0].kind",
          "$.entries[0].requirements[0].authorityId",
          "$.entries[0].requirements[0].summary"
        ]
      );
      return true;
    }
  );
});
