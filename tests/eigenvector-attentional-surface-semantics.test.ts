import assert from "node:assert/strict";
import test from "node:test";

import { kpEigenvectorAttentionalFixture } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-math.ts";
import {
  checkKpEigenvectorSemanticRegistry,
  findKpEigenvectorSemanticObject,
  kpEigenvectorSemanticRegistry
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-semantics.ts";

test("the local semantic registry is closed and unambiguous", () => {
  assert.deepEqual(checkKpEigenvectorSemanticRegistry(), []);
  const representationIds = kpEigenvectorSemanticRegistry.flatMap(
    ({ representations }) => representations.map(({ id }) => id)
  );
  assert.equal(new Set(representationIds).size, representationIds.length);
});

test("v keeps one identity across every approved representational surface", () => {
  const vector = findKpEigenvectorSemanticObject(
    kpEigenvectorAttentionalFixture.persistentVector.id
  );

  assert.deepEqual(
    vector.representations.map(({ kind }) => kind),
    ["diagram", "equation", "prose", "prediction", "manipulation", "recall-cue"]
  );
  assert.ok(vector.roles.includes("persistent-identity"));
  assert.ok(vector.representations.every(({ semanticObjectId }) =>
    semanticObjectId === vector.id
  ));
});

test("identity remains independent from repeated labels and renderer order", () => {
  const vector = findKpEigenvectorSemanticObject(
    kpEigenvectorAttentionalFixture.persistentVector.id
  );
  const eigenspace = findKpEigenvectorSemanticObject(
    kpEigenvectorAttentionalFixture.invariantLine.id
  );

  assert.notEqual(vector.id, eigenspace.id);
  assert.notEqual(
    vector.representations[0]?.selector,
    vector.representations[1]?.selector
  );
  assert.equal(vector.representations[0]?.semanticObjectId, vector.id);
  assert.equal(vector.representations.at(-1)?.semanticObjectId, vector.id);
});

test("registry validation rejects aliases that silently change object identity", () => {
  const vector = findKpEigenvectorSemanticObject(
    kpEigenvectorAttentionalFixture.persistentVector.id
  );
  const invalid = [{
    ...vector,
    representations: [{
      ...vector.representations[0]!,
      semanticObjectId: "eigenvector-demo/vector/not-v"
    }]
  }];

  assert.match(
    checkKpEigenvectorSemanticRegistry(invalid)[0] ?? "",
    /points to .*not-v, not .*vector\/v/
  );
});
