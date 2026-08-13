import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  compileKpAnimationAssetSemanticRefs,
  describeKpAnimationAssetTransformationTree,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createProgrammingAnimationAssets,
  createProgramTraceAnimationAsset
} from "../src/animation/programming-adapter.ts";

test("createProgramTraceAnimationAsset wraps SourceFile execution trace semantics", () => {
  const animation = createProgramTraceAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const tree = describeKpAnimationAssetTransformationTree(animation);

  assert.equal(animation.id, "animation.programming.add.execution-trace");
  assert.deepEqual(
    animation.bundle.objects.map((object) => [object.id, object.objectType]),
    [
      ["source-file.programming.add", "source-file"],
      ["execution-step.programming.add.call", "execution-step"],
      ["execution-step.programming.add.evaluate-return", "execution-step"],
      ["execution-step.programming.add.return", "execution-step"],
      ["execution-step.programming.add.output", "execution-step"]
    ]
  );
  assert.deepEqual(animation.transformations.map((transform) => transform.id), [
    "transform.programming.add.call",
    "transform.programming.add.evaluate-return",
    "transform.programming.add.return",
    "transform.programming.add.output"
  ]);
  assert.deepEqual(tree.forwardPhases.map((phase) => phase.nodeIds), [
    ["transform.programming.add.call"],
    ["transform.programming.add.evaluate-return"],
    ["transform.programming.add.return"],
    ["transform.programming.add.output"]
  ]);
  assert.deepEqual(tree.rewindPhases.map((phase) => phase.nodeIds), [
    ["transform.programming.add.output"],
    ["transform.programming.add.return"],
    ["transform.programming.add.evaluate-return"],
    ["transform.programming.add.call"]
  ]);
  assert.equal(animation.timeline?.durationMs, 1200);
  assert.equal(animation.timeline?.beatCount, 40);
  assert.deepEqual(animation.renderTargets[0]?.kind, "programming");
  assert.deepEqual(animation.renderTargets[0]?.selectorIds, [
    "selector.programming.add.signature",
    "selector.programming.add.return"
  ]);
  assert.deepEqual(animation.renderTargets[0]?.metadata, {
    behaviorId: "behavior.programming.add.execution-trace",
    sourceFixtureId: "fixture.programming.add.execution-trace",
    traceKind: "deterministic-execution-trace"
  });
  assert.ok(
    refs.semanticObjectRefs.some(
      (ref) => ref.objectId === "source-file.programming.add"
    )
  );
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
});

test("programming animation assets are available through the animation catalog", () => {
  assert.deepEqual(
    createProgrammingAnimationAssets().map((animation) => animation.id),
    [
      "animation.programming.add.execution-trace",
      "animation.programming.lisp-lambda-application",
      "animation.programming.typescript-free-shipping-refactor",
      "animation.programming.python-free-shipping-refactor"
    ]
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.programming.add.execution-trace")
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.programming.typescript-free-shipping-refactor")
  );
  assert.ok(
    createKpAnimationAssets()
      .map((animation) => animation.id)
      .includes("animation.programming.python-free-shipping-refactor")
  );
});
