import assert from "node:assert/strict";
import test from "node:test";

import generatedAudit from
  "../src/architecture/generic-equation-fallback-audit.generated.json" with {
    type: "json"
  };
import authority from
  "../src/architecture/equation-surface-authority-graph.generated.json" with {
    type: "json"
  };
import reachability from
  "../src/architecture/exact-equation-reachability-graph.generated.json" with {
    type: "json"
  };
import {
  compileKpGenericEquationFallbackAudit,
  KpGenericEquationFallbackAuditError
} from "../src/architecture/generic-equation-fallback-audit.ts";

const input = {
  authority: authority as Parameters<
    typeof compileKpGenericEquationFallbackAudit
  >[0]["authority"],
  reachability: reachability as Parameters<
    typeof compileKpGenericEquationFallbackAudit
  >[0]["reachability"]
};

test("generated fallback audit classifies every generic and failed-stage path", () => {
  const audit = compileKpGenericEquationFallbackAudit(input);
  assert.deepEqual(generatedAudit, audit);
  assert.equal(audit.entries.length, 9);
  assert.deepEqual(
    audit.entries.filter(({ status }) => status === "live-compatibility")
      .map(({ nodeId }) => nodeId),
    [
      "motif.generic-transition",
      "timing.generic-phase-easing",
      "renderer.generic-dom-measurement",
      "fallback.generic-whole-equation",
      "sampler.generic-semantic-token"
    ]
  );
  assert.equal(
    audit.entries.filter(({ status }) => status === "live-canonical").length,
    4
  );
  assert.equal(audit.entries.some(({ status }) => status === "unreachable"), false);
});

test("generic whole-equation fallback is live on 28 surfaces and not deletable", () => {
  const audit = compileKpGenericEquationFallbackAudit(input);
  const fallback = audit.entries.find(
    ({ nodeId }) => nodeId === "fallback.generic-whole-equation"
  )!;
  assert.equal(fallback.surfaceAnimationIds.length, 28);
  assert.equal(fallback.status, "live-compatibility");
  assert.equal(fallback.retirementDecision, "retain-live");
  assert.ok(fallback.sourceCallers.length > 0);
  assert.equal(fallback.replacementOwnerNodeIds.length, 4);
});

test("audit fails closed when a path loses exact reachability", () => {
  assert.throws(
    () => compileKpGenericEquationFallbackAudit({
      ...input,
      reachability: {
        ...input.reachability,
        roots: input.reachability.roots.filter(
          ({ authorityId }) => authorityId !== "fallback.generic-whole-equation"
        )
      }
    }),
    (error: unknown) =>
      error instanceof KpGenericEquationFallbackAuditError &&
      error.diagnostics.some((message) =>
        message.includes("fallback.generic-whole-equation")
      )
  );
});
