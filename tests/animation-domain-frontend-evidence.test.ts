import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpAnimationDomainFrontendEvidence,
  createKpAnimationDomainFrontendEvidence,
  KpAnimationDomainFrontendEvidenceError
} from "../src/architecture/animation-domain-frontend-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";

test("proved code and bounded graph frontends close only exact gaps", () => {
  const evidence = createKpAnimationDomainFrontendEvidence();
  assert.equal(evidence.authorities.length, 4);
  assert.equal(evidence.requirements.length, 9);
  const matched = evidence.requirements.filter(({ status }) =>
    status === "matched"
  );
  assert.deepEqual(matched.map(({ capabilityId }) => capabilityId), [
    "capability.code.typescript-refactoring",
    "capability.code.python-refactoring",
    "capability.graph-2d.function-transformations",
    "capability.graph-3d.scene-transformations"
  ]);
  assert.ok(matched.filter(({ domain }) => domain === "code")
    .every((requirement) =>
    requirement.status === "matched" &&
    requirement.evidence.proof?.length === 8
  ));
  assert.ok(evidence.requirements.filter(({ status }) => status === "missing")
    .every((requirement) =>
    requirement.status === "missing" &&
    requirement.reason === "frontend-required"
  ));
  assert.deepEqual(
    [...new Set(evidence.requirements.map(({ domain }) => domain))],
    ["matrix", "code", "graph-2d", "graph-3d"]
  );
});

test("a planned code authority cannot match without complete proof", () => {
  assert.throws(() => compileKpAnimationDomainFrontendEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: [{
      authorityId: "frontend.code.typescript-compiler.v1",
      domain: "code",
      sourcePath: "scripts/typescript-code-generation-frontend.ts",
      proof: []
    }]
  }), (error: unknown) => {
    assert.ok(error instanceof KpAnimationDomainFrontendEvidenceError);
    assert.deepEqual(error.diagnostics.map(({ code }) => code), [
      "frontend-evidence.proof-incomplete"
    ]);
    return true;
  });
});

test("every granted code obligation points to durable evidence", () => {
  const evidence = createKpAnimationDomainFrontendEvidence();
  for (const authority of evidence.authorities) {
    assert.equal(Object.isFrozen(authority.proof), true);
    for (const proof of authority.proof ?? []) {
      assert.equal(Object.isFrozen(proof.evidenceSourceIds), true);
      assert.ok(proof.evidenceSourceIds.every(existsSync), proof.obligation);
    }
  }
});

test("one exact domain authority closes only its declared requirements", () => {
  const evidence = compileKpAnimationDomainFrontendEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: [{
      authorityId: "frontend.matrix.semantic-composition.v1",
      domain: "matrix",
      sourcePath: "src/domains/matrix/semantic-composition-frontend.ts"
    }]
  });
  const matched = evidence.requirements.filter(({ status }) =>
    status === "matched"
  );
  assert.deepEqual(matched.map(({ capabilityId }) => capabilityId), [
    "capability.matrix.vector-composition",
    "capability.matrix.matrix-composition"
  ]);
  assert.ok(matched.every((entry) =>
    entry.status === "matched" &&
    entry.evidence.authorityId ===
      "frontend.matrix.semantic-composition.v1"
  ));
});

test("duplicate and cross-domain authority claims fail closed", () => {
  assert.throws(() => compileKpAnimationDomainFrontendEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: [{
      authorityId: "frontend.matrix.semantic-composition.v1",
      domain: "matrix",
      sourcePath: "src/domains/matrix/first.ts"
    }, {
      authorityId: "frontend.matrix.semantic-composition.v1",
      domain: "matrix",
      sourcePath: "src/domains/matrix/second.ts"
    }]
  }), (error: unknown) => {
    assert.ok(error instanceof KpAnimationDomainFrontendEvidenceError);
    assert.deepEqual(error.diagnostics.map(({ code }) => code), [
      "frontend-evidence.duplicate-authority"
    ]);
    return true;
  });

  assert.throws(() => compileKpAnimationDomainFrontendEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: [{
      authorityId: "frontend.matrix.semantic-composition.v1",
      domain: "code",
      sourcePath: "src/domains/code/not-a-matrix-frontend.ts"
    }]
  }), (error: unknown) => {
    assert.ok(error instanceof KpAnimationDomainFrontendEvidenceError);
    assert.deepEqual(error.diagnostics.map(({ code }) => code), [
      "frontend-evidence.domain-mismatch",
      "frontend-evidence.domain-mismatch"
    ]);
    return true;
  });
});

test("frontend evidence is a dependency-light join rather than a universal frontend", () => {
  const source = readFileSync(new URL(
    "../src/architecture/animation-domain-frontend-evidence.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:editor|rendering|domains)\//u);
  assert.doesNotMatch(source, /(?:Svelte|HTMLElement|SVGElement|WebGL)/u);
  assert.doesNotMatch(source, /(?:parse|render|compile)(?:Matrix|Code|Graph)/u);
});
