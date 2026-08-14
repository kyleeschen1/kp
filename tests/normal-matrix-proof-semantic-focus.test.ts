import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeKpNormalMatrixProofSemanticLocation,
  encodeKpNormalMatrixProofSemanticLocation
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-semantic-focus.ts";

test("normal-proof semantic fragments resolve only authored addresses", () => {
  assert.equal(
    decodeKpNormalMatrixProofSemanticLocation(
      "#kp-ref:normal-proof/matrix/row-remainder"
    ),
    "normal-proof/matrix/row-remainder"
  );
  assert.equal(
    decodeKpNormalMatrixProofSemanticLocation(
      "#kp-ref:normal-proof/matrix%2Frow-remainder"
    ),
    "normal-proof/matrix/row-remainder"
  );
  assert.equal(
    decodeKpNormalMatrixProofSemanticLocation("#kp-ref:normal-proof/missing"),
    undefined
  );
  assert.equal(decodeKpNormalMatrixProofSemanticLocation("#ordinary-heading"), undefined);
});

test("semantic fragment encoding preserves checkpoint route authority", () => {
  const encoded = encodeKpNormalMatrixProofSemanticLocation(
    "https://kinetic.press/learn/math/normal-matrices/?checkpoint=norm-equation",
    "normal-proof/matrix/row-remainder"
  );
  const url = new URL(encoded);

  assert.equal(url.searchParams.get("checkpoint"), "norm-equation");
  assert.equal(url.hash, "#kp-ref:normal-proof/matrix/row-remainder");
});
