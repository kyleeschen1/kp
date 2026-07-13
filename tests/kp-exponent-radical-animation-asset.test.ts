import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  type KpAnimationAsset
} from "../src/animation/asset.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import {
  createExponentExpansionAnimationAsset,
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/rendering/equation-visual-motif-defaults.ts";

test("createExponentExpansionAnimationAsset adapts square expansion into AnimationAsset", () => {
  const animation = createExponentExpansionAnimationAsset();

  assert.equal(animation.id, "animation.generated.exponent.square-as-product");
  assert.equal(animation.bundle.id, "asset.generated.exponent.square-as-product");
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [
      "expression.generated.exponent.square-as-product.initial",
      "expression.generated.exponent.square-as-product.lowered",
      "expression.generated.exponent.square-as-product.expanded"
    ]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.generated.exponent.square-as-product.lower-exponent",
        "definition.generated.exponent.lower-exponent"
      ],
      [
        "transform.generated.exponent.square-as-product.unwrap-unit-exponent",
        "definition.generated.exponent.unwrap-unit-exponent"
      ]
    ]
  );
  assertAnimationTreeAndLaws(
    animation,
    [
      "transform.generated.exponent.square-as-product.lower-exponent",
      "transform.generated.exponent.square-as-product.unwrap-unit-exponent"
    ],
    [
      [
        "transform.generated.exponent.square-as-product.lower-exponent",
        "append-after-shift"
      ],
      [
        "transform.generated.exponent.square-as-product.unwrap-unit-exponent",
        "unwrap"
      ]
    ]
  );
  assert.deepEqual(
    pickFrameFields(
      sampleKpAnimationFrameDescriptor({
        id: "frame.generated.exponent.square-as-product.middle",
        animation,
        direction: "forward",
        progress: 0.5
      })
    ),
    {
      animationId: "animation.generated.exponent.square-as-product",
      timelineId: "timeline.generated.exponent.square-as-product.shared",
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 1,
      phaseId: "animation.generated.exponent.square-as-product.forward.1",
      nodeIds: [
        "transform.generated.exponent.square-as-product.unwrap-unit-exponent"
      ],
      diagnostics: []
    }
  );
});

test("createExponentRadicalRewriteAnimationAsset adapts square root rewrite into AnimationAsset", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();

  assert.equal(
    animation.id,
    "animation.generated.radical.square-root-as-power"
  );
  assert.equal(
    animation.bundle.id,
    "asset.generated.radical.square-root-as-power"
  );
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [
      "expression.generated.radical.square-root-as-power.power",
      "expression.generated.radical.square-root-as-power.radical"
    ]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.generated.radical.square-root-as-power.rewrite-power-as-root",
        "definition.generated.radical.rewrite-power-as-root"
      ]
    ]
  );
  assertAnimationTreeAndLaws(
    animation,
    ["transform.generated.radical.square-root-as-power.rewrite-power-as-root"],
    [
      [
        "transform.generated.radical.square-root-as-power.rewrite-power-as-root",
        "artifact-replace"
      ]
    ]
  );
  assert.deepEqual(
    pickFrameFields(
      sampleKpAnimationFrameDescriptor({
        id: "frame.generated.radical.square-root-as-power.middle",
        animation,
        direction: "forward",
        progress: 0.5
      })
    ),
    {
      animationId: "animation.generated.radical.square-root-as-power",
      timelineId: "timeline.generated.radical.square-root-as-power.shared",
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 0,
      phaseId: "animation.generated.radical.square-root-as-power.forward.0",
      nodeIds: [
        "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
      ],
      diagnostics: []
    }
  );
});

function assertAnimationTreeAndLaws(
  animation: KpAnimationAsset,
  expectedNodeIds: readonly string[],
  expectedMotifs: readonly (readonly [string, string])[]
): void {
  assert.deepEqual(
    animation.transformationTree.root.kind === "sequence"
      ? animation.transformationTree.root.children.map((child) => child.id)
      : [],
    expectedNodeIds
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
    expectedMotifs
  );
}

function pickFrameFields(
  frame: ReturnType<typeof sampleKpAnimationFrameDescriptor>
): {
  readonly animationId: string;
  readonly timelineId?: string | undefined;
  readonly elapsedMs?: number | undefined;
  readonly beat?: number | undefined;
  readonly phaseIndex: number;
  readonly phaseId: string;
  readonly nodeIds: readonly string[];
  readonly diagnostics: readonly unknown[];
} {
  return {
    animationId: frame.animationId,
    timelineId: frame.timelineId,
    elapsedMs: frame.elapsedMs,
    beat: frame.beat,
    phaseIndex: frame.phaseIndex,
    phaseId: frame.phaseId,
    nodeIds: frame.nodeIds,
    diagnostics: frame.diagnostics
  };
}
