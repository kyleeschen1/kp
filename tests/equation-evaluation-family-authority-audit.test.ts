import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpEquationEvaluationFamilyAuthority
} from "../src/architecture/equation-evaluation-family-authority-audit.ts";

test("evaluation family audit exposes the current difference disagreement", () => {
  assert.deepEqual(auditKpEquationEvaluationFamilyAuthority(), [{
    authorityId: "kp.presentation.operation-evaluation.difference.authority-v2",
    transformationKind: "simplifyConstantDifference",
    claimedFamilyProfileId: "kp.evaluation-family.contributor-fusion.v1",
    code: "evaluation-family.missing-runtime-profile"
  }]);
});
