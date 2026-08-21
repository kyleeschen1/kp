import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFiniteBinderCorpusRequest,
  evaluateKpFiniteBinderExpansionCorpus,
  kpFiniteBinderExpansionCorpus
} from "../src/semantic/finite-binder-expansion-corpus.ts";

test("semantic corpus accepts three direct sums and repairs every other case", () => {
  assert.deepEqual(evaluateKpFiniteBinderExpansionCorpus(), {
    status: "passed",
    acceptedCount: 3,
    repairCount: 8
  });
  assert.equal(kpFiniteBinderExpansionCorpus.cases.length, 11);
});

test("accepted cases compile exact operation and causal recipe authorities", () => {
  const accepted = kpFiniteBinderExpansionCorpus.cases
    .map(({ request }) => compileKpFiniteBinderCorpusRequest(request))
    .filter((result) => result.status === "accepted");
  assert.equal(accepted.length, 3);
  assert.ok(accepted.every(({ operation, recipeId }) =>
    operation.operation === "operation.equation.finite-binder-expand.v1" &&
    recipeId === "recipe.equation.finite-binder-expansion.v1"
  ));
});

test("negative cases return typed layer-specific repairs", () => {
  const results = new Map<string, ReturnType<
    typeof compileKpFiniteBinderCorpusRequest
  >>(kpFiniteBinderExpansionCorpus.cases.map((entry) => [
    entry.id,
    compileKpFiniteBinderCorpusRequest(entry.request)
  ]));
  const expectedCodes = {
    "corpus.finite-binder.finite-product-pressure":
      "finite-binder-corpus.source-unsupported",
    "corpus.finite-binder.unbounded-binder":
      "finite-binder-corpus.source-unsupported",
    "corpus.finite-binder.symbolic-upper-bound":
      "finite-binder-corpus.source-unsupported",
    "corpus.finite-binder.descending-range":
      "finite-binder-corpus.range-unsupported",
    "corpus.finite-binder.mismatched-body-reference":
      "finite-binder-corpus.source-unsupported",
    "corpus.finite-binder.compound-body-template":
      "finite-binder-corpus.source-unsupported",
    "corpus.finite-binder.oversized-expansion":
      "finite-binder-corpus.range-unsupported",
    "corpus.finite-binder.nested-binder":
      "finite-binder-corpus.source-unsupported"
  } as const;
  for (const [id, expectedCode] of Object.entries(expectedCodes)) {
    const result = results.get(id);
    assert.equal(result?.status, "repair-required", id);
    if (result?.status === "repair-required") {
      assert.equal(result.code, expectedCode, id);
      assert.notEqual(result.causeCode, "", id);
      assert.notEqual(result.repair, "", id);
    }
  }
});

test("corpus never includes fallback presentation instructions", () => {
  assert.doesNotMatch(
    JSON.stringify(kpFiniteBinderExpansionCorpus),
    /fallback|geometry|trajectory|keyframe|opacity|duration|renderer/iu
  );
});
