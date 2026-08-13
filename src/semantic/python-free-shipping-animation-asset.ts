import {
  checkKpAnimationAssetReferenceClosure,
  createKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  createKpPythonRefactorMotionPlan,
  type KpVerifiedPythonRefactorMotionPlan
} from "../animation/python-refactor-motion-plan.ts";
import { createSemanticTransformationRef } from "./animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "./transformation-composition.ts";
import {
  createKpPythonRefactorBehaviorCertificate,
  type KpPythonRefactorBehaviorCertificateV1
} from "./python-refactor-behavior-proof.ts";
import { kpPythonFreeShippingRefactorContract } from
  "./python-free-shipping-refactor-contract.ts";
import {
  createKpPythonRefactorOperationSet,
  type KpPythonRefactorOperationSet
} from "./python-refactor-operations.ts";
import {
  createKpPythonRefactorScore,
  type KpPythonRefactorScoreV1
} from "./python-refactor-score.ts";
import { readKpPythonRefactorSemanticArtifact } from
  "./python-refactor-semantic-artifact.ts";
import type { KpPythonRefactorSemanticArtifactV1 } from
  "./python-refactor-semantic-model.ts";

export interface KpPythonFreeShippingAnimationAsset {
  readonly id: "animation.programming.python-free-shipping-refactor";
  readonly animation: KpAnimationAsset;
  readonly semantics: KpPythonRefactorSemanticArtifactV1;
  readonly operations: KpPythonRefactorOperationSet;
  readonly behavior: KpPythonRefactorBehaviorCertificateV1;
  readonly score: KpPythonRefactorScoreV1;
  readonly motionPlan: KpVerifiedPythonRefactorMotionPlan;
  readonly staticEndpoints: {
    readonly before: string;
    readonly after: string;
  };
  readonly accessibility: {
    readonly title: string;
    readonly description: string;
    readonly settledCode: string;
  };
}

export function createKpPythonFreeShippingAnimationAsset():
  KpPythonFreeShippingAnimationAsset {
  const semantics = readKpPythonRefactorSemanticArtifact();
  const operations = createKpPythonRefactorOperationSet(semantics);
  const behavior = createKpPythonRefactorBehaviorCertificate(semantics);
  const score = createKpPythonRefactorScore();
  const motionPlan = createKpPythonRefactorMotionPlan({ semantics, operations, score });
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
    id: "animation.programming.python-free-shipping-refactor",
    title: kpPythonFreeShippingRefactorContract.title,
    bundle: operations.bundle,
    transformations: operations.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationSequence({
        id: "sequence.python.free-shipping-threshold",
        label: "Extract the duplicated threshold rule",
        children: leaves,
        summary: "Authored refactor order; AST traversal does not determine pedagogy."
      }),
      annotations: operations.transformations.map((transformation, index) => ({
        id: `annotation.python.refactor.${index + 1}`,
        kind: "focus",
        targetNodeId: transformation.id,
        placement: "during",
        selectorIds: transformation.correspondenceMap?.records.flatMap((record) => [
          ...record.sourceSelectorIds,
          ...record.targetSelectorIds
        ]),
        summary: transformation.title
      }))
    }),
    timeline: {
      id: score.timeline.id,
      durationMs: score.durationMs,
      beatCount: score.stages.length,
      markerIds: score.stages.map(({ id }) => id)
    },
    renderTargets: [{
      id: "render.python.free-shipping-threshold",
      kind: "programming",
      objectIds: operations.bundle.objects.map(({ id }) => id),
      selectorIds: operations.bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: operations.transformations.map(({ id }) => id),
      timelineId: score.timeline.id,
      summary: "Native selectable Python source with semantic refactor continuity."
    }],
    checks: [
      {
        id: "check.python.refactor-reference-closure",
        lawId: "animation.reference-closure",
        level: "strict"
      },
      {
        id: "check.python.refactor-bounded-parity",
        lawId: "kp.python.bounded-behavior-parity",
        level: "strict",
        summary: "The three declared threshold cases pass before and after."
      }
    ],
    exportTargets: [{
      id: "export.python.free-shipping.static-step",
      kind: "static-step",
      artifactId: "animation.programming.python-free-shipping-refactor",
      summary: "Exact before and after source remain available without motion."
    }],
    dashboard: {
      rowId: "animation-programming-python-free-shipping-refactor",
      tags: [
        "animation",
        "programming",
        "python",
        "refactor",
        "duplicate-rule",
        "behavior-parity"
      ],
      sampleTargetIds: ["render.python.free-shipping-threshold"],
      sourceRefIds: [kpPythonFreeShippingRefactorContract.id]
    },
    metadata: {
      domain: "programming",
      summary: kpPythonFreeShippingRefactorContract.noviceMotivation,
      language: "python",
      threshold: kpPythonFreeShippingRefactorContract.threshold,
      proofScope: behavior.scope,
      semanticAuthority: "build-time-generated-source-identities"
    }
  });
  const closure = checkKpAnimationAssetReferenceClosure(animation);
  if (!closure.passed) throw new Error(closure.failures[0]!.message);

  return Object.freeze({
    id: "animation.programming.python-free-shipping-refactor",
    animation,
    semantics,
    operations,
    behavior,
    score,
    motionPlan,
    staticEndpoints: Object.freeze({
      before: kpPythonFreeShippingRefactorContract.before.source,
      after: kpPythonFreeShippingRefactorContract.after.source
    }),
    accessibility: Object.freeze({
      title: "Extracting one free-shipping rule in Python",
      description: kpPythonFreeShippingRefactorContract.learningClaim,
      settledCode: kpPythonFreeShippingRefactorContract.after.source
    })
  });
}
