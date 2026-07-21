import assert from "node:assert/strict";
import test from "node:test";

import { compileKpAnimationAssetSemanticRefs } from "../src/animation/asset.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../src/animation/fractional-linear-equation-adapter.ts";

test("fractional equation composes into one renderer-neutral animation asset", () => {
  const animation = createFractionalLinearEquationAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  assert.deepEqual(refs.diagnostics, []);
  assert.equal(animation.bundle.objects.length, 7);
  assert.equal(animation.transformations.length, 6);
  assert.equal(animation.renderTargets.length, 1);
  assert.equal(animation.renderTargets[0]?.kind, "equation");
  assert.equal(animation.metadata?.["equationNativeHandoffRecipe"], "atomic-v1");
});
