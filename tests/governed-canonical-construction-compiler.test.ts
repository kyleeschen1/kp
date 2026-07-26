import assert from "node:assert/strict";
import test from "node:test";

import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  compileKpGovernedCanonicalConstruction,
  findKpForbiddenPresentationAuthority,
  KpGovernedConstructionVerificationError,
  validateKpGovernedCanonicalConstructionCompilation,
  type KpGovernedCanonicalConstructionRequest,
  type KpGovernedConstructionSourceAuthority
} from "../src/authoring/public-api.ts";
import {
  numeratorSplitMergeEquationAssetIds
} from "../src/semantic/numerator-split-merge-equation-asset.ts";

const ids = numeratorSplitMergeEquationAssetIds;

test("compiler resolves fraction truth, roles, normal forms, and lineage", () => {
  const result = compileKpGovernedCanonicalConstruction({
    request: request(),
    authority: authority()
  });

  assert.equal(result.kind, "verified-governed-canonical-construction");
  assert.equal(
    result.construction.title,
    "Split and merge a fraction across its numerator sum"
  );
  assert.deepEqual(
    result.construction.operations.map(({ transformationId }) => transformationId),
    [ids.splitTransform, ids.mergeTransform]
  );
  assert.deepEqual(
    result.mathematicalVerification.operations.map((operation) => ({
      operationId: operation.operationId,
      definitionId: operation.definitionId,
      strictLawIds: operation.strictLawIds,
      sourceExpressionIds: operation.sourceTruth.expressionIds,
      targetExpressionIds: operation.targetTruth.expressionIds,
      lineageCount: operation.lineageIds.length
    })),
    [
      {
        operationId: ids.splitTransform,
        definitionId: "definition.symbolic.algebra.split-fraction-sum",
        strictLawIds: ["law.algebra.fraction-sum-split"],
        sourceExpressionIds: [ids.combined],
        targetExpressionIds: [ids.split],
        lineageCount: 6
      },
      {
        operationId: ids.mergeTransform,
        definitionId: "definition.symbolic.algebra.merge-fractions",
        strictLawIds: ["law.algebra.fraction-sum-merge"],
        sourceExpressionIds: [ids.split],
        targetExpressionIds: [ids.combined],
        lineageCount: 6
      }
    ]
  );
  assert.ok(
    Object.keys(
      result.mathematicalVerification.operations[0]!.roleBindings
    ).every((roleId) => roleId.startsWith("correspondence."))
  );
  assert.deepEqual(
    structuredClone(result),
    JSON.parse(JSON.stringify(result))
  );
  assert.deepEqual(findKpForbiddenPresentationAuthority(result), []);
  assert.equal(Object.isFrozen(result.mathematicalVerification.operations), true);
});

test("compiler rejects stale source, pack, object, and operation references", () => {
  const input = request();
  const issues = validateKpGovernedCanonicalConstructionCompilation({
    request: {
      ...input,
      source: {
        ...input.source,
        sourceId: "asset.stale",
        revisionId: "0",
        operationPacks: [{ packId: "kp.algebra", version: "0.9.0" }]
      },
      approvedObjectIds: [ids.combined, "equation.unknown"],
      approvedOperationIds: [ids.splitTransform, "transform.unknown"],
      explanationPurpose: {
        ...input.explanationPurpose,
        objectIds: [ids.combined],
        operationIds: [ids.splitTransform]
      },
      compositionIntent: {
        kind: "sequence",
        operationIds: [ids.splitTransform]
      }
    },
    authority: authority()
  });

  assert.deepEqual(
    [...new Set(issues.map(({ code }) => code))],
    [
      "governed-verification.request",
      "governed-verification.source",
      "governed-verification.pack",
      "governed-verification.object",
      "governed-verification.operation",
      "governed-verification.closure"
    ]
  );
});

test("compiler rejects operations without definition, strict law, or lineage", () => {
  const source = authority();
  const first = source.animation.transformations[0]!;
  const compromised = {
    ...source,
    animation: {
      ...source.animation,
      transformations: [{
        ...first,
        definitionId: undefined,
        lawRefs: [{ id: "law.unverified", level: "lax" as const }],
        correspondenceMap: { id: "correspondence.empty", records: [] }
      }, ...source.animation.transformations.slice(1)]
    }
  };
  const issues = validateKpGovernedCanonicalConstructionCompilation({
    request: request(),
    authority: compromised
  });

  assert.ok(issues.some(({ code }) =>
    code === "governed-verification.definition"
  ));
  assert.ok(issues.some(({ code }) => code === "governed-verification.law"));
  assert.ok(issues.some(({ code }) => code === "governed-verification.lineage"));
  assert.throws(
    () => compileKpGovernedCanonicalConstruction({
      request: request(),
      authority: compromised
    }),
    KpGovernedConstructionVerificationError
  );
});

test("provider wording and presentation fields cannot become mathematical truth", () => {
  const input = {
    ...request(),
    title: "Pretend the answer is different",
    targetLatex: "x = 999",
    roleBindings: { invented: ["selector.fake"] },
    normalForm: "provider-invented",
    lineage: [{ source: "fake", target: "fake" }]
  } as unknown as KpGovernedCanonicalConstructionRequest;
  const issues = validateKpGovernedCanonicalConstructionCompilation({
    request: input,
    authority: authority()
  });

  assert.ok(issues.some(({ code, path }) =>
    code === "governed-verification.request" &&
    path === "$.targetLatex"
  ));
  assert.throws(
    () => compileKpGovernedCanonicalConstruction({
      request: input,
      authority: authority()
    }),
    KpGovernedConstructionVerificationError
  );
});

function authority(): KpGovernedConstructionSourceAuthority {
  return {
    sourceId: "asset.numerator-split-merge-equation",
    revisionId: "1",
    operationPacks: [{ packId: "kp.algebra", version: "1.0.0" }],
    animation: createNumeratorSplitMergeEquationAnimationAsset()
  };
}

function request(): KpGovernedCanonicalConstructionRequest {
  return {
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.fraction.round-trip",
    source: {
      kind: "verified-semantic-source",
      sourceId: "asset.numerator-split-merge-equation",
      revisionId: "1",
      operationPacks: [{ packId: "kp.algebra", version: "1.0.0" }]
    },
    approvedObjectIds: [ids.combined, ids.split],
    approvedOperationIds: [ids.splitTransform, ids.mergeTransform],
    explanationPurpose: {
      kind: "transmit",
      objectIds: [ids.combined, ids.split],
      operationIds: [ids.splitTransform, ids.mergeTransform]
    },
    detailLevel: "complete",
    compositionIntent: {
      kind: "sequence",
      operationIds: [ids.splitTransform, ids.mergeTransform]
    }
  };
}
