import assert from "node:assert/strict";
import test from "node:test";
import { createFlaggedTicketSource } from "../domains/probability/binary-joint-model.ts";
import { bindBayesEvidence } from "../src/experiments/bayesian-reasoning/evidence.ts";
import { compileBayesNotation } from "../src/experiments/bayesian-reasoning/notation.ts";
import { buildBayesNativeProbe } from "../src/experiments/bayesian-reasoning/native-probe-page.ts";

test("conditional notation derives the same quantities and canonical arithmetic certificate", () => {
  const notation = compileBayesNotation(bindBayesEvidence(createFlaggedTicketSource()).trace);
  assert.equal(notation.numeratorUnits, 16n); assert.equal(notation.denominatorUnits, 24n);
  assert.equal(notation.result, "2/3");
  assert.equal(notation.certificate.familyProfile.family, "contributor-fusion");
  assert.equal(notation.animation.transformations[0]!.transformType, "simplifyConstantQuotient");
  assert.match(buildBayesNativeProbe(), /data-kp-reader-exemplar-template/);
  // A host without family-specific controls still requires both accessible endpoints.
  assert.equal((buildBayesNativeProbe().match(/data-kp-reader-accessible-equation-state=/g) ?? []).length, 2);
});
