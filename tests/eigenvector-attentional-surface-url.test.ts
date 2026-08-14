import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeKpEigenvectorLocation,
  encodeKpEigenvectorLocation
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-url.ts";

test("direct beat URLs decode without replay or visitation state", () => {
  assert.deepEqual(decodeKpEigenvectorLocation(
    "https://example.test/learn/math/eigenvectors/#compressed-recall"
  ), { beatId: "compressed-recall" });
  assert.deepEqual(decodeKpEigenvectorLocation(
    "https://example.test/learn/math/eigenvectors/#not-a-beat"
  ), { beatId: "most-vectors-turn" });
});

test("semantic object focus is accepted only from the closed registry", () => {
  assert.deepEqual(decodeKpEigenvectorLocation(
    "https://example.test/learn/math/eigenvectors/?focus=eigenvector-demo%2Fvector%2Fv#geometry-becomes-equation"
  ), {
    beatId: "geometry-becomes-equation",
    focusObjectId: "eigenvector-demo/vector/v"
  });
  assert.deepEqual(decodeKpEigenvectorLocation(
    "https://example.test/learn/math/eigenvectors/?focus=unknown#watch-the-fan"
  ), { beatId: "watch-the-fan" });
});

test("encoding preserves unrelated query parameters", () => {
  const encoded = new URL(encodeKpEigenvectorLocation(
    "https://example.test/learn/math/eigenvectors/?utm_source=return",
    {
      beatId: "one-direction-survives",
      focusObjectId: "eigenvector-demo/vector/v"
    }
  ));
  assert.equal(encoded.hash, "#one-direction-survives");
  assert.equal(encoded.searchParams.get("focus"), "eigenvector-demo/vector/v");
  assert.equal(encoded.searchParams.get("utm_source"), "return");
});
