import assert from "node:assert/strict";
import test from "node:test";

import { resolveKpNormalMatrixProofEvidenceMode } from
  "../src/public-web/normal-matrix-proof-evidence-mode.ts";

test("static evidence is an explicit route mode", () => {
  assert.equal(
    resolveKpNormalMatrixProofEvidenceMode("?evidence=static"),
    "static"
  );
  assert.equal(
    resolveKpNormalMatrixProofEvidenceMode("?evidence=motion"),
    "motion"
  );
  assert.equal(resolveKpNormalMatrixProofEvidenceMode(""), "motion");
});

test("unknown evidence values fail closed to the ordinary motion route", () => {
  assert.equal(
    resolveKpNormalMatrixProofEvidenceMode("?evidence=compare"),
    "motion"
  );
});
