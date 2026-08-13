import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { createKpPythonRefactorBehaviorCertificate } from
  "../src/semantic/python-refactor-behavior-proof.ts";
import type { KpPythonRefactorSemanticArtifactV1 } from
  "../src/semantic/python-refactor-semantic-model.ts";

test("Python bounded certificate proves declared threshold cases", () => {
  const certificate = createKpPythonRefactorBehaviorCertificate(
    compileKpPythonRefactorSemantics()
  );

  assert.equal(certificate.status, "passed");
  assert.equal(certificate.scope, "declared-cases-only");
  assert.deepEqual(certificate.cases.map(({ id, total, equivalent }) => ({
    id,
    total,
    equivalent
  })), [
    { id: "below-threshold", total: 49, equivalent: true },
    { id: "at-threshold", total: 50, equivalent: true },
    { id: "above-threshold", total: 75, equivalent: true }
  ]);
  for (const { expected, before, after } of certificate.cases) {
    assert.deepEqual(before, expected);
    assert.deepEqual(after, expected);
  }
});

test("Python certificate rejects drifted semantic evidence", () => {
  const semantics = structuredClone(
    compileKpPythonRefactorSemantics()
  ) as KpPythonRefactorSemanticArtifactV1;
  const rule = semantics.revisions[0]!.entities.find(
    ({ id }) => id === "rule.shipping-cost.before"
  )! as { label: string };
  rule.label = "total > 50";

  assert.throws(
    () => createKpPythonRefactorBehaviorCertificate(semantics),
    /must resolve exactly/
  );
});

test("Python behavior proof never executes source or imports the frontend", () => {
  const source = readFileSync(
    new URL("../src/semantic/python-refactor-behavior-proof.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /\beval\s*\(|\bexec\s*\(/);
  assert.doesNotMatch(source, /child_process|python-refactor-frontend|python3/);
  assert.doesNotMatch(source, /new\s+Function\s*\(/);
});
