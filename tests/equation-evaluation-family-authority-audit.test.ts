import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpEquationEvaluationFamilyAuthority
} from "../src/architecture/equation-evaluation-family-authority-audit.ts";

test("evaluation family audit accepts the review-stage difference registration", () => {
  assert.deepEqual(auditKpEquationEvaluationFamilyAuthority(), []);
});
