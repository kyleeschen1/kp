import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createNumeratorSplitMergeEquationKpAsset,
  numeratorSplitMergeEquationAssetIds as ids
} from "../semantic/numerator-split-merge-equation-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

/** Forward-only until the exact inverse merge clears its own motion slice. */
export function createNumeratorSplitEquationAnimationAsset(): KpAnimationAsset {
  const source = createNumeratorSplitMergeEquationKpAsset();
  const transformations = source.transformations.filter(
    (transformation) => transformation.id === ids.splitTransform
  );
  const animationId = "animation.numerator-split-merge.split-sum";
  const timelineId = "timeline.numerator-split-merge.split-sum";
  const renderTargetId = "render.numerator-split-merge.equation";
  const root = createSemanticTransformationSequence({
    id: "diagram.numerator-split-merge.forward-sequence",
    label: "Split a fraction over a numerator sum",
    children: transformations.map((transformation) =>
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
    title: "Split a fraction across its numerator sum",
    bundle: source.bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [{
        id: "focus.numerator-split-merge.shared-structure",
        kind: "focus",
        targetNodeId: ids.splitTransform,
        placement: "during",
        selectorIds: [
          selector(ids.combined, "fraction.numerator.plus"),
          selector(ids.combined, "fraction.rule"),
          selector(ids.combined, "fraction.denominator.2")
        ]
      }]
    }),
    timeline: { id: timelineId, durationMs: 1_350, beatCount: 27 },
    layout: {
      id: "layout.numerator-split-merge.animation",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: source.bundle.objects.map((object) => object.id),
      transformationIds: transformations.map((transformation) => transformation.id),
      timelineId
    }],
    checks: [
      {
        id: "check.numerator-split-merge.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: "check.numerator-split-merge.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    exportTargets: [{
      id: "export.numerator-split-merge.frames",
      kind: "frame-sequence",
      artifactId: "artifact.numerator-split-merge.frames"
    }],
    dashboard: {
      rowId: "animation-numerator-split-merge",
      tags: ["animation", "equation", "fraction", "split", "exemplar"],
      sourceRefIds: [source.sourceTraceId]
    },
    metadata: {
      sourceTraceId: source.sourceTraceId,
      equationMotionPresentationRecipe: "continuity-v1",
      equationNativeHandoffRecipe: "atomic-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1",
      equationSequenceEnvelopeRecipe: "measure-once-per-sequence-v1",
      equationFractionHierarchyRecipe: "preserve-native-katex-tree-v1"
    }
  });
}

function selector(objectId: string, path: string): string {
  return `${objectId}.${path}`;
}
