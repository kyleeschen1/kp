import assert from "node:assert/strict";
import test from "node:test";

import { solveWithBalanceConcept } from "../content/mathematics/linear-equations/solve-with-balance/concept.ts";
import {
  assertConceptPublicationFit,
  definePublicationEnvironment,
  evaluateConceptPublicationFitness,
  publishConceptDraft
} from "../src/authoring/public-api.ts";

const environment = definePublicationEnvironment({
  capabilities: [
    { id: "kp.equation", major: 1, implementationVersion: "1.4.0" },
    { id: "kp.equation", major: 2, implementationVersion: "2.0.0" }
  ],
  providers: [{
    id: "linear-problems.exact-rational",
    protocol: "linear-problem.v1",
    versions: ["1.0.0", "1.1.0"]
  }],
  styleRoles: ["equation.expression", "equation.operation", "diagram.balance", "focus.primary"]
});

test("publication fitness resolves exact parallel majors, protocols, and style roles", async () => {
  const artifact = await publishConceptDraft(solveWithBalanceConcept);
  assert.deepEqual(await evaluateConceptPublicationFitness(artifact, environment), {
    status: "passed",
    issues: []
  });
  const accepted = await assertConceptPublicationFit(artifact, environment);
  assert.equal(accepted.integrity, artifact.integrity);
  assert.equal(Object.isFrozen(accepted), true);
});

test("publication fitness rejects missing exact majors without falling forward", async () => {
  const artifact = await publishConceptDraft(solveWithBalanceConcept);
  const report = await evaluateConceptPublicationFitness(artifact, definePublicationEnvironment({
    ...environment,
    capabilities: [{ id: "kp.equation", major: 2, implementationVersion: "2.0.0" }]
  }));
  assert.equal(report.status, "rejected");
  assert.deepEqual(report.issues.map((issue) => issue.code), ["capability-unavailable"]);
});

test("publication fitness rejects incompatible providers and unavailable style roles", async () => {
  const artifact = await publishConceptDraft(solveWithBalanceConcept);
  const report = await evaluateConceptPublicationFitness(artifact, definePublicationEnvironment({
    ...environment,
    providers: [{
      id: "linear-problems.exact-rational",
      protocol: "linear-problem.v2",
      versions: ["2.0.0"]
    }],
    styleRoles: ["equation.expression"]
  }));
  assert.equal(report.status, "rejected");
  assert.deepEqual(report.issues.map((issue) => issue.code), [
    "provider-incompatible",
    "style-role-unavailable",
    "style-role-unavailable",
    "style-role-unavailable"
  ]);
});

test("publication fitness rejects tampering and authored runtime fields", async () => {
  const artifact = await publishConceptDraft(solveWithBalanceConcept);
  const tampered = await evaluateConceptPublicationFitness({
    ...artifact,
    manifest: { ...artifact.manifest, title: "Tampered" }
  }, environment);
  assert.deepEqual(tampered.issues.map((issue) => issue.code), ["integrity-mismatch"]);

  const executableInput = {
    ...artifact,
    manifest: { ...artifact.manifest, onEnter: "javascript:run()" }
  };
  const executable = await evaluateConceptPublicationFitness(executableInput, environment);
  assert.deepEqual(executable.issues.map((issue) => issue.code), ["artifact-invalid"]);
  await assert.rejects(() => assertConceptPublicationFit(executableInput, environment));
});

test("publication environments reject ambiguous availability", () => {
  assert.throws(() => definePublicationEnvironment({
    ...environment,
    capabilities: [environment.capabilities[0]!, environment.capabilities[0]!]
  }), /Duplicate capability implementations/);
});
