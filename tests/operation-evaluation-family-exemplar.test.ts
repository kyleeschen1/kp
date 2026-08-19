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
      { family: "contributor-fusion", handoff: "contact-occlusion" },
      { family: "masked-carrier-relay", handoff: "legibility-gated-relay" }
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
  const masked = resolveKpOperationEvaluationFamilyExemplarRecipe(
    "masked-carrier-relay"
  );
  assert.equal(masked.family, "masked-carrier-relay");
  if (masked.family === "masked-carrier-relay") {
    assert.ok(masked.sourceClipStartsAt < masked.sourceLegibilityEndsAt);
    assert.ok(
      masked.sourceLegibilityEndsAt < masked.targetLegibilityStartsAt
    );
    assert.ok(masked.targetLegibilityStartsAt < masked.targetRevealEndsAt);
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
