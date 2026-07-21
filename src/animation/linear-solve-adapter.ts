import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import { createLinearSolveKpAssetBundle } from "../semantic/linear-solve-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

const linearSolveAnimationId = "animation.linear-solve.solve-x";
const linearSolveTimelineId = "timeline.linear-solve.shared";
const linearSolveRenderTargetId = "render.linear-solve.equation";
const linearSolveTransformationDefinitionIds: Readonly<Record<string, string>> = {
  "transform.linear-solve.subtract-both-sides-3":
    "definition.generated.linear-solve.subtract-both-sides",
  "transform.linear-solve.cancel-left-additive-inverse":
    "definition.generated.linear-solve.cancel-additive-inverses",
  "transform.linear-solve.simplify-right-difference":
    "definition.generated.linear-solve.simplify-constant-difference"
};

export function createLinearSolveAnimationAsset(): KpAnimationAsset {
  const source = createLinearSolveKpAssetBundle();
  const transformations = source.transformations.map(
    attachLinearSolveDefinitionId
  );
  const transformationIds = transformations.map((transformation) => transformation.id);
  const objectIds = source.bundle.objects.map((object) => object.id);
  const treeRoot = createSemanticTransformationSequence({
    id: "diagram.linear-solve.sequence",
    label: "Linear solve sequence",
    children: transformations.map((transformation) =>
      createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds: transformation.sourceObjectIds,
          targetObjectIds: transformation.targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      )
    )
  });

  return createKpAnimationAsset({
    id: linearSolveAnimationId,
    title: source.bundle.title,
    bundle: source.bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "pause.linear-solve.subtract",
          kind: "pause",
          targetNodeId: "transform.linear-solve.subtract-both-sides-3",
          placement: "after",
          durationBeats: 1
        },
        {
          id: "focus.linear-solve.cancel",
          kind: "focus",
          targetNodeId: "transform.linear-solve.cancel-left-additive-inverse",
          placement: "during",
          selectorIds: [
            "equation.linear-solve.after-subtract.lhs.plus3",
            "equation.linear-solve.after-subtract.lhs.minus3"
          ]
        },
        {
          id: "pause.linear-solve.cancel",
          kind: "pause",
          targetNodeId: "transform.linear-solve.cancel-left-additive-inverse",
          placement: "after",
          durationBeats: 1
        }
      ]
    }),
    timeline: {
      id: linearSolveTimelineId,
      durationMs: 2400,
      beatCount: 50
    },
    layout: {
      id: "layout.linear-solve.animation",
      kind: "single",
      targetId: linearSolveRenderTargetId
    },
    renderTargets: [
      {
        id: linearSolveRenderTargetId,
        kind: "equation",
        objectIds,
        transformationIds,
        timelineId: linearSolveTimelineId
      }
    ],
    checks: [
      {
        id: "check.linear-solve.animation.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: linearSolveAnimationId
      },
      {
        id: "check.linear-solve.animation.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      }
    ],
    exportTargets: [
      {
        id: "export.linear-solve.frames",
        kind: "frame-sequence",
        artifactId: "artifact.linear-solve.gif.frames"
      }
    ],
    dashboard: {
      rowId: "animation-linear-solve-solve-x",
      tags: ["animation", "equation", "linear-solve"],
      sourceRefIds: [source.sourceAnimationId]
    },
    metadata: {
      sourceAnimationId: source.sourceAnimationId,
      // Preserve the successful canonical motion while newer material motifs
      // remain available semantically for isolated refinement and promotion.
      equationMotionPresentationRecipe: "continuity-v1",
      equationCancellationPresentationRecipe: "counter-orbit-v1",
      equationZeroWitnessPresentationRecipe: "independent-zero-v1",
      equationSuccessorPresentationRecipe: "convergence-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1"
    }
  });
}

function attachLinearSolveDefinitionId(
  transformation: KpSemanticTransformation
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: transformation.id,
    definitionId:
      linearSolveTransformationDefinitionIds[transformation.id] ??
      transformation.definitionId,
    transformType: transformation.transformType,
    title: transformation.title,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    ...(transformation.correspondenceMap === undefined
      ? {}
      : { correspondenceMap: transformation.correspondenceMap }),
    correspondence: transformation.correspondence,
    ...(transformation.assumptions === undefined
      ? {}
      : { assumptions: transformation.assumptions }),
    ...(transformation.lawRefs === undefined
      ? {}
      : { lawRefs: transformation.lawRefs })
  });
}
