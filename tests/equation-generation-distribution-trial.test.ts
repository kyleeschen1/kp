import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import {
  compileKpDistributionFactoringPresentationPlan
} from "../src/animation/distribution-factoring-presentation-plan.ts";
import {
  kpEquationGenerationPressureFixtures
} from "../src/authoring/equation-generation-pressure-contract.ts";
import {
  validateKpEquationLlmAuthoringRequest,
  type KpEquationLlmAuthoringRequest
} from "../src/authoring/equation-llm-authoring-catalogue.ts";
import {
  kpDistributionCanonicalOperationSpec
} from "../src/semantic/distribution-canonical-operation.ts";
import {
  kpCanonicalDistributionPressureContract
} from "../src/semantic/distribution-pressure-contract.ts";

const fixture = kpEquationGenerationPressureFixtures.find(
  ({ scenario }) => scenario === "distribution-factoring"
)!;
const contract = kpCanonicalDistributionPressureContract;
const distribution = createDistributionExpansionAnimationAsset();
const factoring = createDistributionFactoringAnimationAsset();

test("distribution first pass exposes unresolved semantic aliases", () => {
  assert.equal(
    validateKpEquationLlmAuthoringRequest(fixture.request).status,
    "accepted"
  );
  assert.deepEqual(unresolvedEntityIds(
    fixture.request,
    canonicalSemanticIds()
  ), [
    "source.factor.a",
    "source.addend.x",
    "source.addend.y",
    "target.factor.a.0",
    "target.factor.a.1",
    "target.product.ax",
    "target.product.ay"
  ]);
});

test("one semantic-id repair preserves cardinality and product topology", () => {
  const repaired = distributionRequestWithCanonicalEntityIds();

  assert.equal(validateKpEquationLlmAuthoringRequest(repaired).status, "accepted");
  assert.deepEqual(unresolvedEntityIds(repaired, canonicalSemanticIds()), []);
  assert.deepEqual(repaired.operation.roleBindings, {
    "factor-before": [contract.source.factorSelectorId],
    "addends-before": [
      contract.source.leftAddendSelectorId,
      contract.source.rightAddendSelectorId
    ],
    "factor-copies": contract.factorFanOut.targetFactorSelectorIds,
    "products-after": contract.productAttachments.map(({ id }) => id)
  });
  assert.equal(repaired.operation.roleBindings["addends-before"]?.length, 2);
  assert.equal(repaired.operation.roleBindings["factor-copies"]?.length, 2);
  assert.equal(repaired.operation.roleBindings["products-after"]?.length, 2);
});

test("the repaired request reaches canonical fan-out and inverse factoring", () => {
  const distributionPlan = compileKpDistributionFactoringPresentationPlan({
    transformation: distribution.transformations[0]!,
    sourceSelectorIds: distribution.bundle.objects[0]!.selectors.map(({ id }) => id),
    targetSelectorIds: distribution.bundle.objects[1]!.selectors.map(({ id }) => id)
  });
  const factoringPlan = compileKpDistributionFactoringPresentationPlan({
    transformation: factoring.transformations[0]!,
    sourceSelectorIds: factoring.bundle.objects[1]!.selectors.map(({ id }) => id),
    targetSelectorIds: factoring.bundle.objects[0]!.selectors.map(({ id }) => id)
  });

  assert.equal(distributionPlan.planKind, "distribution");
  assert.equal(factoringPlan.planKind, "factoring");
  assert.equal(
    kpDistributionCanonicalOperationSpec.rewind.operationId,
    "kp.algebra.factor-common-term"
  );
  assert.deepEqual(
    contract.operationExecution.lineageGraph.edges.map(({ relation }) => relation),
    ["split", "persist", "persist", "persist", "removal"]
  );
  assert.ok(contract.forbiddenIdentityPairs.every(({ sourceSelectorId }) =>
    sourceSelectorId === contract.factorFanOut.sourceFactorSelectorId
  ));
});

test("distribution and factoring preserve endpoints and deterministic seek", () => {
  for (const animation of [distribution, factoring]) {
    assert.deepEqual(checkKpAnimationAssetReferenceClosure(animation), {
      lawId: "animation.reference-closure",
      passed: true,
      failures: []
    });
    assert.deepEqual(checkKpAnimationAssetSeekRewindLaw(animation), {
      lawId: "animation.seek-rewind",
      passed: true,
      failures: []
    });
  }
});

function distributionRequestWithCanonicalEntityIds():
  KpEquationLlmAuthoringRequest {
  return {
    ...fixture.request,
    operation: {
      ...fixture.request.operation,
      roleBindings: {
        "factor-before": [contract.source.factorSelectorId],
        "addends-before": [
          contract.source.leftAddendSelectorId,
          contract.source.rightAddendSelectorId
        ],
        "factor-copies": contract.factorFanOut.targetFactorSelectorIds,
        "products-after": contract.productAttachments.map(({ id }) => id)
      }
    }
  };
}

function canonicalSemanticIds(): readonly string[] {
  return [
    ...distribution.bundle.objects.flatMap((object) => [
      object.id,
      ...object.selectors.map(({ id }) => id)
    ]),
    ...contract.productAttachments.map(({ id }) => id)
  ];
}

function unresolvedEntityIds(
  request: KpEquationLlmAuthoringRequest,
  availableEntityIds: readonly string[]
): readonly string[] {
  const available = new Set(availableEntityIds);
  return Object.values(request.operation.roleBindings)
    .flat()
    .filter((entityId) => !available.has(entityId));
}
