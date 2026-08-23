import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedEvaluationTopologyCertificate,
  kpEvaluationTopologyKinds
} from "../src/semantic/evaluation-topology-certificate.ts";

test("evaluation topology vocabulary is closed and certificates are nominal", () => {
  assert.deepEqual(kpEvaluationTopologyKinds, [
    "contributors-create-result",
    "carrier-survives",
    "annihilation-leaves-survivor"
  ]);
  assert.equal(isKpVerifiedEvaluationTopologyCertificate({
    schemaVersion: "kp.evaluation-topology-certificate.v1",
    topology: "contributors-create-result"
  }), false);
});
