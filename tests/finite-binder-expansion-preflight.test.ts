import assert from "node:assert/strict";
import test from "node:test";

import generatedCoverage from
  "../src/architecture/animation-transformation-coverage.generated.json" with {
    type: "json"
  };
import displayCatalog from
  "../src/editor/animation-library-display-catalog.generated.json" with {
    type: "json"
  };
import { largeOperatorTransformFixtures } from
  "../src/rendering/katex-transform-fixtures.ts";
import { kpNativeKatexCompoundConformanceShapes } from
  "./fixtures/native-katex-compositor-conformance-shapes.ts";
import { finiteBinderExpansionPreflight } from
  "./fixtures/finite-binder-expansion-preflight.ts";

test("preflight narrows the missing umbrella to finite binder expansion", () => {
  const capability = generatedCoverage.entries.find(({ capabilityId }) =>
    capabilityId === finiteBinderExpansionPreflight.capabilityId
  );

  assert.ok(capability);
  assert.equal(capability.status,
    finiteBinderExpansionPreflight.statusBeforeEvidence);
  assert.deepEqual(
    capability.remainingRequirementIds,
    finiteBinderExpansionPreflight.requirementIds
  );
  assert.deepEqual(capability.exemplarLinks, []);
  assert.equal(generatedCoverage.entries.some(({ capabilityId }) =>
    capabilityId === finiteBinderExpansionPreflight.retiredBroadCapabilityId
  ), false);
});

test("preflight pins one sum exemplar and one product pressure caller", () => {
  assert.deepEqual(
    finiteBinderExpansionPreflight.canonicalSum.orderedValues,
    [1, 2, 3]
  );
  assert.deepEqual(
    finiteBinderExpansionPreflight.productPressure.orderedValues,
    [0, 1, 2]
  );
  assert.notEqual(
    finiteBinderExpansionPreflight.canonicalSum.binder,
    finiteBinderExpansionPreflight.productPressure.binder
  );
  assert.notEqual(
    finiteBinderExpansionPreflight.canonicalSum.proposedAnimationId,
    finiteBinderExpansionPreflight.productPressure.proposedAnimationId
  );
});

test("large-operator syntax and paint exist without claiming binder motion", () => {
  const fixture = largeOperatorTransformFixtures.find(({ id }) =>
    id === finiteBinderExpansionPreflight.existingLargeOperatorFixtureId
  );
  const paintShape = kpNativeKatexCompoundConformanceShapes.find(({ id }) =>
    id === finiteBinderExpansionPreflight.existingPaintShapeId
  );

  assert.ok(fixture);
  assert.equal(fixture.family, "large-operator");
  assert.equal(paintShape?.representativeLatex,
    finiteBinderExpansionPreflight.existingPaintShapeLatex);
  assert.equal(paintShape?.paintClass, "subtree");
});

test("no finite-binder animation is already present in the Catalogue", () => {
  const proposedIds = [
    finiteBinderExpansionPreflight.canonicalSum.proposedAnimationId,
    finiteBinderExpansionPreflight.productPressure.proposedAnimationId
  ];
  assert.deepEqual(
    displayCatalog.filter(({ animationId }) =>
      proposedIds.includes(animationId as typeof proposedIds[number])
    ),
    []
  );
});

test("the sum checkpoint precedes product pressure", () => {
  assert.equal(finiteBinderExpansionPreflight.visualCheckpointSlice, "bf16");
  assert.equal(finiteBinderExpansionPreflight.promotionPressureSlice, "bf18");
});
