import {
  checkKpAnimationAssetReferenceClosure,
  createKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import { createSemanticTransformationRef } from "./animation.ts";
import {
  kpNormalMatrixProofCheckpoints,
  kpNormalMatrixProofDurationMs
} from "./normal-matrix-proof-checkpoints.ts";
import {
  createKpNormalMatrixProofOperationSet,
  type KpNormalMatrixProofOperationSet
} from "./normal-matrix-proof-operations.ts";
import { kpNormalMatrixProofPrompts } from
  "./normal-matrix-proof-prompts.ts";
import { kpNormalMatrixProofSemanticRegistry } from
  "./normal-matrix-proof-semantics.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "./transformation-composition.ts";

export interface KpNormalMatrixProofAnimationAsset {
  readonly id: "animation.linear-algebra.normal-matrix-proof";
  readonly animation: KpAnimationAsset;
  readonly operations: KpNormalMatrixProofOperationSet;
  readonly checkpoints: typeof kpNormalMatrixProofCheckpoints;
  readonly prompts: typeof kpNormalMatrixProofPrompts;
  readonly accessibility: {
    readonly title: string;
    readonly description: string;
    readonly reducedMotion: "direct-checkpoint-seek";
  };
}

export function createKpNormalMatrixProofAnimationAsset():
  KpNormalMatrixProofAnimationAsset {
  const operations = createKpNormalMatrixProofOperationSet();
  const leaves = operations.transformations.map((transformation) =>
    createSemanticTransformationLeaf(createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    }))
  );
  const animation = createKpAnimationAsset({
    id: "animation.linear-algebra.normal-matrix-proof",
    title: "Why normality forces the off-diagonal row to vanish",
    bundle: operations.bundle,
    transformations: operations.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationSequence({
        id: "sequence.normal-proof.inductive-diagonalization",
        label: "Recover the normal-matrix induction",
        children: leaves,
        summary:
          "Pedagogical checkpoint order is authored independently of algebra-engine execution."
      }),
      annotations: operations.transformations.map((transformation, index) => ({
        id: `annotation.normal-proof.${index + 1}`,
        kind: "focus",
        targetNodeId: transformation.id,
        placement: "during",
        selectorIds: transformation.correspondenceMap?.records.flatMap(
          ({ sourceSelectorIds, targetSelectorIds }) => [
            ...sourceSelectorIds,
            ...targetSelectorIds
          ]
        ),
        summary: transformation.title
      }))
    }),
    timeline: {
      id: "timeline.normal-proof.checkpoints",
      durationMs: kpNormalMatrixProofDurationMs,
      beatCount: kpNormalMatrixProofCheckpoints.length,
      markerIds: kpNormalMatrixProofCheckpoints.map(({ id }) => id)
    },
    renderTargets: [{
      id: "render.normal-proof.native-katex-stage",
      kind: "matrix",
      objectIds: operations.bundle.objects.map(({ id }) => id),
      selectorIds: operations.bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: operations.transformations.map(({ id }) => id),
      timelineId: "timeline.normal-proof.checkpoints",
      summary:
        "One progressively enhanced native-KaTeX proof stage with semantic fragment wrappers."
    }],
    checks: [{
      id: "check.normal-proof-reference-closure",
      lawId: "animation.reference-closure",
      level: "strict"
    }, {
      id: "check.normal-proof-reviewed-mathematics",
      lawId: "kp.normal-matrix.reviewed-proof-fixture",
      level: "strict",
      summary: "The immutable proof fixture remains mathematical authority."
    }],
    exportTargets: [{
      id: "export.normal-proof.static-checkpoints",
      kind: "static-step",
      artifactId: "animation.linear-algebra.normal-matrix-proof",
      summary: "All six settled proof checkpoints remain available without motion."
    }],
    dashboard: {
      rowId: "animation-linear-algebra-normal-matrix-proof",
      tags: [
        "animation",
        "linear-algebra",
        "normal-matrix",
        "proof-memory",
        "induction"
      ],
      sampleTargetIds: ["render.normal-proof.native-katex-stage"],
      sourceRefIds: ["proof.linear-algebra.normal-matrix-unitary-diagonalization"]
    },
    metadata: {
      domain: "linear-algebra",
      semanticObjectCount: kpNormalMatrixProofSemanticRegistry.length,
      checkpointCount: kpNormalMatrixProofCheckpoints.length,
      promptCount: kpNormalMatrixProofPrompts.length,
      paintOwner: "native-katex",
      loading: "on-demand-stage-capability"
    }
  });
  const closure = checkKpAnimationAssetReferenceClosure(animation);
  if (!closure.passed) throw new Error(closure.failures[0]!.message);

  return Object.freeze({
    id: "animation.linear-algebra.normal-matrix-proof",
    animation,
    operations,
    checkpoints: kpNormalMatrixProofCheckpoints,
    prompts: kpNormalMatrixProofPrompts,
    accessibility: Object.freeze({
      title: "Why a normal matrix becomes block diagonal",
      description:
        "Compare the first row and first column contributions to see why normality forces the remaining row r to vanish and leaves a smaller normal block B.",
      reducedMotion: "direct-checkpoint-seek"
    })
  });
}
