import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpTypeScriptRefactorSemantics } from "../scripts/typescript-refactor-semantic-compiler.ts";
import { createKpTypeScriptRefactorBehaviorCertificate } from "../src/semantic/typescript-refactor-behavior-proof.ts";
import type { KpTypeScriptRefactorSemanticArtifactV1 } from "../src/semantic/typescript-refactor-semantic-model.ts";

test("bounded certificate proves declared threshold cases before and after", () => {
  const certificate = createKpTypeScriptRefactorBehaviorCertificate(
    compileKpTypeScriptRefactorSemantics()
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
  certificate.cases.forEach(({ expected, before, after }) => {
    assert.deepEqual(before, expected);
    assert.deepEqual(after, expected);
  });
  assert.deepEqual(JSON.parse(JSON.stringify(certificate)), certificate);
});

test("certificate rejects semantic evidence that no longer matches source", () => {
  const semantics = structuredClone(
    compileKpTypeScriptRefactorSemantics()
  ) as KpTypeScriptRefactorSemanticArtifactV1;
  const rule = semantics.revisions[0]!.entities.find(
    ({ id }) => id === "rule.shipping-cost.before"
  )! as { label: string };
  rule.label = "total > 50";

  assert.throws(
    () => createKpTypeScriptRefactorBehaviorCertificate(semantics),
    /must resolve exactly/
  );
});

test("behavior proof contains no arbitrary source execution mechanism", () => {
  const source = readFileSync(
    new URL("../src/semantic/typescript-refactor-behavior-proof.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.doesNotMatch(source, /\bFunction\s*\(/);
  assert.doesNotMatch(source, /node:vm|child_process/);
  assert.doesNotMatch(source, /typescript-refactor-frontend|from\s+["']typescript["']/);
});
