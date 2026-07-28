import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/animation/motifs/equation-visual-motif-defaults.ts";

test("createLinearSolveAnimationAsset adapts x plus 3 equals 7 into AnimationAsset", () => {
  const animation = createLinearSolveAnimationAsset();

  assert.equal(animation.id, "animation.linear-solve.solve-x");
  assert.equal(animation.bundle.id, "asset.linear-solve");
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [
      "equation.linear-solve.initial",
      "equation.linear-solve.after-subtract",
      "equation.linear-solve.left-simplified",
      "equation.linear-solve.solved"
    ]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.linear-solve.subtract-both-sides-3",
        "definition.generated.linear-solve.subtract-both-sides"
      ],
      [
        "transform.linear-solve.cancel-left-additive-inverse",
        "definition.generated.linear-solve.cancel-additive-inverses"
      ],
      [
        "transform.linear-solve.simplify-right-difference",
        "definition.generated.linear-solve.simplify-constant-difference"
      ]
    ]
  );
  assert.deepEqual(
    animation.transformationTree.root.kind === "sequence"
      ? animation.transformationTree.root.children.map((child) => child.id)
      : [],
    [
      "transform.linear-solve.subtract-both-sides-3",
      "transform.linear-solve.cancel-left-additive-inverse",
      "transform.linear-solve.simplify-right-difference"
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
      id: "animation.linear-solve.solve-x.visual",
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }).segments.map((segment) => [segment.transformationNodeId, segment.motifKind]),
    [
      ["transform.linear-solve.subtract-both-sides-3", "append-after-shift"],
      ["transform.linear-solve.cancel-left-additive-inverse", "cancelation"],
      [
        "transform.linear-solve.simplify-right-difference",
        "successor-synthesis"
      ]
    ]
  );
  assert.deepEqual(
    sampleKpAnimationFrameDescriptor({
      id: "frame.linear-solve.middle",
      animation,
      direction: "forward",
      progress: 0.5
    }),
    {
      id: "frame.linear-solve.middle",
      kind: "animation-frame",
      animationId: "animation.linear-solve.solve-x",
      direction: "forward",
      progress: 0.5,
      timelineId: "timeline.linear-solve.shared",
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 1,
      phaseId: "animation.linear-solve.solve-x.forward.1",
      nodeIds: ["transform.linear-solve.cancel-left-additive-inverse"],
      annotationIdsByPlacement: {
        before: [],
        during: ["focus.linear-solve.cancel"],
        after: ["pause.linear-solve.cancel"]
      },
      semanticObjectIds: [
        "equation.linear-solve.initial",
        "equation.linear-solve.after-subtract",
        "equation.linear-solve.left-simplified",
        "equation.linear-solve.solved"
      ],
      transformationIds: ["transform.linear-solve.cancel-left-additive-inverse"],
      renderTargets: [
        {
          id: "render.linear-solve.equation",
          kind: "equation",
          objectIds: [
            "equation.linear-solve.initial",
            "equation.linear-solve.after-subtract",
            "equation.linear-solve.left-simplified",
            "equation.linear-solve.solved"
          ],
          selectorIds: [],
          transformationIds: [
            "transform.linear-solve.subtract-both-sides-3",
            "transform.linear-solve.cancel-left-additive-inverse",
            "transform.linear-solve.simplify-right-difference"
          ],
          timelineId: "timeline.linear-solve.shared"
        }
      ],
      diagnostics: []
    }
  );
});
