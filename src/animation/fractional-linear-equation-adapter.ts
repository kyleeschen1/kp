import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createFractionalLinearEquationKpAsset
} from "../semantic/fractional-linear-equation-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

export function createFractionalLinearEquationAnimationAsset(): KpAnimationAsset {
  const source = createFractionalLinearEquationKpAsset();
  const animationId = "animation.fractional-linear.solve-x-over-2";
  const timelineId = "timeline.fractional-linear.solve-x-over-2";
  const renderTargetId = "render.fractional-linear.equation";
  const root = createSemanticTransformationSequence({
    id: "diagram.fractional-linear.sequence",
    label: "Fractional linear equation sequence",
    children: source.transformations.map((transformation) =>
      createSemanticTransformationLeaf(createSemanticTransformationRef({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        preserves: transformation.preserves,
        summary: transformation.title
      }))
    )
  });
  return createKpAnimationAsset({
    id: animationId,
    title: source.bundle.title,
    bundle: source.bundle,
    transformations: source.transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: { id: timelineId, durationMs: 4_800, beatCount: 96 },
    layout: {
      id: "layout.fractional-linear.animation",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: source.bundle.objects.map((object) => object.id),
      transformationIds: source.transformations.map((transformation) => transformation.id),
      timelineId
    }],
    checks: [
      {
        id: "check.fractional-linear.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: "check.fractional-linear.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    exportTargets: [{
      id: "export.fractional-linear.frames",
      kind: "frame-sequence",
      artifactId: "artifact.fractional-linear.frames"
    }],
    dashboard: {
      rowId: "animation-fractional-linear-solve",
      tags: ["animation", "equation", "linear-solve", "fraction", "exemplar"],
      sourceRefIds: [source.sourceTraceId]
    },
    metadata: {
      sourceTraceId: source.sourceTraceId,
      equationMotionPresentationRecipe: "continuity-v1",
      equationNativeHandoffRecipe: "atomic-v1",
      equationCancellationPresentationRecipe: "counter-orbit-v1",
      equationSuccessorPresentationRecipe: "counter-convergence-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1"
    }
  });
}
