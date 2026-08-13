import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";
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
  }
});

test("split and merge own total reversible selector lineage", () => {
  const asset = createNumeratorSplitMergeEquationKpAsset();

  for (const transformation of asset.transformations) {
    const map = transformation.correspondenceMap;
    assert.ok(map);
    const sourceSelectors = asset.bundle.objects
      .filter((object) => transformation.sourceObjectIds.includes(object.id))
      .flatMap((object) => object.selectors.map((selector) => selector.id));
    const targetSelectors = asset.bundle.objects
      .filter((object) => transformation.targetObjectIds.includes(object.id))
      .flatMap((object) => object.selectors.map((selector) => selector.id));

    assert.deepEqual(validateCorrespondenceMap(map, {
      sourceSelectorIds: sourceSelectors,
      targetSelectorIds: targetSelectors
    }), [], transformation.id);
    assert.deepEqual(checkCorrespondenceMapRewindLaw(map), [], transformation.id);

    const compiled = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: asset.bundle
    });
    assert.equal(compiled.status, "semantic", transformation.id);
  }
});

test("lineage encodes structural branching and plus role change in both directions", () => {
  const asset = createNumeratorSplitMergeEquationKpAsset();

  assert.deepEqual(
    asset.transformations.map((transformation) =>
      transformation.correspondenceMap?.records.map((record) => [record.id, record.relation])
    ),
    [
      [
        ["coefficient-persists", "identity"],
        ["variable-persists", "identity"],
        ["plus-leaves-numerator", "role-change"],
        ["constant-persists", "identity"],
        ["fraction-rule-bifurcates", "fan-out"],
        ["denominator-copies", "fan-out"]
      ],
      [
        ["coefficient-persists", "identity"],
        ["variable-persists", "identity"],
        ["plus-enters-numerator", "role-change"],
        ["constant-persists", "identity"],
        ["fraction-rules-merge", "fan-in"],
        ["denominators-merge", "fan-in"]
      ]
    ]
  );
});
