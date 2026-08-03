import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import { validateKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";

test("compiles the certified fixture into a valid canonical asset", () => {
  const asset = createKpLispLambdaApplicationAsset();

  assert.deepEqual(validateKpAssetBundle(asset.bundle), []);
  assert.equal(asset.bundle.objects.length, 4);
  assert.deepEqual(
    asset.transformations.flatMap((transformation) =>
      validateKpSemanticTransformation(transformation, asset.bundle)
    ),
    []
  );
});

test("keeps selector correspondence reversible and shape-valid", () => {
  const asset = createKpLispLambdaApplicationAsset();

  for (const transformation of asset.transformations) {
    assert.ok(transformation.correspondenceMap);
    assert.deepEqual(validateCorrespondenceMap(transformation.correspondenceMap), []);
    assert.deepEqual(checkCorrespondenceMapRewindLaw(transformation.correspondenceMap), []);
  }
});

test("accounts for substitution and evaluation lineage without glyph inference", () => {
  const asset = createKpLispLambdaApplicationAsset();

  assert.deepEqual(asset.lineage.flatMap(validateKpSemanticLineageGraph), []);
  assert.deepEqual(asset.lineage[0]?.edges[1]?.sourceEntityIds, [
    "occurrence.argument.four",
    "occurrence.x.reference"
  ]);
  assert.equal(asset.lineage[0]?.edges[1]?.targetEntityIds[0], "derived.argument.four");
});

test("gives every visible material transition an explicit semantic reason", () => {
  const asset = createKpLispLambdaApplicationAsset();

  assert.deepEqual(asset.materialLedger.map(({ reason }) => reason), [
    "persists",
    "gathers",
    "persists",
    "exits-after-substitution",
    "gathers"
  ]);
  assert.equal(asset.checkpoints[0]?.progress, 0);
  assert.equal(asset.checkpoints.at(-1)?.progress, 1);
  assert.equal(asset.accessibility.settledCode, "5");
});
