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
import {
  checkGeneratedFractionExpressionTransformDefinitionCoverage,
  listGeneratedAlgebraTransformDefinitions,
  listGeneratedFractionExpressionTransformDefinitions
} from "../src/semantic/generated-algebra-transform-definition-registry.ts";

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
        "fraction-factor-split"
      ],
      [
        "transform.generated.fraction-expression.two-fourths.merge-common-factor",
        "fraction-common-factor-extract"
      ],
      [
        "transform.generated.fraction-expression.two-fourths.simplify-unit-factor",
        "fraction-unit-absorb"
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

test("generated fraction-expression transform definitions expose the promoted sequence", () => {
  assert.deepEqual(
    listGeneratedFractionExpressionTransformDefinitions().map((definition) => [
      definition.id,
      definition.transformType,
      definition.artifactPolicy,
      definition.preserves
    ]),
    [
      [
        "definition.generated.fraction-expression.split-fraction-factors",
        "splitFractionFactors",
        "mixed",
        ["value", "structure"]
      ],
      [
        "definition.generated.fraction-expression.merge-common-factor",
        "mergeFractionCommonFactor",
        "mixed",
        ["identity", "value", "structure"]
      ],
      [
        "definition.generated.fraction-expression.simplify-unit-factor",
        "simplifyUnitFractionFactor",
        "source-only",
        ["identity", "value"]
      ]
    ]
  );
  assert.deepEqual(
    checkGeneratedFractionExpressionTransformDefinitionCoverage(),
    {
      lawId: "generated-fraction-expression.transform-definition-coverage",
      passed: true,
      failures: []
    }
  );
});

test("generated fraction-expression transform coverage reports artifact policy drift", () => {
  assert.deepEqual(
    checkGeneratedFractionExpressionTransformDefinitionCoverage(
      listGeneratedAlgebraTransformDefinitions().map((definition) =>
        definition.id ===
          "definition.generated.fraction-expression.simplify-unit-factor"
          ? {
              ...definition,
              artifactPolicy: "mixed"
            }
          : definition
      )
    ),
    {
      lawId: "generated-fraction-expression.transform-definition-coverage",
      passed: false,
      failures: [
        {
          path:
            "definitions[definition.generated.fraction-expression.simplify-unit-factor].artifactPolicy",
          message:
            "Generated fraction-expression transform definition.generated.fraction-expression.simplify-unit-factor expected artifact policy source-only but received mixed."
        }
      ]
    }
  );
});
