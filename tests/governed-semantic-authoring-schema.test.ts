import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedSemanticAuthoringRequest,
  validateKpGovernedSemanticAuthoringRequest
} from "../src/authoring/governed-semantic-request.ts";

test("governed schema exposes only referential semantic authoring intent", () => {
  const request = createKpGovernedSemanticAuthoringRequest(validRequest());

  assert.deepEqual(request, validRequest());
  assert.ok(Object.isFrozen(request));
  assert.ok(Object.isFrozen(request.operationIntent.roleBindings));
  assert.deepEqual(Object.keys(request), [
    "schemaVersion",
    "id",
    "title",
    "source",
    "operationIntent",
    "focusIntent",
    "cadenceIntent",
    "normalFormIntent",
    "compressionIntent"
  ]);
});

test("governed schema rejects provider control over math text rendering geometry and timing", () => {
  const unsafe = {
    ...validRequest(),
    latex: "2(x+3)",
    rendering: {
      selectorId: "#equation",
      x: 120,
      keyframes: [{ opacity: 0 }],
      durationMs: 900,
      css: "color: red"
    }
  };
  const issues = validateKpGovernedSemanticAuthoringRequest(unsafe);

  assert.deepEqual(
    issues.filter(({ code }) => code === "governed-schema.unsafe-authority")
      .map(({ path }) => path),
    [
      "$.latex",
      "$.rendering",
      "$.rendering.selectorId",
      "$.rendering.x",
      "$.rendering.keyframes",
      "$.rendering.keyframes[0].opacity",
      "$.rendering.durationMs",
      "$.rendering.css"
    ]
  );
});

test("governed schema requires exact semantic references and noncompressible evidence", () => {
  const invalid = validRequest();
  const issues = validateKpGovernedSemanticAuthoringRequest({
    ...invalid,
    source: { ...invalid.source, entityIds: ["factor", "factor"] },
    cadenceIntent: { kind: "cinematic", branchEntityIds: [] },
    normalFormIntent: {
      ...invalid.normalFormIntent,
      normalFormId: "make-it-pretty"
    },
    compressionIntent: { level: "summary", preserve: ["witness"] }
  });

  assert.ok(issues.some(({ code, path }) =>
    code === "governed-schema.duplicate" && path === "$.source.entityIds[1]"
  ));
  assert.ok(issues.some(({ code, path }) =>
    code === "governed-schema.enum" && path === "$.cadenceIntent.kind"
  ));
  assert.ok(issues.some(({ code, path }) =>
    code === "governed-schema.enum" && path === "$.normalFormIntent.normalFormId"
  ));
  assert.ok(issues.some(({ code, path }) =>
    code === "governed-schema.required" && path === "$.compressionIntent.preserve"
  ));
});

function validRequest() {
  return {
    schemaVersion: "kp.governed-semantic-authoring-request.v1" as const,
    id: "request.distribute-two-over-three",
    title: "Explain fraction distribution",
    source: {
      kind: "verified-semantic-source" as const,
      sourceId: "fixture.fraction-fan-out.two-thirds-x-plus-six",
      revisionId: "revision.fixture.fraction-fan-out.v1",
      entityIds: ["factor", "addend.x", "addend.6", "factor.x", "factor.6"],
      expressionIds: ["fraction-fan-out.source.root", "fraction-fan-out.target.root"],
      operationPacks: [
        { packId: "kp.core", version: "1.0.0" },
        { packId: "kp.algebra", version: "0.1.0" }
      ]
    },
    operationIntent: {
      operationId: "kp.algebra.distribute-multiplication",
      roleBindings: {
        "common-factor": ["factor"],
        "source-addends": ["addend.x", "addend.6"],
        "factor-copies": ["factor.x", "factor.6"]
      },
      correspondence: [{
        relation: "fan-out" as const,
        sourceEntityIds: ["factor"],
        targetEntityIds: ["factor.x", "factor.6"]
      }]
    },
    focusIntent: {
      kind: "transmit" as const,
      sourceEntityIds: ["factor"],
      targetEntityIds: ["factor.x", "factor.6"]
    },
    cadenceIntent: {
      kind: "together" as const,
      branchEntityIds: ["factor.x", "factor.6"]
    },
    normalFormIntent: {
      normalFormId: "distributed-sum" as const,
      sourceExpressionId: "fraction-fan-out.source.root",
      targetExpressionId: "fraction-fan-out.target.root"
    },
    compressionIntent: {
      level: "key-steps" as const,
      preserve: ["law" as const, "lineage" as const, "witness" as const]
    }
  };
}
