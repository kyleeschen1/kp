import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/rendering/equation-visual-motif-defaults.ts";

test("createFunctionWrapAnimationAsset adapts f of x into AnimationAsset", () => {
  const animation = createFunctionWrapAnimationAsset();

  assert.equal(animation.id, "animation.generated.function-wrap.apply-f");
  assert.equal(animation.bundle.id, "asset.generated.function-wrap.apply-f");
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [
      "expression.generated.function-wrap.apply-f.input",
      "expression.generated.function-wrap.apply-f.wrapped"
    ]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.generated.function-wrap.apply-f.wrap-function",
        "definition.generated.function-wrap.wrap-function"
      ]
    ]
  );
  assert.deepEqual(
    animation.transformationTree.root.kind === "sequence"
      ? animation.transformationTree.root.children.map((child) => child.id)
      : [],
    ["transform.generated.function-wrap.apply-f.wrap-function"]
  );
  assert.deepEqual(checkKpAnimationAssetReferenceClosure(animation), {
    lawId: "animation.reference-closure",
    passed: true,
    failures: []
  });
  assert.deepEqual(checkKpAnimationAssetSeekRewindLaw(animation), {
    lawId: "animation.seek-rewind",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    checkKpAnimationAssetVisualMotifDefinitionCoverage({
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }),
    {
      lawId: "animation.visual-motif.definition-coverage",
      passed: true,
      failures: []
    }
  );
  assert.deepEqual(
    createKpAnimationAssetVisualMotifTimeline({
      id: "animation.generated.function-wrap.apply-f.visual",
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }).segments.map((segment) => [segment.transformationNodeId, segment.motifKind]),
    [["transform.generated.function-wrap.apply-f.wrap-function", "wrap"]]
  );
  const frame = sampleKpAnimationFrameDescriptor({
    id: "frame.generated.function-wrap.apply-f.middle",
    animation,
    direction: "forward",
    progress: 0.5
  });

  assert.deepEqual(
    {
      animationId: frame.animationId,
      timelineId: frame.timelineId,
      elapsedMs: frame.elapsedMs,
      beat: frame.beat,
      phaseIndex: frame.phaseIndex,
      phaseId: frame.phaseId,
      nodeIds: frame.nodeIds,
      diagnostics: frame.diagnostics
    },
    {
      animationId: "animation.generated.function-wrap.apply-f",
      timelineId: "timeline.generated.function-wrap.apply-f.shared",
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 0,
      phaseId: "animation.generated.function-wrap.apply-f.forward.0",
      nodeIds: ["transform.generated.function-wrap.apply-f.wrap-function"],
      diagnostics: []
    }
  );
});
