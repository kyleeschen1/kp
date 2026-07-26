import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedCanonicalConstructionRequest,
  validateKpGovernedCanonicalConstructionRequest
} from "../src/authoring/canonical-animation-public-api.ts";

test("accepts the smallest governed request for an approved construction", () => {
  const request = createKpGovernedCanonicalConstructionRequest(validRequest());

  assert.equal(
    request.schemaVersion,
    "kp.governed-semantic-authoring-request.v2"
  );
  assert.deepEqual(request.approvedObjectIds, ["object.combined", "object.split"]);
  assert.deepEqual(request.approvedOperationIds, ["operation.split"]);
  assert.deepEqual(request.compositionIntent, {
    kind: "sequence",
    operationIds: ["operation.split"]
  });
  assert.equal(Object.isFrozen(request), true);
  assert.equal(Object.isFrozen(request.explanationPurpose.objectIds), true);
  assert.deepEqual(structuredClone(request), JSON.parse(JSON.stringify(request)));
  assert.equal("providerNote" in request, false);
});

test("rejects unknown, duplicate, and uncovered semantic references", () => {
  const input = validRequest();
  const issues = validateKpGovernedCanonicalConstructionRequest({
    ...input,
    approvedObjectIds: ["object.combined", "object.combined"],
    approvedOperationIds: ["operation.split", "operation.merge"],
    explanationPurpose: {
      ...input.explanationPurpose,
      objectIds: ["object.unknown"],
      operationIds: ["operation.unknown"]
    },
    compositionIntent: {
      kind: "sequence",
      operationIds: ["operation.split"]
    }
  });

  assert.ok(issues.some(({ code, path }) =>
    code === "governed-schema.duplicate" &&
    path === "$.approvedObjectIds[1]"
  ));
  assert.deepEqual(
    issues
      .filter(({ code }) => code === "governed-schema.reference")
      .map(({ path }) => path),
    [
      "$.explanationPurpose.objectIds[0]",
      "$.explanationPurpose.operationIds[0]"
    ]
  );
  assert.ok(issues.some(({ code, message }) =>
    code === "governed-schema.required" &&
    message.includes("operation.merge")
  ));
});

test("rejects visual recipes at any nesting depth", () => {
  const issues = validateKpGovernedCanonicalConstructionRequest({
    ...validRequest(),
    providerNote: "This benign extra is discarded.",
    extension: {
      visualRecipe: {
        targetLatex: String.raw`\frac{x}{2}`,
        geometryPlan: { x: 10, y: 20 },
        timingTable: [0, 0.5, 1],
        easing: "ease-in-out",
        opacity: 0.5,
        fontFamily: "KaTeX_Main",
        rendererMode: "glyph",
        htmlFragment: "<span>x</span>"
      }
    }
  });

  assert.deepEqual(
    [...new Set(
      issues
        .filter(({ code }) => code === "governed-schema.unsafe-authority")
        .map(({ path }) => path)
    )],
    [
      "$.extension.visualRecipe",
      "$.extension.visualRecipe.targetLatex",
      "$.extension.visualRecipe.geometryPlan",
      "$.extension.visualRecipe.geometryPlan.x",
      "$.extension.visualRecipe.geometryPlan.y",
      "$.extension.visualRecipe.timingTable",
      "$.extension.visualRecipe.easing",
      "$.extension.visualRecipe.opacity",
      "$.extension.visualRecipe.fontFamily",
      "$.extension.visualRecipe.rendererMode",
      "$.extension.visualRecipe.htmlFragment"
    ]
  );
});

test("rejects unregistered intent vocabulary and empty explanatory purpose", () => {
  const input = validRequest();
  const issues = validateKpGovernedCanonicalConstructionRequest({
    ...input,
    explanationPurpose: {
      kind: "make-pretty",
      objectIds: [],
      operationIds: []
    },
    detailLevel: "cinematic",
    compositionIntent: {
      kind: "crossfade",
      operationIds: ["operation.split"]
    }
  });

  assert.deepEqual(
    issues
      .filter(({ code }) => code === "governed-schema.enum")
      .map(({ path }) => path),
    [
      "$.explanationPurpose.kind",
      "$.detailLevel",
      "$.compositionIntent.kind"
    ]
  );
  assert.ok(issues.some(({ path, code }) =>
    code === "governed-schema.required" &&
    path === "$.explanationPurpose"
  ));
});

function validRequest() {
  return {
    schemaVersion: "kp.governed-semantic-authoring-request.v2" as const,
    id: "request.fraction.split",
    source: {
      kind: "verified-semantic-source" as const,
      sourceId: "asset.numerator-split-merge-equation",
      revisionId: "1",
      operationPacks: [{ packId: "kp.algebra", version: "1.0.0" }]
    },
    approvedObjectIds: ["object.combined", "object.split"],
    approvedOperationIds: ["operation.split"],
    explanationPurpose: {
      kind: "transmit" as const,
      objectIds: ["object.combined", "object.split"],
      operationIds: ["operation.split"]
    },
    detailLevel: "complete" as const,
    compositionIntent: {
      kind: "sequence" as const,
      operationIds: ["operation.split"]
    },
    providerNote: "This benign extra is not part of the accepted request."
  };
}
