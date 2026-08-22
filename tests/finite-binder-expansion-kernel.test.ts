import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveKpFiniteBinderExpansionKernel,
  KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY
} from "../src/semantic/finite-binder-expansion-kernel.ts";
import { defineKpFiniteBinderRange } from
  "../src/semantic/finite-binder-range.ts";
import { proveKpFiniteBinderScope } from
  "../src/semantic/finite-binder-scope-proof.ts";
import {
  normalizeKpFiniteSumSourceEndpoint,
  normalizeKpFiniteSumTargetEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

test("shared kernel derives only fresh ordered instances and common lineage", () => {
  const input = kernelInput();
  const result = deriveKpFiniteBinderExpansionKernel(input);
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;

  assert.equal(result.kernel.authority,
    KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY);
  assert.deepEqual(
    result.kernel.instances.map(({ ordinal, indexValue }) => ({
      ordinal,
      indexValue
    })),
    [
      { ordinal: 0, indexValue: -1 },
      { ordinal: 1, indexValue: 0 },
      { ordinal: 2, indexValue: 1 }
    ]
  );
  assert.deepEqual(
    result.kernel.lineage.map(({ relation }) => relation),
    [
      "body-template-instantiates",
      "bound-reference-substitutes-integer",
      "body-template-instantiates",
      "bound-reference-substitutes-integer",
      "body-template-instantiates",
      "bound-reference-substitutes-integer",
      "lower-bound-materializes-reference",
      "upper-bound-materializes-reference"
    ]
  );
  assert.equal(Object.isFrozen(result.kernel), true);
});

test("shared kernel fails closed on proof count order and template defects", () => {
  const input = kernelInput();
  const proof = deriveKpFiniteBinderExpansionKernel({
    ...input,
    rangeProof: { ...input.rangeProof, sourceId: input.source.body.id }
  });
  const count = deriveKpFiniteBinderExpansionKernel({
    ...input,
    members: input.members.slice(0, 2)
  });
  const order = deriveKpFiniteBinderExpansionKernel({
    ...input,
    members: [input.members[0]!, input.members[2]!, input.members[1]!]
  });
  const template = deriveKpFiniteBinderExpansionKernel({
    ...input,
    members: input.members.map((member) => ({
      ...member,
      bodySymbol: "c"
    }))
  });

  assert.deepEqual([proof, count, order, template].map((result) =>
    result.status === "invalid-expansion" ? result.diagnostic.code : undefined
  ), [
    "finite-binder-kernel.proof-mismatch",
    "finite-binder-kernel.member-count-mismatch",
    "finite-binder-kernel.member-order-mismatch",
    "finite-binder-kernel.body-template-mismatch"
  ]);
});

test("shared kernel owns no connective presentation or arithmetic policy", () => {
  const source = JSON.stringify(deriveKpFiniteBinderExpansionKernel(kernelInput()));
  assert.doesNotMatch(source,
    /connector|adjacency|paint|trajectory|keyframe|duration|arithmetic|sumValue|productValue/u);
});

function kernelInput() {
  const source = normalizeKpFiniteSumSourceEndpoint(
    "\\sum_{j=-1}^{1} b_j"
  );
  const target = normalizeKpFiniteSumTargetEndpoint("b_{-1}+b_0+b_1");
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status !== "normalized" || target.status !== "normalized") {
    throw new Error("Expected kernel pressure endpoints.");
  }
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  assert.equal(scope.status, "verified");
  if (scope.status !== "verified") throw new Error("Expected scope proof.");
  const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
  assert.equal(range.status, "verified");
  if (range.status !== "verified") throw new Error("Expected range proof.");
  return {
    source: source.endpoint.semantic,
    members: target.endpoint.terms,
    scopeProof: scope.proof,
    rangeProof: range.range
  };
}
