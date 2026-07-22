import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createDivideBothSidesEquationKpAsset,
  divideBothSidesEquationAssetIds as ids
} from "../semantic/divide-both-sides-equation-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

export function createDivideBothSidesEquationAnimationAsset(): KpAnimationAsset {
  const source = createDivideBothSidesEquationKpAsset();
  const animationId = "animation.divide-both-sides.solve-3x-equals-12";
  const timelineId = "timeline.divide-both-sides.solve-3x-equals-12";
  const renderTargetId = "render.divide-both-sides.equation";
  const root = createSemanticTransformationSequence({
    id: "diagram.divide-both-sides.sequence",
    label: "Divide-both-sides equation sequence",
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
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        focus("focus.divide-both-sides.structure-entry", ids.divide, [
          selector(ids.divided, "lhs.fraction.denominator.3"),
          selector(ids.divided, "lhs.fraction.rule"),
          selector(ids.divided, "rhs.fraction.denominator.3"),
          selector(ids.divided, "rhs.fraction.rule")
        ])
      ]
    }),
    timeline: { id: timelineId, durationMs: 2_700, beatCount: 54 },
    layout: {
      id: "layout.divide-both-sides.animation",
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
        id: "check.divide-both-sides.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: "check.divide-both-sides.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    exportTargets: [{
      id: "export.divide-both-sides.frames",
      kind: "frame-sequence",
      artifactId: "artifact.divide-both-sides.frames"
    }],
    dashboard: {
      rowId: "animation-divide-both-sides-solve",
      tags: ["animation", "equation", "linear-solve", "division", "exemplar"],
      sourceRefIds: [source.sourceTraceId]
    },
    metadata: {
      sourceTraceId: source.sourceTraceId,
      equationMotionPresentationRecipe: "continuity-v1",
      equationNativeHandoffRecipe: "atomic-v1",
      equationCancellationPresentationRecipe: "counter-orbit-v1",
      equationSuccessorPresentationRecipe: "counter-convergence-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1",
      equationSequenceEnvelopeRecipe: "measure-once-per-sequence-v1"
    }
  });
}

function selector(objectId: string, path: string): string {
  return `${objectId}.${path}`;
}

function focus(
  id: string,
  targetNodeId: string,
  selectorIds: readonly string[]
) {
  return {
    id,
    kind: "focus" as const,
    targetNodeId,
    placement: "during" as const,
    selectorIds
  };
}
