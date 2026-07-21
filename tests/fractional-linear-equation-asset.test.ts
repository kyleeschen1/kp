import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  validateKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  createFractionalLinearEquationKpAsset,
  fractionalLinearEquationAssetIds as ids
} from "../src/semantic/fractional-linear-equation-asset.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../src/rendering/semantic-equation-transition-compiler.ts";

test("fractional equation asset owns every structural fragment through six reversible transforms", () => {
  const asset = createFractionalLinearEquationKpAsset();
  assert.deepEqual(validateKpAssetBundle(asset.bundle), []);
  assert.equal(asset.bundle.objects.length, 7);
  assert.equal(asset.transformations.length, 6);

  for (const transformation of asset.transformations) {
    assert.deepEqual(validateKpSemanticTransformation(transformation, asset.bundle), []);
    const compiled = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: asset.bundle,
      unsupportedPolicy: "typed-gap"
    });
    assert.equal(compiled.status, "semantic", transformation.id);
    assert.ok(compiled.ir, transformation.id);
    const selectors = [
      ...compiled.ir.source.flatMap((state) => state.selectors),
      ...compiled.ir.target.flatMap((state) => state.selectors)
    ];
    const owned = new Set(compiled.ir.relations.flatMap((relation) => [
      ...relation.sourceSelectorIds,
      ...relation.targetSelectorIds
    ]));
    assert.deepEqual(
      selectors.filter((selector) => !owned.has(selector.id)).map((selector) => selector.id),
      [],
      transformation.id
    );
  }
});

test("denominator cancellation preserves x while retiring only explanatory structure", () => {
  const asset = createFractionalLinearEquationKpAsset();
  const cancellation = asset.transformations.find((candidate) => candidate.id === ids.cancelDenominator);
  assert.ok(cancellation?.correspondenceMap);
  assert.deepEqual(
    cancellation.correspondenceMap.records.map((record) => [record.id, record.relation]),
    [
      ["x-persists", "identity"],
      ["twos-cancel", "cancelation"],
      ["fraction-and-grouping-retire", "removal"],
      ["equals-persists", "identity"],
      ["rhs-multiplier-2-persists", "identity"],
      ["rhs-product-persists", "identity"],
      ["rhs-4-persists", "identity"]
    ]
  );
});
