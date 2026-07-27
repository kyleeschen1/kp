import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../src/animation/foldable-distribution-equation-adapter.ts";
import {
  compileKpGovernedCanonicalConstruction,
  createKpGovernedCanonicalConstructionRequest,
  findKpForbiddenPresentationAuthority,
  type KpGovernedCanonicalConstructionRequest,
  type KpGovernedConstructionSourceAuthority
} from "../src/authoring/canonical-animation-public-api.ts";
import {
  assertKpCanonicalReaderPromotionCost,
  evaluateKpCanonicalReaderPromotionCost,
  type KpCanonicalReaderPromotionCostEvidence
} from "../src/architecture/canonical-reader-promotion-cost.ts";
import {
  compileKpFoldableDistributionAdaptiveProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";
import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";

const operationPacks = [{
  packId: "kp.algebra",
  version: "1.0.0"
}] as const;

test("governed authoring selects the verified trace and fold intent without paint authority", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const operationIds = animation.transformations.map(({ id }) => id);
  const objectIds = animation.bundle.objects.map(({ id }) => id);
  const request = governedRequest();
  const result = compileKpGovernedCanonicalConstruction({
    request,
    authority: governedAuthority()
  });
  const foldIntent = createKpFoldableDistributionFoldIntent({
    mode: "automatic"
  });
  const projection = compileKpFoldableDistributionAdaptiveProjection({
    intent: foldIntent,
    detailBudget: "balanced"
  });

  assert.deepEqual(request.approvedOperationIds, operationIds);
  assert.deepEqual(
    result.construction.operations.map(({ transformationId }) =>
      transformationId
    ),
    operationIds
  );
  assert.deepEqual(
    result.mathematicalVerification.operations.map(({ operationId }) =>
      operationId
    ),
    operationIds
  );
  assert.ok(result.mathematicalVerification.operations.every((operation) =>
    operation.strictLawIds.length > 0 &&
    operation.lineageIds.length > 0
  ));
  assert.deepEqual(projection.operationIds, operationIds);
  assert.deepEqual(projection.semanticTruth.operationIds, operationIds);
  assert.deepEqual(
    projection.semanticTruth.sourceObjectIds,
    [objectIds[0]]
  );
  assert.deepEqual(
    projection.semanticTruth.targetObjectIds,
    [objectIds.at(-1)]
  );
  assert.deepEqual(findKpForbiddenPresentationAuthority(request), []);
  assert.deepEqual(findKpForbiddenPresentationAuthority(foldIntent), []);
  assert.deepEqual(findKpForbiddenPresentationAuthority(result), []);
});

test("governed authoring rejects animation-level instructions", () => {
  assert.throws(
    () => createKpGovernedCanonicalConstructionRequest({
      ...governedRequest(),
      keyframes: [{
        selectorId: "distributed.term-3x",
        opacity: 0,
        x: 48,
        y: 12
      }]
    }),
    /outside the construction request boundary/
  );
});

test("promotion cost separates foundational repair from repeat authoring", () => {
  const foundationalRepair: KpCanonicalReaderPromotionCostEvidence = {
    schemaVersion: "kp.canonical-reader-promotion-cost.v1",
    promotionId: "platform.foldable-distribution.choreography-repair",
    changedFiles: [
      "src/rendering/native-katex-scene-compositor.ts",
      "src/reader/renderers/equation-scene-compositor-adapter.ts",
      "src/reader/renderers/equation-render-plan.ts",
      "src/rendering/native-katex-paint-geometry.ts"
    ],
    addedLifecycleCategories: [],
    addedSchedulerCategories: [],
    notationSpecificGeometryFiles: [],
    addedRuntimeArtifactIds: []
  };
  const repeatAuthoring: KpCanonicalReaderPromotionCostEvidence = {
    schemaVersion: "kp.canonical-reader-promotion-cost.v1",
    promotionId: "promotion.foldable-distribution.governed-authoring-proof",
    changedFiles: [
      "tests/foldable-distribution-governed-authoring-cost.test.ts",
      "docs/project/reviews/2026-07-27-foldable-distribution-collection-long-loop-proposal.md",
      "docs/theseus/events/2026-07-27.jsonl",
      "docs/theseus/nodes/next-actions/next-action.kp.foldable-distribution-collection-exemplar-v0.json",
      "docs/theseus/nodes/run-contracts/run-contract.kp.foldable-distribution-collection-v1.json",
      "package.json"
    ],
    addedLifecycleCategories: [],
    addedSchedulerCategories: [],
    notationSpecificGeometryFiles: [],
    addedRuntimeArtifactIds: []
  };
  const foundationalIssues =
    evaluateKpCanonicalReaderPromotionCost(foundationalRepair);

  assert.ok(foundationalIssues.some(({ kind }) =>
    kind === "compositor-core-change"
  ));
  assert.ok(foundationalIssues.some(({ kind }) =>
    kind === "unclassified-change"
  ));
  assert.deepEqual(evaluateKpCanonicalReaderPromotionCost(repeatAuthoring), []);
  assert.doesNotThrow(() =>
    assertKpCanonicalReaderPromotionCost(repeatAuthoring)
  );
});

function governedAuthority(): KpGovernedConstructionSourceAuthority {
  return {
    sourceId: "animation.foldable-distribution.collect-like-terms",
    revisionId: "1",
    operationPacks,
    animation: createKpFoldableDistributionEquationAnimationAsset()
  };
}

function governedRequest(): KpGovernedCanonicalConstructionRequest {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const objectIds = animation.bundle.objects.map(({ id }) => id);
  const operationIds = animation.transformations.map(({ id }) => id);
  return {
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.foldable-distribution.complete",
    source: {
      kind: "verified-semantic-source",
      sourceId: animation.id,
      revisionId: "1",
      operationPacks
    },
    approvedObjectIds: objectIds,
    approvedOperationIds: operationIds,
    explanationPurpose: {
      kind: "cause",
      objectIds,
      operationIds
    },
    detailLevel: "key-steps",
    compositionIntent: {
      kind: "compound",
      operationIds
    }
  };
}
