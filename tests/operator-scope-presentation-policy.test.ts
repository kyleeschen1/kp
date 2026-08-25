import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOperatorApplicationKinds,
  kpOperatorScopePresentationTreatments,
  listKpOperatorScopePresentationPolicies,
  requireKpOperatorScopePresentationPolicy
} from "../src/editor/operator-scope-presentation-policy.ts";

test("renderer owns the closed operator-scope treatment vocabulary", () => {
  assert.deepEqual(kpOperatorScopePresentationTreatments, [
    "outline",
    "salience-only",
    "none"
  ]);
  assert.deepEqual(kpOperatorApplicationKinds, [
    "derivative-operator-application",
    "antiderivative-operator-application"
  ]);
  assert.ok(listKpOperatorScopePresentationPolicies().every((entry) =>
    entry.scopeAuthority === "semantic-argument-selector-ids"
  ));
});

test("derivative keeps its outline while integration selects salience only", () => {
  assert.equal(requireKpOperatorScopePresentationPolicy(
    "derivative-operator-application"
  ).treatment, "outline");
  assert.equal(requireKpOperatorScopePresentationPolicy(
    "antiderivative-operator-application"
  ).treatment, "salience-only");
  assert.equal(listKpOperatorScopePresentationPolicies().some(
    ({ treatment }) => treatment === "none"
  ), false, "none remains an explicit option, not a silent default");
});
