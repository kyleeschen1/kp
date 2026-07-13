import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssetBuilder } from "../src/animation/asset.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/rendering/equation-visual-motif-defaults.ts";

test("animation asset visual motif timeline uses definition-backed defaults", () => {
  const initial = createKpSemanticAssetObject({
    id: "equation.initial",
    objectType: "equation",
    title: "Initial equation",
    value: { latex: "x + 3 = 7" }
  });
  const expanded = createKpSemanticAssetObject({
    id: "equation.expanded",
    objectType: "equation",
    title: "Subtract 3",
    value: { latex: "x + 3 - 3 = 7 - 3" }
  });
  const subtract = createKpSemanticTransformation({
    id: "transform.subtract",
    definitionId: "definition.generated.linear-solve.subtract-both-sides",
    transformType: "subtractBothSides",
    title: "Subtract 3 from both sides",
    sourceObjectIds: [initial.id],
    targetObjectIds: [expanded.id],
    preserves: ["value", "structure"]
  });
  const animation = createKpAnimationAssetBuilder({
    id: "animation.solve-x",
    title: "Solve x + 3 = 7"
  })
    .addObject(initial)
    .addObject(expanded)
    .addTransformation(subtract)
    .build();

  const timeline = createKpAnimationAssetVisualMotifTimeline({
    id: "animation.solve-x.visual",
    animation,
    rules: defaultEquationTransformVisualMotifRules
  });

  assert.deepEqual(
    timeline.segments.map((segment) => [
      segment.id,
      segment.transformationNodeId,
      segment.transformationKind,
      segment.motifKind,
      segment.definitionIds
    ]),
    [
      [
        "transform.subtract.visual.append-after-shift",
        "transform.subtract",
        "subtractBothSides",
        "append-after-shift",
        ["definition.generated.linear-solve.subtract-both-sides"]
      ]
    ]
  );
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
    checkKpAnimationAssetVisualMotifDefinitionCoverage({
      animation,
      rules: defaultEquationTransformVisualMotifRules.filter(
        (rule) =>
          !(rule.definitionIds ?? []).includes(
            "definition.generated.linear-solve.subtract-both-sides"
          )
      )
    }),
    {
      lawId: "animation.visual-motif.definition-coverage",
      passed: false,
      failures: [
        {
          path: "transformations[0].definitionId",
          message:
            "Animation animation.solve-x transformation transform.subtract definition definition.generated.linear-solve.subtract-both-sides must have a visual motif rule."
        }
      ]
    }
  );
});
