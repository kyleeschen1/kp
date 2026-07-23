import assert from "node:assert/strict";
import test from "node:test";

import {
  applyKpGovernedSemanticRepairPatch,
  compileKpGovernedSemanticAuthoring,
  type KpGovernedSemanticSourceAuthority
} from "../src/authoring/governed-semantic-compiler.ts";
import type {
  KpGovernedSemanticAuthoringRequest
} from "../src/authoring/governed-semantic-request.ts";

test("governed compiler deterministically derives operation governance and provenance", () => {
  const first = compile();
  const second = compile();

  assert.equal(first.status, "accepted");
  assert.equal(second.status, "accepted");
  if (first.status !== "accepted" || second.status !== "accepted") return;
  assert.match(first.fingerprint, /^fnv1a64:[a-f0-9]{16}$/);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.plan, second.plan);
  assert.deepEqual(first.plan.operation.canonicalComposition, [
    "kp.core.persist",
    "kp.core.fan-out",
    "kp.core.eliminate",
    "kp.core.reorder"
  ]);
  assert.deepEqual(first.plan.operation.governance.pacing, {
    kind: "per-descendant",
    semanticUnitCount: 2
  });
  assert.ok(first.plan.operation.governance.lawIds.length > 0);
  assert.deepEqual(first.plan.provenance, {
    source: {
      sourceId: "fixture.fraction-fan-out.two-thirds-x-plus-six",
      revisionId: "revision.fixture.fraction-fan-out.v1",
      evidenceIds: [
        "evidence.fraction-fan-out.verified-law",
        "evidence.fraction-fan-out.lineage"
      ]
    },
    provider: {
      providerId: "provider.test",
      modelId: "model.semantic-author",
      responseId: "response.distribution.001"
    },
    compiler: {
      compilerVersion: "kp.governed-semantic-compiler.v1",
      requestSchemaVersion: "kp.governed-semantic-authoring-request.v1"
    }
  });
  assert.ok(Object.isFrozen(first.plan));
  assert.ok(Object.isFrozen(first.plan.provenance.provider));
});

test("source revision rejection offers one local repair without disturbing other intent", () => {
  const request = validRequest({
    source: {
      ...validRequest().source,
      revisionId: "revision.fixture.fraction-fan-out.stale"
    }
  });
  const rejected = compile(request);

  assert.equal(rejected.status, "repair-required");
  if (rejected.status !== "repair-required") return;
  const revisionDiagnostic = rejected.diagnostics.find(({ path }) =>
    path === "$.source.revisionId"
  );
  assert.deepEqual(revisionDiagnostic?.repair.suggestedPatch, {
    kind: "replace-source-revision",
    expectedRevisionId: "revision.fixture.fraction-fan-out.stale",
    replacementRevisionId: "revision.fixture.fraction-fan-out.v1"
  });
  const patch = revisionDiagnostic?.repair.suggestedPatch;
  assert.ok(patch);
  const repaired = applyKpGovernedSemanticRepairPatch(request, patch!);

  assert.notEqual(repaired.source, request.source);
  assert.equal(repaired.operationIntent, request.operationIntent);
  assert.equal(repaired.focusIntent, request.focusIntent);
  assert.equal(compile(repaired).status, "accepted");
});

test("operation role and normal-form failures remain typed repair requests", () => {
  const unknownOperation = compile(validRequest({
    operationIntent: {
      ...validRequest().operationIntent,
      operationId: "kp.algebra.not-registered"
    }
  }));
  assert.equal(unknownOperation.status, "repair-required");
  if (unknownOperation.status === "repair-required") {
    assert.deepEqual(unknownOperation.diagnostics[0]?.repair.allowedPatchKinds, [
      "replace-operation-id"
    ]);
  }

  const badRole = compile(validRequest({
    operationIntent: {
      ...validRequest().operationIntent,
      roleBindings: {
        ...validRequest().operationIntent.roleBindings,
        "factor-before": ["factor", "addend.x"]
      }
    }
  }));
  assert.equal(badRole.status, "repair-required");
  if (badRole.status === "repair-required") {
    assert.ok(badRole.diagnostics.some(({ code, path, repair }) =>
      code === "governed-compile.role" &&
      path === "$.operationIntent.roleBindings.factor-before" &&
      repair.allowedPatchKinds.includes("replace-role-binding")
    ));
  }

  const unsupportedNormalForm = compile(validRequest({
    normalFormIntent: {
      ...validRequest().normalFormIntent,
      normalFormId: "factored-product"
    }
  }));
  assert.equal(unsupportedNormalForm.status, "repair-required");
  if (unsupportedNormalForm.status === "repair-required") {
    assert.deepEqual(
      unsupportedNormalForm.diagnostics.find(({ code }) =>
        code === "governed-compile.normal-form"
      )?.repair.suggestedPatch,
      {
        kind: "replace-normal-form",
        expectedNormalFormId: "factored-product",
        replacementNormalFormId: "distributed-sum"
      }
    );
  }
});

test("unsafe provider authority is rejected without compiling a fallback", () => {
  const rejected = compile({
    ...validRequest(),
    timing: { durationMs: 900 },
    renderer: { selectorId: "#equation" }
  });

  assert.equal(rejected.status, "repair-required");
  if (rejected.status !== "repair-required") return;
  assert.deepEqual(
    rejected.diagnostics
      .filter(({ code }) => code === "governed-schema.unsafe-authority")
      .map(({ path }) => path),
    [
      "$.timing",
      "$.timing.durationMs",
      "$.renderer",
      "$.renderer.selectorId"
    ]
  );
  assert.equal("plan" in rejected, false);
  assert.equal("fingerprint" in rejected, false);
});

function compile(request: unknown = validRequest()) {
  return compileKpGovernedSemanticAuthoring({
    request,
    sources: [sourceAuthority()],
    provenance: {
      providerId: "provider.test",
      modelId: "model.semantic-author",
      responseId: "response.distribution.001"
    }
  });
}

function validRequest(
  overrides: Partial<KpGovernedSemanticAuthoringRequest> = {}
): KpGovernedSemanticAuthoringRequest {
  return {
    schemaVersion: "kp.governed-semantic-authoring-request.v1",
    id: "request.distribute-two-over-three",
    title: "Explain fraction distribution",
    source: {
      kind: "verified-semantic-source",
      sourceId: "fixture.fraction-fan-out.two-thirds-x-plus-six",
      revisionId: "revision.fixture.fraction-fan-out.v1",
      entityIds: [
        "factor",
        "addend.x",
        "addend.6",
        "factor.x",
        "factor.6",
        "product.x",
        "product.6"
      ],
      expressionIds: [
        "fraction-fan-out.source.root",
        "fraction-fan-out.target.root"
      ],
      operationPacks: [
        { packId: "kp.core", version: "1.0.0" },
        { packId: "kp.algebra", version: "0.1.0" }
      ]
    },
    operationIntent: {
      operationId: "kp.algebra.distribute-multiplication",
      roleBindings: {
        "factor-before": ["factor"],
        "addends-before": ["addend.x", "addend.6"],
        "factor-copies": ["factor.x", "factor.6"],
        "products-after": ["product.x", "product.6"]
      },
      correspondence: [{
        relation: "fan-out",
        sourceEntityIds: ["factor"],
        targetEntityIds: ["factor.x", "factor.6"]
      }]
    },
    focusIntent: {
      kind: "transmit",
      sourceEntityIds: ["factor"],
      targetEntityIds: ["factor.x", "factor.6"]
    },
    cadenceIntent: {
      kind: "together",
      branchEntityIds: ["factor.x", "factor.6"]
    },
    normalFormIntent: {
      normalFormId: "distributed-sum",
      sourceExpressionId: "fraction-fan-out.source.root",
      targetExpressionId: "fraction-fan-out.target.root"
    },
    compressionIntent: {
      level: "key-steps",
      preserve: ["law", "lineage", "witness"]
    },
    ...overrides
  };
}

function sourceAuthority(): KpGovernedSemanticSourceAuthority {
  const request = validRequest();
  return {
    sourceId: request.source.sourceId,
    revisionId: request.source.revisionId,
    entityIds: request.source.entityIds,
    expressionIds: request.source.expressionIds,
    supportedNormalFormIds: ["distributed-sum"],
    evidenceIds: [
      "evidence.fraction-fan-out.verified-law",
      "evidence.fraction-fan-out.lineage"
    ]
  };
}
