import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  describeKpAnimationAssetTransformationTree
} from "../src/animation/asset.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";

test("product-safe asset closes semantic, timeline, and render references", () => {
  const asset = createKpTypeScriptFreeShippingAnimationAsset();

  assert.equal(asset.behavior.status, "passed");
  assert.equal(asset.score.stages.length, 7);
  assert.deepEqual(checkKpAnimationAssetReferenceClosure(asset.animation), {
    lawId: "animation.reference-closure",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    describeKpAnimationAssetTransformationTree(asset.animation).forwardPhases
      .flatMap(({ nodeIds }) => nodeIds),
    asset.operations.transformations.map(({ id }) => id)
  );
});

test("static and accessible endpoints own the exact frozen source", () => {
  const asset = createKpTypeScriptFreeShippingAnimationAsset();

  assert.equal(asset.staticEndpoints.before, asset.semantics.revisions[0]?.sourceText);
  assert.equal(asset.staticEndpoints.after, asset.semantics.revisions[1]?.sourceText);
  assert.equal(asset.accessibility.settledCode, asset.staticEndpoints.after);
  assert.match(asset.accessibility.description, /one clear name/);
  assert.deepEqual(JSON.parse(JSON.stringify(asset)), asset);
});

test("learner asset reads generated data without importing compiler code", () => {
  const source = readFileSync(
    new URL("../src/semantic/typescript-free-shipping-animation-asset.ts", import.meta.url),
    "utf8"
  );
  const reader = readFileSync(
    new URL("../src/semantic/typescript-refactor-semantic-artifact.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /scripts\/|typescript-refactor-frontend|from\s+["']typescript["']/);
  assert.doesNotMatch(reader, /scripts\/|typescript-refactor-frontend|from\s+["']typescript["']/);
  assert.match(reader, /typescript-refactor-semantics\.generated\.json/);
});
