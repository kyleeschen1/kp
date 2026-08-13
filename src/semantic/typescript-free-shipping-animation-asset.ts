import {
  checkKpAnimationAssetReferenceClosure,
  createKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  createKpTypeScriptRefactorMotionPlan,
  type KpVerifiedTypeScriptRefactorMotionPlan
} from "../animation/typescript-refactor-motion-plan.ts";
import { createSemanticTransformationRef } from "./animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "./transformation-composition.ts";
import {
  createKpTypeScriptRefactorBehaviorCertificate,
  type KpTypeScriptRefactorBehaviorCertificateV1
} from "./typescript-refactor-behavior-proof.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "./typescript-free-shipping-refactor-contract.ts";
import {
  createKpTypeScriptRefactorOperationSet,
  type KpTypeScriptRefactorOperationSet
} from "./typescript-refactor-operations.ts";
import {
  createKpTypeScriptRefactorScore,
  type KpTypeScriptRefactorScoreV1
} from "./typescript-refactor-score.ts";
import { readKpTypeScriptRefactorSemanticArtifact } from
  "./typescript-refactor-semantic-artifact.ts";
import type { KpTypeScriptRefactorSemanticArtifactV1 } from
  "./typescript-refactor-semantic-model.ts";

export interface KpTypeScriptFreeShippingAnimationAsset {
  readonly id: "animation.programming.typescript-free-shipping-refactor";
  readonly animation: KpAnimationAsset;
  readonly semantics: KpTypeScriptRefactorSemanticArtifactV1;
  readonly operations: KpTypeScriptRefactorOperationSet;
  readonly behavior: KpTypeScriptRefactorBehaviorCertificateV1;
  readonly score: KpTypeScriptRefactorScoreV1;
  readonly motionPlan: KpVerifiedTypeScriptRefactorMotionPlan;
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

export function createKpTypeScriptFreeShippingAnimationAsset():
  KpTypeScriptFreeShippingAnimationAsset {
  const semantics = readKpTypeScriptRefactorSemanticArtifact();
  const operations = createKpTypeScriptRefactorOperationSet(semantics);
  const behavior = createKpTypeScriptRefactorBehaviorCertificate(semantics);
  const score = createKpTypeScriptRefactorScore();
  const motionPlan = createKpTypeScriptRefactorMotionPlan({
    semantics,
    operations,
    score
  });
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
    id: "animation.programming.typescript-free-shipping-refactor",
    title: kpTypeScriptFreeShippingRefactorContract.title,
    bundle: operations.bundle,
    transformations: operations.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationSequence({
        id: "sequence.typescript.free-shipping-threshold",
        label: "Extract the duplicated threshold rule",
        children: leaves,
        summary: "Authored refactor order; compiler traversal does not determine pedagogy."
      }),
      annotations: operations.transformations.map((transformation, index) => ({
        id: `annotation.typescript.refactor.${index + 1}`,
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
      id: "render.typescript.free-shipping-threshold",
      kind: "programming",
      objectIds: operations.bundle.objects.map(({ id }) => id),
      selectorIds: operations.bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: operations.transformations.map(({ id }) => id),
      timelineId: score.timeline.id,
      summary: "Native selectable TypeScript source with semantic refactor continuity."
    }],
    checks: [
      {
        id: "check.typescript.refactor-reference-closure",
        lawId: "animation.reference-closure",
        level: "strict"
      },
      {
        id: "check.typescript.refactor-bounded-parity",
        lawId: "kp.typescript.bounded-behavior-parity",
        level: "strict",
        summary: "The three declared threshold cases pass before and after."
      }
    ],
    exportTargets: [{
      id: "export.typescript.free-shipping.static-step",
      kind: "static-step",
      artifactId: "animation.programming.typescript-free-shipping-refactor",
      summary: "Exact before and after source remain available without motion."
    }],
    dashboard: {
      rowId: "animation-programming-typescript-free-shipping-refactor",
      tags: [
        "animation",
        "programming",
        "typescript",
        "refactor",
        "duplicate-rule",
        "behavior-parity"
      ],
      sampleTargetIds: ["render.typescript.free-shipping-threshold"],
      sourceRefIds: [kpTypeScriptFreeShippingRefactorContract.id]
    },
    metadata: {
      domain: "programming",
      summary: kpTypeScriptFreeShippingRefactorContract.noviceMotivation,
      language: "typescript",
      threshold: kpTypeScriptFreeShippingRefactorContract.threshold,
      proofScope: behavior.scope,
      semanticAuthority: "build-time-generated-source-identities"
    }
  });
  const closure = checkKpAnimationAssetReferenceClosure(animation);
  if (!closure.passed) throw new Error(closure.failures[0]!.message);

  return Object.freeze({
    id: "animation.programming.typescript-free-shipping-refactor",
    animation,
    semantics,
    operations,
    behavior,
    score,
    motionPlan,
    staticEndpoints: Object.freeze({
      before: kpTypeScriptFreeShippingRefactorContract.before.source,
      after: kpTypeScriptFreeShippingRefactorContract.after.source
    }),
    accessibility: Object.freeze({
      title: "Extracting one free-shipping rule",
      description: kpTypeScriptFreeShippingRefactorContract.learningClaim,
      settledCode: kpTypeScriptFreeShippingRefactorContract.after.source
    })
  });
}
