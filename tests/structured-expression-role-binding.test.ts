import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpStructuredExpressionRoles,
  resolveKpStructuredExpressionRole,
  type KpStructuredExpressionRoleSpec
} from "../src/semantic/structured-expression-role-binding.ts";
import { createKpStructuredExpression } from "../src/semantic/structured-expression.ts";

const distributionRoles: readonly KpStructuredExpressionRoleSpec[] = [
  {
    id: "source-root",
    endpoint: "source",
    cardinality: "exactly-one",
    allowedKinds: ["product"],
    summary: "The complete multiplication awaiting distribution."
  },
  {
    id: "common-factor",
    endpoint: "source",
    cardinality: "exactly-one",
    allowedKinds: ["symbol", "number", "product", "quotient", "power", "negate"],
    summary: "The opaque factor copied into every destination term."
  },
  {
    id: "source-addends",
    endpoint: "source",
    cardinality: "one-or-more",
    allowedKinds: ["number", "symbol", "product", "quotient", "power", "negate"],
    summary: "The ordered addends receiving the common factor."
  }
];

test("semantic algebra roles bind to validated structured subtrees", () => {
  const source = distributionExpression();
  const roleBinding = bindKpStructuredExpressionRoles({
    contractId: "algebra.distribute.source",
    expressions: { source },
    roles: distributionRoles,
    bindings: {
      "source-root": "expr.distribution",
      "common-factor": "expr.factor.a",
      "source-addends": ["expr.addend.b", "expr.addend.c"]
    }
  });

  assert.equal(roleBinding.schemaVersion, "kp.structured-expression-role-binding.v1");
  assert.deepEqual(
    resolveKpStructuredExpressionRole(roleBinding, "source-addends").map((node) => node.id),
    ["expr.addend.b", "expr.addend.c"]
  );
  assert.deepEqual(resolveKpStructuredExpressionRole(roleBinding, "unknown"), []);
  assert.ok(Object.isFrozen(roleBinding));
  assert.ok(Object.isFrozen(roleBinding.roles));
  assert.ok(Object.isFrozen(roleBinding.bindings["source-addends"]!.subtreeIds));
});

test("role binding rejects unknown, missing, repeated, and wrong-kind subtree assignments", () => {
  const source = distributionExpression();
  const validBindings = {
    "source-root": "expr.distribution",
    "common-factor": "expr.factor.a",
    "source-addends": ["expr.addend.b", "expr.addend.c"]
  } as const;
  const bind = (
    bindings: Readonly<Record<string, string | readonly string[]>>,
    roles: readonly KpStructuredExpressionRoleSpec[] = distributionRoles
  ) => bindKpStructuredExpressionRoles({
    contractId: "algebra.distribute.source",
    expressions: { source },
    roles,
    bindings
  });

  assert.throws(() => bind({ ...validBindings, unexpected: "expr.factor.a" }), /binds unknown role unexpected/);
  assert.throws(() => bind({ ...validBindings, "common-factor": [] }), /requires exactly-one; received 0/);
  assert.throws(() => bind({ ...validBindings, "common-factor": "expr.missing" }), /references missing source subtree expr\.missing/);
  assert.throws(() => bind({ ...validBindings, "common-factor": "expr.grouped-sum" }), /requires symbol or number.*subtree expr\.grouped-sum is sum/);
  assert.throws(() => bind({
    ...validBindings,
    "source-addends": ["expr.addend.b", "expr.addend.b"]
  }), /repeats a subtree id/);
  assert.throws(() => bind(validBindings, [...distributionRoles, distributionRoles[0]!] ), /repeats role source-root/);
});

test("role binding requires every role endpoint and keeps presentation outside the contract", () => {
  const source = distributionExpression();
  assert.throws(() => bindKpStructuredExpressionRoles({
    contractId: "algebra.distribute.target",
    expressions: { source },
    roles: [{
      id: "target-root",
      endpoint: "target",
      cardinality: "exactly-one",
      allowedKinds: ["sum"],
      summary: "The distributed target expression."
    }],
    bindings: { "target-root": "expr.target" }
  }), /requires a target expression/);

  const roleBinding = bindKpStructuredExpressionRoles({
    contractId: "algebra.distribute.source",
    expressions: { source },
    roles: distributionRoles,
    bindings: {
      "source-root": "expr.distribution",
      "common-factor": "expr.factor.a",
      "source-addends": ["expr.addend.b", "expr.addend.c"]
    }
  });
  assert.deepEqual(Object.keys(roleBinding.bindings["common-factor"]!).sort(), [
    "endpoint",
    "roleId",
    "subtreeIds"
  ]);
});

function distributionExpression() {
  return createKpStructuredExpression({
    root: {
      id: "expr.distribution",
      kind: "product",
      factors: [
        { id: "expr.factor.a", kind: "symbol", name: "a" },
        {
          id: "expr.grouped-sum",
          kind: "sum",
          terms: [
            { id: "expr.addend.b", kind: "symbol", name: "b" },
            { id: "expr.addend.c", kind: "symbol", name: "c" }
          ]
        }
      ]
    }
  });
}
