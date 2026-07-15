import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import {
  createInequalitySignFlipAnimationAsset,
  inequalitySignFlipAnimationId
} from "../src/animation/inequality-sign-flip-adapter.ts";

test("inequality sign-flip asset preserves the solution set through an explicit relation pivot", () => {
  const animation = createInequalitySignFlipAnimationAsset();
  const [transformation] = animation.transformations;

  assert.equal(animation.id, inequalitySignFlipAnimationId);
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.value),
    [{ latex: "x < 3" }, { latex: "-2x > -6" }]
  );
  assert.deepEqual(
    [transformation?.definitionId, transformation?.transformType],
    [
      "definition.symbolic.algebra.inequality-multiply-negative",
      "multiplyNegativeBothSidesInequality"
    ]
  );
  assert.deepEqual(transformation?.lawRefs, [
    {
      id: "law.inequality.multiply-negative-flip",
      level: "strict",
      summary:
        "Multiplication by a negative quantity preserves the solution set only when the relation flips."
    }
  ]);
  assert.deepEqual(
    transformation?.correspondence.find((item) =>
      item.sourceSelectorId.endsWith(".relation")
    ),
    {
      sourceSelectorId: "inequality.sign-flip.source.relation",
      targetSelectorId: "inequality.sign-flip.target.relation",
      preserves: ["role"]
    }
  );
  assert.equal(
    animation.bundle.objects[1]?.selectors.find((selector) =>
      selector.id.endsWith(".relation")
    )?.metadata?.["semanticRole"],
    "relation.flip"
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
});

test("inequality sign-flip asset is a seekable equation animation in the concrete catalog", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) => candidate.id === inequalitySignFlipAnimationId
  );

  assert.ok(animation);
  assert.deepEqual(animation.renderTargets.map((target) => target.kind), [
    "equation"
  ]);
  assert.equal(animation.renderTargets[0]?.selectorIds?.length, 8);
  const frame = sampleKpAnimationFrameDescriptor({
      id: "frame.inequality.sign-flip.middle",
      animation,
      direction: "forward",
      progress: 0.5
    });

  assert.deepEqual(
    {
      id: frame.id,
      animationId: frame.animationId,
      timelineId: frame.timelineId,
      direction: frame.direction,
      progress: frame.progress,
      elapsedMs: frame.elapsedMs,
      beat: frame.beat,
      phaseIndex: frame.phaseIndex,
      phaseId: frame.phaseId,
      nodeIds: frame.nodeIds,
      annotationIdsByPlacement: frame.annotationIdsByPlacement,
      diagnostics: frame.diagnostics
    },
    {
      id: "frame.inequality.sign-flip.middle",
      animationId: inequalitySignFlipAnimationId,
      timelineId: "timeline.inequality.sign-flip.basic",
      direction: "forward",
      progress: 0.5,
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 0,
      phaseId: `${inequalitySignFlipAnimationId}.forward.0`,
      nodeIds: ["transform.inequality.sign-flip.multiply-negative"],
      annotationIdsByPlacement: {
        before: [],
        during: ["focus.inequality.sign-flip.relation"],
        after: ["pause.inequality.sign-flip.relation"]
      },
      diagnostics: []
    }
  );
});
