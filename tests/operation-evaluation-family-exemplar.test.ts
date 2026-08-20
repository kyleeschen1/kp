import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpOperationEvaluationFamilyReviewSelectable,
  kpOperationEvaluationFamilyExemplarRecipes,
  kpOperationEvaluationFamilyIds,
  resolveKpOperationEvaluationFamilyExemplarRecipe
} from "../src/animation/operation-evaluation-family-exemplar.ts";
import {
  createKpConstantQuotientEvaluationAsset
} from "../src/semantic/constant-quotient-evaluation-asset.ts";
import {
  createKpConstantProductEvaluationAsset
} from "../src/semantic/constant-product-evaluation-asset.ts";

test("the provisional comparison closes each family to one honest handoff", () => {
  assert.deepEqual(
    kpOperationEvaluationFamilyExemplarRecipes.map(({ family, handoff }) => ({
      family,
      handoff
    })),
    [
      { family: "punctuated-substitution", handoff: "discrete-cut" },
      { family: "result-reception", handoff: "progressive-replacement" },
      { family: "contributor-fusion", handoff: "compressed-ink-handoff" },
      {
        family: "carrier-preserving-simplification",
        handoff: "persistent-carrier-transfer"
      }
    ]
  );
  assert.equal(
    kpOperationEvaluationFamilyExemplarRecipes.find(
      ({ family }) => family === "contributor-fusion"
    )?.status,
    "promoted"
  );
  assert.equal(
    kpOperationEvaluationFamilyExemplarRecipes
      .filter(({ family }) =>
        family === "punctuated-substitution" || family === "result-reception")
      .every(({ status }) => status === "provisional-human-checkpoint"),
    true
  );
  assert.equal(
    kpOperationEvaluationFamilyExemplarRecipes.find(
      ({ family }) => family === "carrier-preserving-simplification"
    )?.status,
    "promoted"
  );
  for (const family of kpOperationEvaluationFamilyIds) {
    assert.equal(
      resolveKpOperationEvaluationFamilyExemplarRecipe(family).family,
      family
    );
  }
  const fusion = resolveKpOperationEvaluationFamilyExemplarRecipe(
    "contributor-fusion"
  );
  assert.equal(fusion.family, "contributor-fusion");
  if (fusion.family === "contributor-fusion") {
    assert.equal(
      fusion.profileId,
      "kp.evaluation-family.contributor-fusion.v1"
    );
  }
  const carrier = resolveKpOperationEvaluationFamilyExemplarRecipe(
    "carrier-preserving-simplification"
  );
  assert.equal(carrier.handoff, "persistent-carrier-transfer");
  if (carrier.family === "carrier-preserving-simplification") {
    assert.equal(
      carrier.profileId,
      "kp.evaluation-family.carrier-preserving-simplification.v1"
    );
    assert.equal(
      carrier.requiredEvidenceSchemaVersion,
      "kp.carrier-preserving-simplification-evidence.v1"
    );
  }
  assert.equal(
    isKpOperationEvaluationFamilyReviewSelectable("contributor-fusion"),
    true
  );
  assert.equal(
    isKpOperationEvaluationFamilyReviewSelectable(
      "carrier-preserving-simplification"
    ),
    true
  );
});

test("two times three preserves semantic inputs, catalyst, and result lineage", () => {
  const asset = createKpConstantProductEvaluationAsset({
    id: "two-times-three",
    left: 2,
    right: 3
  });
  const [source, target] = asset.bundle.objects;
  const correspondenceMap = asset.transformation.correspondenceMap;
  assert.ok(correspondenceMap);
  const record = correspondenceMap.records[0]!;

  assert.deepEqual(source?.value, { latex: "2 \\times 3" });
  assert.deepEqual(target?.value, { latex: "6" });
  assert.equal(asset.transformation.transformType, "simplifyConstantProduct");
  assert.deepEqual(
    source?.selectors.map(({ metadata }) =>
      metadata?.["successorContribution"]),
    ["material-input", "catalyst", "material-input"]
  );
  assert.deepEqual(record.sourceSelectorIds, source?.selectors.map(({ id }) => id));
  assert.deepEqual(record.targetSelectorIds, target?.selectors.map(({ id }) => id));
});

test("three sixths exposes vertical contributors without presentation hints", () => {
  const asset = createKpConstantQuotientEvaluationAsset({
    id: "three-sixths",
    numerator: 3,
    denominator: 6
  });
  const [source, target] = asset.bundle.objects;

  assert.deepEqual(source?.value, { latex: "\\frac{3}{6}" });
  assert.deepEqual(target?.value, { latex: "\\frac{1}{2}" });
  assert.equal(asset.transformation.transformType, "simplifyConstantQuotient");
  assert.deepEqual(
    source?.selectors.map(({ metadata }) => ({
      contribution: metadata?.["successorContribution"],
      rank: metadata?.["successorRank"]
    })),
    [
      { contribution: "material-input", rank: 0 },
      { contribution: "catalyst", rank: 1 },
      { contribution: "material-input", rank: 2 }
    ]
  );
  assert.equal(
    source?.selectors.some(({ metadata }) =>
      metadata?.["presentationAxis"] !== undefined),
    false
  );
});
