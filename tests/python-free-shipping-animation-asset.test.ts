import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  describeKpAnimationAssetTransformationTree
} from "../src/animation/asset.ts";
import { createKpPythonFreeShippingAnimationAsset } from
  "../src/semantic/python-free-shipping-animation-asset.ts";

test("Python product asset closes semantic, timeline, and render references", () => {
  const asset = createKpPythonFreeShippingAnimationAsset();

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

test("Python static and accessible endpoints own exact frozen source", () => {
  const asset = createKpPythonFreeShippingAnimationAsset();

  assert.equal(asset.staticEndpoints.before, asset.semantics.revisions[0]?.sourceText);
  assert.equal(asset.staticEndpoints.after, asset.semantics.revisions[1]?.sourceText);
  assert.equal(asset.accessibility.settledCode, asset.staticEndpoints.after);
  assert.match(asset.accessibility.description, /one clear name/);
  assert.deepEqual(JSON.parse(JSON.stringify(asset)), asset);
});

test("Python browser asset reads generated data without frontend or execution", () => {
  const source = readFileSync(
    new URL("../src/semantic/python-free-shipping-animation-asset.ts", import.meta.url),
    "utf8"
  );
  const reader = readFileSync(
    new URL("../src/semantic/python-refactor-semantic-artifact.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /scripts\/|python-refactor-frontend|spawnSync|child_process/);
  assert.doesNotMatch(reader, /scripts\/|python-refactor-frontend|spawnSync|child_process/);
  assert.match(reader, /python-refactor-semantics\.generated\.json/);
});
