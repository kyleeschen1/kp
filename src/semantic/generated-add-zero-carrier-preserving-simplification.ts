import {
  createAcceptedGeneratedAddZeroAnimationAsset
} from "../animation/llm-animation-draft-examples.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import { findKpAssetSelector } from "./asset.ts";
import type {
  KpCarrierPreservingSimplificationEvidenceCandidate
} from "./carrier-preserving-simplification-evidence.ts";

export const kpGeneratedAddZeroAnimationId =
  "animation.generated.add-zero" as const;
const TRANSFORMATION_ID = "transform.generated.add-zero.remove";
const SOURCE_ID = "equation.generated.add-zero.before";
const TARGET_ID = "equation.generated.add-zero.after";
const LAW_ID = "law.algebra.additive-identity";

export const kpGeneratedAddZeroCarrierSelectorIds = Object.freeze({
  sourceCarrier: "generated.add-zero.before.x",
  sourceOperator: "generated.add-zero.before.plus",
  sourceIdentityWitness: "generated.add-zero.before.zero",
  sourceEquals: "generated.add-zero.before.equals",
  sourceFour: "generated.add-zero.before.four",
  targetCarrier: "generated.add-zero.after.x",
  targetEquals: "generated.add-zero.after.equals",
  targetFour: "generated.add-zero.after.four"
} as const);

export interface KpGeneratedAddZeroCarrierSource {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
  readonly evidenceCandidate:
    KpCarrierPreservingSimplificationEvidenceCandidate;
}

/**
 * The accepted v1 draft remains an untrusted authoring artifact. This narrow
 * adapter certifies only its exact reviewed semantic structure, so an LLM
 * cannot obtain a strict algebra law merely by spelling a transform type.
 */
export function createKpGeneratedAddZeroCarrierSource():
KpGeneratedAddZeroCarrierSource {
  const animation = createAcceptedGeneratedAddZeroAnimationAsset();
  const transformation = requiredTransformation(animation);
  assertReviewedAddZeroStructure(animation, transformation);
  const certifiedTransformation = createKpSemanticTransformation({
    id: transformation.id,
    ...(transformation.definitionId === undefined
      ? {}
      : { definitionId: transformation.definitionId }),
    transformType: transformation.transformType,
    title: transformation.title,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    correspondenceMap: transformation.correspondenceMap,
    correspondence: transformation.correspondence,
    ...(transformation.assumptions === undefined
      ? {}
      : { assumptions: transformation.assumptions }),
    lawRefs: [{ id: LAW_ID, level: "strict" }]
  });
  return Object.freeze({
    animation,
    transformation: certifiedTransformation,
    evidenceCandidate: createEvidenceCandidate()
  });
}

function createEvidenceCandidate():
KpCarrierPreservingSimplificationEvidenceCandidate {
  const ids = kpGeneratedAddZeroCarrierSelectorIds;
  return Object.freeze({
    schemaVersion:
      "kp.carrier-preserving-simplification-evidence.v1" as const,
    id: "kp.carrier-evidence.generated-add-zero.v1",
    transformationId: TRANSFORMATION_ID,
    endpoints: Object.freeze({
      sourceObjectId: SOURCE_ID,
      targetObjectId: TARGET_ID
    }),
    carrier: Object.freeze({
      correspondenceRecordId: "relation.generated.add-zero.x",
      sourceSelectorId: ids.sourceCarrier,
      targetSelectorId: ids.targetCarrier
    }),
    identityLawWitness: Object.freeze({
      lawId: LAW_ID,
      sourceSelectorId: ids.sourceIdentityWitness,
      removalRecordId: "relation.generated.add-zero.zero"
    }),
    removedSyntaxCohort: Object.freeze({
      selectorIds: Object.freeze([
        ids.sourceOperator,
        ids.sourceIdentityWitness
      ] as const),
      correspondenceRecordIds: Object.freeze([
        "relation.generated.add-zero.plus",
        "relation.generated.add-zero.zero"
      ] as const)
    }),
    stationaryContext: Object.freeze([
      Object.freeze({
        correspondenceRecordId: "relation.generated.add-zero.equals",
        sourceSelectorId: ids.sourceEquals,
        targetSelectorId: ids.targetEquals
      }),
      Object.freeze({
        correspondenceRecordId: "relation.generated.add-zero.four",
        sourceSelectorId: ids.sourceFour,
        targetSelectorId: ids.targetFour
      })
    ])
  });
}

function requiredTransformation(
  animation: KpAnimationAsset
): KpSemanticTransformation {
  if (animation.id !== kpGeneratedAddZeroAnimationId) {
    throw new Error("Add-zero certification received the wrong animation.");
  }
  const transformations = animation.transformations.filter(
    ({ id }) => id === TRANSFORMATION_ID
  );
  if (transformations.length !== 1) {
    throw new Error("Add-zero certification requires one exact transformation.");
  }
  return transformations[0]!;
}

function assertReviewedAddZeroStructure(
  animation: KpAnimationAsset,
  transformation: KpSemanticTransformation
): void {
  const ids = kpGeneratedAddZeroCarrierSelectorIds;
  if (
    transformation.transformType !== "simplify-additive-identity" ||
    transformation.sourceObjectIds.length !== 1 ||
    transformation.sourceObjectIds[0] !== SOURCE_ID ||
    transformation.targetObjectIds.length !== 1 ||
    transformation.targetObjectIds[0] !== TARGET_ID
  ) {
    throw new Error("Add-zero certification semantic endpoints drifted.");
  }
  const expectedLabels = new Map<string, string>([
    [ids.sourceCarrier, "x"],
    [ids.sourceOperator, "+"],
    [ids.sourceIdentityWitness, "0"],
    [ids.sourceEquals, "="],
    [ids.sourceFour, "4"],
    [ids.targetCarrier, "x"],
    [ids.targetEquals, "="],
    [ids.targetFour, "4"]
  ]);
  for (const [selectorId, label] of expectedLabels) {
    if (findKpAssetSelector(animation.bundle, selectorId)?.label !== label) {
      throw new Error(
        `Add-zero certification selector ${selectorId} no longer means ${label}.`
      );
    }
  }
}
