import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpCanonicalLogProductContract
} from "../src/semantic/log-product-contract.ts";
import {
  kpCanonicalLogProductSemanticMotionOutcome,
  kpCanonicalLogProductSemanticMotionPrecedence,
  kpCanonicalLogProductSemanticMotionRequest,
  kpCanonicalLogProductSemanticMotionStructure
} from "../src/semantic/log-product-semantic-motion.ts";
import {
  listKpLogProductExpressionNodes
} from "../src/semantic/log-product-states.ts";
import {
  isKpCompiledLogProductOperation,
  kpCanonicalCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("log product owns exact domain, endpoints, and reversible lineage", () => {
  const contract = kpCanonicalLogProductContract;
  const operation = kpCanonicalCompiledLogProductOperation;

  assert.equal(contract.source.latex, "\\ln(xy)");
  assert.equal(contract.target.latex, "\\ln(x)+\\ln(y)");
  assert.deepEqual(contract.assumptionIds, [
    "assumption.log-product.x-positive",
    "assumption.log-product.y-positive",
    "assumption.log-product.natural-base",
    "assumption.log-product.product-positive"
  ]);
  assert.equal(isKpCompiledLogProductOperation(operation), true);
  assert.equal(isKpCompiledLogProductOperation({ ...operation }), false);
  assert.deepEqual(
    operation.rewindRecords.flatMap(({ fromSelectorIds }) => fromSelectorIds).sort(),
    listKpLogProductExpressionNodes(contract.target).map(({ id }) => id).sort()
  );
  assert.deepEqual(
    operation.rewindRecords.flatMap(({ toSelectorIds }) => toSelectorIds).sort(),
    listKpLogProductExpressionNodes(contract.source).map(({ id }) => id).sort()
  );
});

test("log product reaches the compiler's intentional unsupported-recipe boundary", () => {
  assert.equal(kpCanonicalLogProductSemanticMotionOutcome.status, "explicit-static");
  if (kpCanonicalLogProductSemanticMotionOutcome.status !== "explicit-static") {
    assert.fail("Slice 24 must stop before choosing a concrete motion recipe.");
  }
  assert.equal(
    kpCanonicalLogProductSemanticMotionOutcome.reason,
    "unsupported-operation"
  );
  assert.equal(
    kpCanonicalLogProductSemanticMotionOutcome.staticStateId,
    kpCanonicalLogProductContract.target.id
  );
  assert.match(
    kpCanonicalLogProductSemanticMotionOutcome.issues[0]!.message,
    /kp\.semantic-motion\.log-product/u
  );
});

test("every frontier entity has one semantic role before presentation exists", () => {
  const bindings = kpCanonicalLogProductSemanticMotionRequest.operation.roleBindings;
  const bound = Object.values(bindings).flat();
  const frontier = [
    ...kpCanonicalLogProductSemanticMotionRequest.rewriteFrontier.sourceEntityIds,
    ...kpCanonicalLogProductSemanticMotionRequest.rewriteFrontier.targetEntityIds
  ];

  assert.equal(new Set(bound).size, bound.length);
  assert.deepEqual([...bound].sort(), [...frontier].sort());
  assert.deepEqual(
    Object.keys(bindings).sort(),
    kpCanonicalLogProductSemanticMotionStructure.roles.map(({ id }) => id).sort()
  );
  assert.equal(
    kpCanonicalLogProductSemanticMotionPrecedence.events.at(-1)?.kind,
    "native-target-ready"
  );
});

test("the semantic caller owns no geometry, timing, or renderer imports", () => {
  const source = readFileSync(new URL(
    "../src/semantic/log-product-semantic-motion.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:rendering|editor)/u);
  assert.doesNotMatch(
    source,
    /\b(?:durationMs|delayMs|easing|translateX|translateY|geometry)\b/u
  );
});
