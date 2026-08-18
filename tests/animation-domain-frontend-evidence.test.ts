import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpAnimationDomainFrontendEvidence,
  createKpAnimationDomainFrontendEvidence,
  KpAnimationDomainFrontendEvidenceError
} from "../src/architecture/animation-domain-frontend-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";

test("every planned cross-domain frontend remains an exact typed gap", () => {
  const evidence = createKpAnimationDomainFrontendEvidence();
  assert.equal(evidence.authorities.length, 0);
  assert.equal(evidence.requirements.length, 9);
  assert.ok(evidence.requirements.every((requirement) =>
    requirement.status === "missing" &&
    requirement.reason === "frontend-required"
  ));
  assert.deepEqual(
    [...new Set(evidence.requirements.map(({ domain }) => domain))],
    ["matrix", "code", "graph-2d", "graph-3d"]
  );
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
