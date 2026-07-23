import assert from "node:assert/strict";
import test from "node:test";

import { bindKpStructuredExpressionRoles } from "../src/semantic/structured-expression-role-binding.ts";
import {
  compileKpStructuredExpressionNormalForm,
  createKpStructuredExpressionNormalFormIntent
} from "../src/semantic/structured-expression-normal-form.ts";
import {
  kpDistributionRewriteRoleIds,
  kpDistributionRewriteRoleSpecs
} from "../src/semantic/structured-expression-rewrite.ts";
import { createKpStructuredExpression } from "../src/semantic/structured-expression.ts";

test("typed normal-form intent compiles only after verified distribution", () => {
  const intent = intentFixture();
  const result = compileKpStructuredExpressionNormalForm({
    intent,
    bindings: distributionBindings()
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(Object.keys(result.plan).sort(), [
    "intentId",
    "lineage",
    "rewriteLawId",
    "schemaVersion",
    "sourceRootId",
    "targetForm",
    "targetRootId"
  ]);
  assert.equal(result.plan.targetForm, "distributed-sum");
  assert.equal(result.plan.lineage.length, 3);
  assert.ok(Object.isFrozen(result.plan));
});

test("normal-form compiler rejects root and preservation claims outside verified lineage", () => {
  const intent = createKpStructuredExpressionNormalFormIntent({
    id: "normal-form.distribution.invalid-claims",
    targetForm: "distributed-sum",
    rewriteLawId: "kp.algebra.distribute.v1",
    sourceRootId: "source.wrong",
    targetRootId: "target.wrong",
    requiredSourceSubtreeIds: ["source.unverified"]
  });
  const result = compileKpStructuredExpressionNormalForm({
    intent,
    bindings: distributionBindings()
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(result.diagnostics.map(({ code, path }) => [code, path]), [
    ["source-root-mismatch", "intent.sourceRootId"],
    ["target-root-mismatch", "intent.targetRootId"],
    ["missing-required-lineage", "intent.requiredSourceSubtreeIds[0]"]
  ]);
});

test("normal-form compiler preserves rewrite diagnostics and refuses unsupported intent", () => {
  const invalidRewrite = compileKpStructuredExpressionNormalForm({
    intent: intentFixture(),
    bindings: distributionBindings({ secondFactorName: "z" })
  });
  assert.equal(invalidRewrite.ok, false);
  if (!invalidRewrite.ok) {
    assert.deepEqual(invalidRewrite.diagnostics.map(({ code, path }) => [code, path]), [
      ["factor-lineage-mismatch", "rewrite.roles.factor-copies[1]"]
    ]);
  }

  const unsupported = compileKpStructuredExpressionNormalForm({
    intent: {
      ...intentFixture(),
      targetForm: "renderer-chosen" as "distributed-sum"
    },
    bindings: distributionBindings()
  });
  assert.deepEqual(unsupported, {
    ok: false,
    diagnostics: [{
      code: "unsupported-normal-form",
      path: "intent.targetForm",
      message: "Normal form renderer-chosen with law kp.algebra.distribute.v1 is not registered."
    }]
  });
});

test("normal-form intent strips presentation-shaped extras and validates identity", () => {
  const authored = {
    id: "normal-form.distribution",
    targetForm: "distributed-sum" as const,
    rewriteLawId: "kp.algebra.distribute.v1" as const,
    sourceRootId: "source.root",
    targetRootId: "target.root",
    requiredSourceSubtreeIds: ["source.factor.a"],
    selector: ".factor",
    durationMs: 600
  };
  const intent = createKpStructuredExpressionNormalFormIntent(authored);
  assert.equal("selector" in intent, false);
  assert.equal("durationMs" in intent, false);
  assert.throws(() => createKpStructuredExpressionNormalFormIntent({
    ...authored,
    requiredSourceSubtreeIds: ["source.factor.a", "source.factor.a"]
  }), /repeats a required source subtree id/);
});

function intentFixture() {
  return createKpStructuredExpressionNormalFormIntent({
    id: "normal-form.distribution",
    targetForm: "distributed-sum",
    rewriteLawId: "kp.algebra.distribute.v1",
    sourceRootId: "source.root",
    targetRootId: "target.root",
    requiredSourceSubtreeIds: [
      "source.factor.a",
      "source.addend.b",
      "source.addend.c"
    ]
  });
}

function distributionBindings(options: { readonly secondFactorName?: string } = {}) {
  const source = createKpStructuredExpression({
    root: {
      id: "source.root",
      kind: "product",
      factors: [
        { id: "source.factor.a", kind: "symbol", name: "a" },
        {
          id: "source.grouped-sum",
          kind: "sum",
          terms: [
            { id: "source.addend.b", kind: "symbol", name: "b" },
            { id: "source.addend.c", kind: "symbol", name: "c" }
          ]
        }
      ]
    }
  });
  const target = createKpStructuredExpression({
    root: {
      id: "target.root",
      kind: "sum",
      terms: [
        {
          id: "target.term.0",
          kind: "product",
          factors: [
            { id: "target.factor.a.0", kind: "symbol", name: "a" },
            { id: "target.addend.b", kind: "symbol", name: "b" }
          ]
        },
        {
          id: "target.term.1",
          kind: "product",
          factors: [
            {
              id: "target.factor.a.1",
              kind: "symbol",
              name: options.secondFactorName ?? "a"
            },
            { id: "target.addend.c", kind: "symbol", name: "c" }
          ]
        }
      ]
    }
  });
  return bindKpStructuredExpressionRoles({
    contractId: "normal-form.distribution.fixture",
    expressions: { source, target },
    roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [kpDistributionRewriteRoleIds.sourceRoot]: "source.root",
      [kpDistributionRewriteRoleIds.commonFactor]: "source.factor.a",
      [kpDistributionRewriteRoleIds.sourceGroupedSum]: "source.grouped-sum",
      [kpDistributionRewriteRoleIds.sourceAddends]: ["source.addend.b", "source.addend.c"],
      [kpDistributionRewriteRoleIds.targetRoot]: "target.root",
      [kpDistributionRewriteRoleIds.distributedTerms]: ["target.term.0", "target.term.1"],
      [kpDistributionRewriteRoleIds.factorCopies]: ["target.factor.a.0", "target.factor.a.1"],
      [kpDistributionRewriteRoleIds.distributedAddends]: ["target.addend.b", "target.addend.c"]
    }
  });
}
