import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpStructuredExpressionRoles
} from "../src/semantic/structured-expression-role-binding.ts";
import {
  kpDistributionRewriteRoleIds,
  kpDistributionRewriteRoleSpecs,
  verifyKpDistributionRewrite
} from "../src/semantic/structured-expression-rewrite.ts";
import { createKpStructuredExpression } from "../src/semantic/structured-expression.ts";

test("distribution rewrite verifies topology, fan-out, preservation, and lineage", () => {
  const result = verifyKpDistributionRewrite(distributionBindings());

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.verification.lawId, "kp.algebra.distribute.v1");
  assert.deepEqual(result.verification.lineage, [
    {
      relation: "fan-out",
      sourceSubtreeIds: ["source.factor.a"],
      targetSubtreeIds: ["target.factor.a.0", "target.factor.a.1"]
    },
    {
      relation: "preserve",
      sourceSubtreeIds: ["source.addend.b"],
      targetSubtreeIds: ["target.addend.b"]
    },
    {
      relation: "preserve",
      sourceSubtreeIds: ["source.addend.c"],
      targetSubtreeIds: ["target.addend.c"]
    }
  ]);
  assert.ok(Object.isFrozen(result.verification.lineage));
});

test("distribution rewrite returns deterministic factor and addend diagnostics", () => {
  const result = verifyKpDistributionRewrite(distributionBindings({
    secondFactorName: "z",
    secondAddendName: "d"
  }));

  assert.deepEqual(result, {
    ok: false,
    diagnostics: [
      {
        code: "factor-lineage-mismatch",
        path: "roles.factor-copies[1]",
        message: "Every factor copy must preserve the common factor's complete semantic subtree."
      },
      {
        code: "addend-lineage-mismatch",
        path: "roles.distributed-addends[1]",
        message: "Every distributed addend must preserve its corresponding source addend subtree."
      }
    ]
  });
});

test("distribution rewrite diagnoses target topology and cardinality without guessing", () => {
  const bindingSet = distributionBindings({ omitSecondTargetTerm: true });
  const result = verifyKpDistributionRewrite(bindingSet);

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(result.diagnostics.map(({ code, path }) => [code, path]), [
    ["target-pattern-mismatch", "roles.distributed-terms"],
    ["cardinality-mismatch", "roles"]
  ]);
});

function distributionBindings(options: {
  readonly secondFactorName?: string;
  readonly secondAddendName?: string;
  readonly omitSecondTargetTerm?: boolean;
} = {}) {
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
  const targetTerms = [
    {
      id: "target.term.0",
      kind: "product" as const,
      factors: [
        { id: "target.factor.a.0", kind: "symbol" as const, name: "a" },
        { id: "target.addend.b", kind: "symbol" as const, name: "b" }
      ]
    },
    {
      id: "target.term.1",
      kind: "product" as const,
      factors: [
        {
          id: "target.factor.a.1",
          kind: "symbol" as const,
          name: options.secondFactorName ?? "a"
        },
        {
          id: "target.addend.c",
          kind: "symbol" as const,
          name: options.secondAddendName ?? "c"
        }
      ]
    }
  ];
  const target = createKpStructuredExpression({
    root: {
      id: "target.root",
      kind: "sum",
      terms: options.omitSecondTargetTerm ? [targetTerms[0]!, {
        id: "target.term.fallback",
        kind: "product",
        factors: [
          { id: "target.factor.fallback", kind: "symbol", name: "a" },
          { id: "target.addend.fallback", kind: "symbol", name: "b" }
        ]
      }] : targetTerms
    }
  });
  const targetTermIds = options.omitSecondTargetTerm
    ? ["target.term.0"]
    : ["target.term.0", "target.term.1"];
  const factorCopyIds = options.omitSecondTargetTerm
    ? ["target.factor.a.0"]
    : ["target.factor.a.0", "target.factor.a.1"];
  const distributedAddendIds = options.omitSecondTargetTerm
    ? ["target.addend.b"]
    : ["target.addend.b", "target.addend.c"];
  return bindKpStructuredExpressionRoles({
    contractId: "rewrite.distribute.fixture",
    expressions: { source, target },
    roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [kpDistributionRewriteRoleIds.sourceRoot]: "source.root",
      [kpDistributionRewriteRoleIds.commonFactor]: "source.factor.a",
      [kpDistributionRewriteRoleIds.sourceGroupedSum]: "source.grouped-sum",
      [kpDistributionRewriteRoleIds.sourceAddends]: ["source.addend.b", "source.addend.c"],
      [kpDistributionRewriteRoleIds.targetRoot]: "target.root",
      [kpDistributionRewriteRoleIds.distributedTerms]: targetTermIds,
      [kpDistributionRewriteRoleIds.factorCopies]: factorCopyIds,
      [kpDistributionRewriteRoleIds.distributedAddends]: distributedAddendIds
    }
  });
}
