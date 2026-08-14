import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeKpNormalMatrixProofUrl,
  decodeKpNormalMatrixProofUrl,
  encodeKpNormalMatrixProofUrl
} from "../src/public-web/normal-matrix-proof-url-codec.ts";

test("normal-proof URLs round trip checkpoint and evidence independently", () => {
  const encoded = encodeKpNormalMatrixProofUrl(
    "https://kinetic.press/learn/math/normal-matrices/?review=predict-row-remainder&utm_source=return#kp-ref:normal-proof/matrix/row-remainder",
    {
      checkpoint: "norm-equation",
      evidence: "static",
      review: "predict-row-remainder"
    }
  );
  const url = new URL(encoded);

  assert.equal(url.searchParams.get("checkpoint"), "norm-equation");
  assert.equal(url.searchParams.get("evidence"), "static");
  assert.equal(url.searchParams.get("review"), "predict-row-remainder");
  assert.equal(url.searchParams.get("utm_source"), "return");
  assert.equal(url.hash, "#kp-ref:normal-proof/matrix/row-remainder");
  assert.deepEqual(decodeKpNormalMatrixProofUrl(encoded), {
    checkpoint: "norm-equation",
    evidence: "static",
    review: "predict-row-remainder"
  });
});

test("canonicalization fails closed and omits default route state", () => {
  const canonical = canonicalizeKpNormalMatrixProofUrl(
    "https://kinetic.press/learn/math/normal-matrices/?evidence=compare&checkpoint=missing&review=missing&utm_source=teacher"
  );
  const url = new URL(canonical);

  assert.equal(url.searchParams.has("checkpoint"), false);
  assert.equal(url.searchParams.has("evidence"), false);
  assert.equal(url.searchParams.get("utm_source"), "teacher");
  assert.deepEqual(decodeKpNormalMatrixProofUrl(canonical), {
    checkpoint: "statement",
    evidence: "motion"
  });
});
