import assert from "node:assert/strict";
import test from "node:test";

import { checkKpDiagramRewindLaw } from "../src/semantic/asset-laws.ts";
import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  createLinearSolveKpAssetBundle
} from "../src/semantic/linear-solve-asset.ts";

test("createLinearSolveKpAssetBundle wraps canonical equation states", () => {
  const asset = createLinearSolveKpAssetBundle();

  assert.equal(asset.bundle.id, "asset.linear-solve");
  assert.equal(asset.sourceAnimationId, "linear-equation-solve-x");
  assert.deepEqual(
    asset.bundle.objects.map((object) => [object.id, object.value]),
    [
      ["equation.linear-solve.initial", { latex: "x + 3 = 7" }],
      [
        "equation.linear-solve.after-subtract",
        { latex: "x + 3 - 3 = 7 - 3" }
      ],
      ["equation.linear-solve.left-simplified", { latex: "x = 7 - 3" }],
      ["equation.linear-solve.solved", { latex: "x = 4" }]
    ]
  );
  assert.deepEqual(validateKpAssetBundle(asset.bundle), []);
});

test("createLinearSolveKpAssetBundle exposes transformations and diagram phases", () => {
  const asset = createLinearSolveKpAssetBundle();

  assert.deepEqual(
    asset.transformations.map((transformation) => transformation.id),
    [
      "transform.linear-solve.subtract-both-sides-3",
      "transform.linear-solve.cancel-left-additive-inverse",
      "transform.linear-solve.simplify-right-difference"
    ]
  );
  assert.deepEqual(
    asset.transformations.flatMap((transformation) =>
      validateKpSemanticTransformation(transformation, asset.bundle)
    ),
    []
  );
  assert.equal(asset.diagram.id, "diagram.linear-solve.sequence");
  assert.deepEqual(asset.diagram.sourceObjectIds, [
    "equation.linear-solve.initial"
  ]);
  assert.deepEqual(asset.diagram.targetObjectIds, [
    "equation.linear-solve.solved"
  ]);
  assert.deepEqual(checkKpDiagramRewindLaw(asset.diagram), {
    lawId: "diagram.rewind",
    passed: true,
    failures: []
  });
});
