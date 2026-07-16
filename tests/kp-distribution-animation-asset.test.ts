import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  type KpAnimationAsset
} from "../src/animation/asset.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/rendering/equation-visual-motif-defaults.ts";

test("createDistributionExpansionAnimationAsset adapts distribute sample into AnimationAsset", () => {
  const animation = createDistributionExpansionAnimationAsset();

  assertDistributionAnimation({
    animation,
    fixtureId: "generated.distribution.expand-a-sum",
    transformId: "transform.generated.distribution.expand-a-sum.distribute",
    definitionId: "definition.generated.distribution.distribute-multiplication",
    motifKind: "copy-fan-out"
  });
});

test("createDistributionFactoringAnimationAsset adapts factoring sample into AnimationAsset", () => {
  const animation = createDistributionFactoringAnimationAsset();

  assertDistributionAnimation({
    animation,
    fixtureId: "generated.distribution.factor-common-a",
    transformId: "transform.generated.distribution.factor-common-a.factor",
    definitionId: "definition.generated.distribution.factor-common-term",
    motifKind: "merge-fan-in"
  });
});

function assertDistributionAnimation(input: {
  readonly animation: KpAnimationAsset;
  readonly fixtureId: string;
  readonly transformId: string;
  readonly definitionId: string;
  readonly motifKind: string;
}): void {
  const { animation, fixtureId, transformId, definitionId, motifKind } = input;

  assert.equal(animation.id, `animation.${fixtureId}`);
  assert.equal(animation.bundle.id, `asset.${fixtureId}`);
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [`expression.${fixtureId}.factored`, `expression.${fixtureId}.expanded`]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [[transformId, definitionId]]
  );
  assert.deepEqual(
    animation.transformationTree.root.kind === "sequence"
      ? animation.transformationTree.root.children.map((child) => child.id)
      : [],
    [transformId]
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
      id: `${animation.id}.visual`,
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }).segments.map((segment) => [segment.transformationNodeId, segment.motifKind]),
    [[transformId, motifKind]]
  );
  const frame = sampleKpAnimationFrameDescriptor({
    id: `frame.${fixtureId}.middle`,
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
      animationId: `animation.${fixtureId}`,
      timelineId: `timeline.${fixtureId}.shared`,
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 0,
      phaseId: `animation.${fixtureId}.forward.0`,
      nodeIds: [transformId],
      diagnostics: []
    }
  );
}
