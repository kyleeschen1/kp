import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/rendering/equation-visual-motif-defaults.ts";

test("createFractionSimplificationAnimationAsset adapts two fourths into AnimationAsset", () => {
  const animation = createFractionSimplificationAnimationAsset();

  assert.equal(
    animation.id,
    "animation.generated.fraction-expression.two-fourths"
  );
  assert.equal(
    animation.bundle.id,
    "asset.generated.fraction-expression.two-fourths"
  );
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [
      "expression.generated.fraction-expression.two-fourths.initial",
      "expression.generated.fraction-expression.two-fourths.factored",
      "expression.generated.fraction-expression.two-fourths.common-factor",
      "expression.generated.fraction-expression.two-fourths.simplified"
    ]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.generated.fraction-expression.two-fourths.split-factors",
        "definition.generated.fraction-expression.split-fraction-factors"
      ],
      [
        "transform.generated.fraction-expression.two-fourths.merge-common-factor",
        "definition.generated.fraction-expression.merge-common-factor"
      ],
      [
        "transform.generated.fraction-expression.two-fourths.simplify-unit-factor",
        "definition.generated.fraction-expression.simplify-unit-factor"
      ]
    ]
  );
  assert.deepEqual(
    animation.transformationTree.root.kind === "sequence"
      ? animation.transformationTree.root.children.map((child) => child.id)
      : [],
    [
      "transform.generated.fraction-expression.two-fourths.split-factors",
      "transform.generated.fraction-expression.two-fourths.merge-common-factor",
      "transform.generated.fraction-expression.two-fourths.simplify-unit-factor"
    ]
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
      id: "animation.generated.fraction-expression.two-fourths.visual",
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }).segments.map((segment) => [segment.transformationNodeId, segment.motifKind]),
    [
      [
        "transform.generated.fraction-expression.two-fourths.split-factors",
        "artifact-replace"
      ],
      [
        "transform.generated.fraction-expression.two-fourths.merge-common-factor",
        "artifact-replace"
      ],
      [
        "transform.generated.fraction-expression.two-fourths.simplify-unit-factor",
        "simplify-into"
      ]
    ]
  );
  assert.deepEqual(
    sampleKpAnimationFrameDescriptor({
      id: "frame.generated.fraction-expression.two-fourths.middle",
      animation,
      direction: "forward",
      progress: 0.5
    }),
    {
      id: "frame.generated.fraction-expression.two-fourths.middle",
      kind: "animation-frame",
      animationId: "animation.generated.fraction-expression.two-fourths",
      direction: "forward",
      progress: 0.5,
      timelineId: "timeline.generated.fraction-expression.two-fourths.shared",
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 1,
      phaseId: "animation.generated.fraction-expression.two-fourths.forward.1",
      nodeIds: [
        "transform.generated.fraction-expression.two-fourths.merge-common-factor"
      ],
      annotationIdsByPlacement: {
        before: [],
        during: [
          "focus.generated.fraction-expression.two-fourths.common-factor"
        ],
        after: [
          "pause.generated.fraction-expression.two-fourths.merge-common-factor"
        ]
      },
      semanticObjectIds: [
        "expression.generated.fraction-expression.two-fourths.initial",
        "expression.generated.fraction-expression.two-fourths.factored",
        "expression.generated.fraction-expression.two-fourths.common-factor",
        "expression.generated.fraction-expression.two-fourths.simplified"
      ],
      transformationIds: [
        "transform.generated.fraction-expression.two-fourths.merge-common-factor"
      ],
      renderTargets: [
        {
          id: "render.generated.fraction-expression.two-fourths.expression",
          kind: "equation",
          objectIds: [
            "expression.generated.fraction-expression.two-fourths.initial",
            "expression.generated.fraction-expression.two-fourths.factored",
            "expression.generated.fraction-expression.two-fourths.common-factor",
            "expression.generated.fraction-expression.two-fourths.simplified"
          ],
          selectorIds: [],
          transformationIds: [
            "transform.generated.fraction-expression.two-fourths.split-factors",
            "transform.generated.fraction-expression.two-fourths.merge-common-factor",
            "transform.generated.fraction-expression.two-fourths.simplify-unit-factor"
          ],
          timelineId: "timeline.generated.fraction-expression.two-fourths.shared"
        }
      ],
      diagnostics: []
    }
  );
});
