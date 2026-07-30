import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  kpOperationEvaluationContinuityReference
} from "./operation-evaluation-continuity-reference.ts";
import {
  createKpConstantSumEvaluationAsset,
  type KpConstantSumEvaluationSpec
} from "../semantic/constant-sum-evaluation-asset.ts";
import {
  createKpConstantQuotientEvaluationAsset,
  type KpConstantQuotientEvaluationSpec
} from "../semantic/constant-quotient-evaluation-asset.ts";
import type { KpAssetBundle } from "../semantic/asset.ts";
import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createKpAnimationPresentationConstraintsV1
} from "./presentation-constraints.ts";

export const kpOnePlusTwoEvaluationAnimationId =
  "animation.operation-evaluation.one-plus-two";
export const kpFivePlusTwoEvaluationAnimationId =
  "animation.operation-evaluation.five-plus-two";
export const kpThreeSixthsEvaluationAnimationId =
  "animation.operation-evaluation.three-sixths";
export const kpFivePlusTwoEvaluationSpec =
  Object.freeze({
    id: "five-plus-two",
    left: 5,
    right: 2
  }) satisfies KpConstantSumEvaluationSpec;
export const kpThreeSixthsEvaluationSpec =
  Object.freeze({
    id: "three-sixths",
    numerator: 3,
    denominator: 6
  }) satisfies KpConstantQuotientEvaluationSpec;

export function createKpConstantSumEvaluationAnimationAsset(
  spec: KpConstantSumEvaluationSpec
): KpAnimationAsset {
  return createKpOperationEvaluationAnimationAsset(
    createKpConstantSumEvaluationAsset(spec)
  );
}

export function createKpConstantQuotientEvaluationAnimationAsset(
  spec: KpConstantQuotientEvaluationSpec
): KpAnimationAsset {
  return createKpOperationEvaluationAnimationAsset(
    createKpConstantQuotientEvaluationAsset(spec)
  );
}

function createKpOperationEvaluationAnimationAsset(source: {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}): KpAnimationAsset {
  const transformation = source.transformation;
  const animationId = `animation.${source.id}`;
  const timelineId = `timeline.${source.id}.shared`;
  const root = createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    })
  );
  const pacing = kpOperationEvaluationContinuityReference.pacing;
  const durationMs = Math.ceil(
    pacing.minimumActionDurationMs /
    (1 - pacing.setupFraction - pacing.settleFraction)
  );

  return createKpAnimationAsset({
    id: animationId,
    title: source.title,
    bundle: source.bundle,
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      // Shared reference pacing prevents individual arithmetic callers from
      // quietly changing the learned evaluation motif's readable duration.
      durationMs,
      beatCount: 50
    },
    layout: {
      id: `layout.${source.id}.animation`,
      kind: "single",
      targetId: `render.${source.id}.equation`
    },
    renderTargets: [{
      id: `render.${source.id}.equation`,
      kind: "equation",
      objectIds: source.bundle.objects.map(({ id }) => id),
      transformationIds: [transformation.id],
      timelineId
    }],
    checks: [
      {
        id: `check.${source.id}.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: `check.${source.id}.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    exportTargets: [{
      id: `export.${source.id}.static-step`,
      kind: "static-step",
      artifactId: `artifact.${source.id}.static-step`
    }],
    dashboard: {
      rowId: `animation-${source.id.replaceAll(".", "-")}`,
      tags: [
        "animation",
        "arithmetic",
        "equation",
        "operation-evaluation",
        "presentation-compiler"
      ],
      sourceRefIds: [
        kpOperationEvaluationContinuityReference.canonicalExemplar.id
      ]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    presentationConstraints:
      createKpAnimationPresentationConstraintsV1({
        requiredCapabilities: [
          "accessibility",
          "direct-seek",
          "responsive",
          "rewind"
        ]
      }),
    metadata: {
      summary:
        "A registry-compiled arithmetic evaluation with verified opaque " +
        "paint continuity and native KaTeX endpoints.",
      operationEvaluationContinuityReference:
        kpOperationEvaluationContinuityReference.canonicalExemplar.id
    }
  });
}

export function createKpOnePlusTwoEvaluationAnimationAsset():
KpAnimationAsset {
  return createKpConstantSumEvaluationAnimationAsset({
    id: "one-plus-two",
    left: 1,
    right: 2
  });
}

export function createKpFivePlusTwoEvaluationAnimationAsset():
KpAnimationAsset {
  return createKpConstantSumEvaluationAnimationAsset(
    kpFivePlusTwoEvaluationSpec
  );
}

export function createKpThreeSixthsEvaluationAnimationAsset():
KpAnimationAsset {
  return createKpConstantQuotientEvaluationAnimationAsset(
    kpThreeSixthsEvaluationSpec
  );
}
