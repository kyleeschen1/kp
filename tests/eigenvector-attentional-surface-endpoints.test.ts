import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEigenvectorBeatIds,
  kpEigenvectorEndpoints,
  parseKpEigenvectorBeatHash,
  projectKpEigenvectorEndpoint
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-endpoints.ts";

test("the approved experience has exactly nine ordered semantic endpoints", () => {
  assert.equal(kpEigenvectorEndpoints.length, 9);
  assert.deepEqual(
    kpEigenvectorEndpoints.map(({ id }) => id),
    kpEigenvectorBeatIds
  );
  assert.deepEqual(
    kpEigenvectorEndpoints.map(({ index }) => index),
    [0, 1, 2, 3, 4, 5, 6, 7, 8]
  );
});

test("every endpoint has one owner and direct stable hash", () => {
  for (const beatId of kpEigenvectorBeatIds) {
    const endpoint = projectKpEigenvectorEndpoint(beatId);
    assert.equal(endpoint.id, beatId);
    assert.equal(endpoint.hash, `#${beatId}`);
    assert.equal(parseKpEigenvectorBeatHash(endpoint.hash), beatId);
    assert.ok(endpoint.primaryObjectIds.length > 0);
  }
});

test("direct restoration is independent of visitation order", () => {
  const forward = kpEigenvectorBeatIds.map(projectKpEigenvectorEndpoint);
  const reverse = [...kpEigenvectorBeatIds].reverse()
    .map(projectKpEigenvectorEndpoint)
    .reverse();

  assert.deepEqual(reverse, forward);
  assert.equal(parseKpEigenvectorBeatHash("#not-a-beat"), undefined);
});

test("the semantic progression assigns reading, watching, and acting explicitly", () => {
  assert.deepEqual(
    kpEigenvectorEndpoints.map(({ attentionalOwner }) => attentionalOwner),
    [
      "passage",
      "diagram",
      "diagram",
      "equation",
      "equation",
      "learner",
      "diagram",
      "manipulation",
      "recall"
    ]
  );
});
