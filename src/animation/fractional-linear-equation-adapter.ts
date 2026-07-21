import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createFractionalLinearEquationKpAsset,
  fractionalLinearEquationAssetIds as ids
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
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: fractionalOperationFocusAnnotations()
    }),
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

function fractionalOperationFocusAnnotations() {
  const focus = (
    id: string,
    targetNodeId: string,
    selectorIds: readonly string[]
  ) => ({ id, kind: "focus" as const, targetNodeId, placement: "during" as const, selectorIds });
  const selector = (objectId: string, path: string) => `${objectId}.${path}`;

  return [
    focus("focus.fractional-linear.subtract", ids.subtract, [
      selector(ids.afterSubtract, "lhs.minus3"),
      selector(ids.afterSubtract, "rhs.minus"),
      selector(ids.afterSubtract, "rhs.3")
    ]),
    focus("focus.fractional-linear.cancel-additive", ids.cancelAdditive, [
      selector(ids.afterSubtract, "lhs.plus3"),
      selector(ids.afterSubtract, "lhs.minus3")
    ]),
    focus("focus.fractional-linear.difference", ids.simplifyDifference, [
      selector(ids.additiveCancelled, "rhs.7"),
      selector(ids.additiveCancelled, "rhs.minus"),
      selector(ids.additiveCancelled, "rhs.3")
    ]),
    focus("focus.fractional-linear.multiply", ids.multiply, [
      selector(ids.multiplied, "lhs.multiplier.2"),
      selector(ids.multiplied, "rhs.multiplier.2"),
      selector(ids.multiplied, "rhs.product")
    ]),
    focus("focus.fractional-linear.cancel-denominator", ids.cancelDenominator, [
      selector(ids.multiplied, "lhs.multiplier.2"),
      selector(ids.multiplied, "fraction.denominator.2")
    ]),
    focus("focus.fractional-linear.product", ids.simplifyProduct, [
      selector(ids.denominatorCancelled, "rhs.multiplier.2"),
      selector(ids.denominatorCancelled, "rhs.product"),
      selector(ids.denominatorCancelled, "rhs.4")
    ])
  ];
}
