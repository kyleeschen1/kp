import assert from "node:assert/strict";
import test from "node:test";

import { createKpDistributionAreaSelectorAnnotatedLatex } from "../src/rendering/distribution-area-selector-annotated-latex.ts";
import { kpDistributionAreaExemplarContract } from "../src/semantic/distribution-area-exemplar-contract.ts";
import { createKpDistributionAreaExemplarSemanticTrace } from "../src/semantic/distribution-area-exemplar-trace.ts";
import { listKpStructuredExpressionSubtrees } from "../src/semantic/structured-expression.ts";

test("distribution semantic states retain structured subtrees behind every algebra entity selector", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();

  for (const stateId of ["factored", "distributed", "expanded"] as const) {
    const object = trace.bundle.objects.find(({ id }) => id === trace.stateObjectIds[stateId])!;
    const value = object.value as {
      readonly structuredExpression: typeof kpDistributionAreaExemplarContract.algebra.expressions[typeof stateId];
    };
    const subtreeIds = new Set(
      listKpStructuredExpressionSubtrees(value.structuredExpression).map(({ id }) => id)
    );
    assert.equal("latex" in (object.value as object), false, stateId);
    for (const selector of object.selectors) {
      const subtreeId = selector.metadata?.["structuredSubtreeId"];
      if (["factor", "term", "derived-product"].includes(selector.kind)) {
        assert.equal(typeof subtreeId, "string", selector.id);
      }
      if (typeof subtreeId === "string") {
        assert.equal(subtreeIds.has(subtreeId), true, `${selector.id} -> ${subtreeId}`);
      }
    }
  }
});

test("distribution normal-form plan closes every required semantic lineage claim", () => {
  const algebra = kpDistributionAreaExemplarContract.algebra;
  const lineageSources = new Set(
    algebra.distributionNormalFormPlan.lineage.flatMap(({ sourceSubtreeIds }) => sourceSubtreeIds)
  );

  assert.equal(
    algebra.distributionNormalFormPlan.sourceRootId,
    algebra.expressions.factored.root.id
  );
  assert.equal(
    algebra.distributionNormalFormPlan.targetRootId,
    algebra.expressions.distributed.root.id
  );
  assert.equal(
    algebra.distributionBindings.expressions.source,
    algebra.expressions.factored
  );
  assert.equal(
    algebra.distributionBindings.expressions.target,
    algebra.expressions.distributed
  );
  assert.deepEqual(
    algebra.distributionNormalFormIntent.requiredSourceSubtreeIds.filter(
      (subtreeId) => !lineageSources.has(subtreeId)
    ),
    []
  );
});

test("renderer projection preserves accepted algebra without moving presentation authority into semantics", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  assert.deepEqual(
    trace.bundle.objects.map((object) =>
      createKpDistributionAreaSelectorAnnotatedLatex(object).rawLatex
    ),
    ["3(x+2)", "3x+3\\cdot2", "3x+6"]
  );

  const semanticKeys = collectKeys(kpDistributionAreaExemplarContract.algebra);
  assert.deepEqual(
    [...semanticKeys].filter((key) =>
      ["latex", "html", "css", "selector", "durationMs", "keyframes", "x", "y"].includes(key)
    ),
    []
  );
});

function collectKeys(value: unknown, keys = new Set<string>()): ReadonlySet<string> {
  if (typeof value !== "object" || value === null) return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}
