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
import {
  createKpContinuityEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";

/** Forward-only until the exact inverse merge clears its own motion slice. */
export function createNumeratorSplitEquationAnimationAsset(): KpAnimationAsset {
  return createNumeratorSplitMergeAnimationAsset(false);
}

export function createNumeratorSplitMergeEquationAnimationAsset(): KpAnimationAsset {
  return createNumeratorSplitMergeAnimationAsset(true);
}

function createNumeratorSplitMergeAnimationAsset(includeMerge: boolean): KpAnimationAsset {
  const source = createNumeratorSplitMergeEquationKpAsset();
  const transformations = includeMerge
    ? source.transformations
    : source.transformations.filter(
        (transformation) => transformation.id === ids.splitTransform
      );
  const animationId = includeMerge
    ? "animation.numerator-split-merge.round-trip"
    : "animation.numerator-split-merge.split-sum";
  const timelineId = includeMerge
    ? "timeline.numerator-split-merge.round-trip"
    : "timeline.numerator-split-merge.split-sum";
  const renderTargetId = "render.numerator-split-merge.equation";
  const root = createSemanticTransformationSequence({
    id: includeMerge
      ? "diagram.numerator-split-merge.round-trip-sequence"
      : "diagram.numerator-split-merge.forward-sequence",
    label: includeMerge
      ? "Split and merge a fraction over a numerator sum"
      : "Split a fraction over a numerator sum",
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
    title: includeMerge
      ? "Split and merge a fraction across its numerator sum"
      : "Split a fraction across its numerator sum",
    bundle: source.bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        {
          id: "focus.numerator-split-merge.shared-structure",
          kind: "focus",
          targetNodeId: ids.splitTransform,
          placement: "during",
          selectorIds: [
            selector(ids.combined, "fraction.numerator.plus"),
            selector(ids.combined, "fraction.rule"),
            selector(ids.combined, "fraction.denominator.2")
          ]
        },
        ...(includeMerge
          ? [{
              id: "focus.numerator-split-merge.compatible-structures",
              kind: "focus" as const,
              targetNodeId: ids.mergeTransform,
              placement: "during" as const,
              selectorIds: [
                selector(ids.split, "between.plus"),
                selector(ids.split, "left.fraction.rule"),
                selector(ids.split, "left.fraction.denominator.2"),
                selector(ids.split, "right.fraction.rule"),
                selector(ids.split, "right.fraction.denominator.2")
              ]
            }]
          : [])
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: includeMerge ? 2_700 : 1_350,
      beatCount: includeMerge ? 54 : 27
    },
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
      tags: ["animation", "equation", "fraction", "split", ...(includeMerge ? ["merge"] : []), "exemplar"],
      sourceRefIds: [source.sourceTraceId]
    },
    presentationProfile: createKpContinuityEquationPresentationProfileV1({
      nativeHandoff: "atomic-v1",
      depth: "semantic-depth-v1",
      continuants: "transit-then-reflow-v1"
    }),
    metadata: {
      sourceTraceId: source.sourceTraceId,
      equationSequenceEnvelopeRecipe: "measure-once-per-sequence-v1",
      equationFractionHierarchyRecipe: "preserve-native-katex-tree-v1"
    }
  });
}

function selector(objectId: string, path: string): string {
  return `${objectId}.${path}`;
}
