import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  createNumeratorSplitMergeEquationKpAsset,
  numeratorSplitMergeEquationAssetIds as ids
} from "../src/semantic/numerator-split-merge-equation-asset.ts";

test("numerator split-merge asset defines the two exact algebraic endpoints", () => {
  const asset = createNumeratorSplitMergeEquationKpAsset();

  assert.equal(asset.sourceTraceId, "trace.algebra-canonical-numerator-split-merge");
  assert.deepEqual(validateKpAssetBundle(asset.bundle), []);
  assert.deepEqual(
    asset.bundle.objects.map((object) => [object.id, object.value]),
    [
      [ids.combined, { latex: "\\frac{2x + 6}{2}" }],
      [ids.split, { latex: "\\frac{2x}{2} + \\frac{6}{2}" }]
    ]
  );
});

test("split and merge are strict named inverse-direction transforms", () => {
  const asset = createNumeratorSplitMergeEquationKpAsset();

  assert.deepEqual(
    asset.transformations.map((transformation) => ({
      id: transformation.id,
      definitionId: transformation.definitionId,
      type: transformation.transformType,
      source: transformation.sourceObjectIds,
      target: transformation.targetObjectIds,
      preserves: transformation.preserves,
      laws: transformation.lawRefs
    })),
    [
      {
        id: ids.splitTransform,
        definitionId: "definition.symbolic.algebra.split-fraction-sum",
        type: "splitFractionSum",
        source: [ids.combined],
        target: [ids.split],
        preserves: ["value", "structure"],
        laws: [{ id: "law.algebra.fraction-sum-split", level: "strict" }]
      },
      {
        id: ids.mergeTransform,
        definitionId: "definition.symbolic.algebra.merge-fractions",
        type: "mergeFractions",
        source: [ids.split],
        target: [ids.combined],
        preserves: ["value", "structure"],
        laws: [{ id: "law.algebra.fraction-sum-merge", level: "strict" }]
      }
    ]
  );

  for (const transformation of asset.transformations) {
    assert.deepEqual(validateKpSemanticTransformation(transformation, asset.bundle), []);
    assert.equal(transformation.correspondenceMap, undefined);
  }
});
