import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOperationEvaluationFamilyExemplarRecipes,
  kpOperationEvaluationFamilyIds,
  resolveKpOperationEvaluationFamilyExemplarRecipe
} from "../src/animation/operation-evaluation-family-exemplar.ts";
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
      { family: "contributor-fusion", handoff: "compressed-ink-handoff" }
    ]
  );
  assert.equal(
    kpOperationEvaluationFamilyExemplarRecipes.every(
      ({ status }) => status === "provisional-human-checkpoint"
    ),
    true
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
    assert.ok(fusion.gatherStartsAt < fusion.compressionStartsAt);
    assert.ok(fusion.compressionStartsAt < fusion.sourceKernelStartsAt);
    assert.ok(fusion.sourceKernelStartsAt < fusion.ownershipHandoffAt);
    assert.ok(fusion.ownershipHandoffAt < fusion.targetLegibilityStartsAt);
    assert.ok(
      fusion.targetLegibilityStartsAt < fusion.targetExpansionEndsAt
    );
    assert.ok(fusion.kernelAreaRatio > 0 && fusion.kernelAreaRatio < 1);
  }
});

test("two times three preserves semantic inputs, catalyst, and result lineage", () => {
  const asset = createKpConstantProductEvaluationAsset({
    id: "two-times-three",
    left: 2,
    right: 3
  });
  const [source, target] = asset.bundle.objects;
  const record = asset.transformation.correspondenceMap.records[0]!;

  assert.equal(source?.value["latex"], "2 \\times 3");
  assert.equal(target?.value["latex"], "6");
  assert.equal(asset.transformation.transformType, "simplifyConstantProduct");
  assert.deepEqual(
    source?.selectors.map(({ metadata }) =>
      metadata?.["successorContribution"]),
    ["material-input", "catalyst", "material-input"]
  );
  assert.deepEqual(record.sourceSelectorIds, source?.selectors.map(({ id }) => id));
  assert.deepEqual(record.targetSelectorIds, target?.selectors.map(({ id }) => id));
});
