import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  validateAndMintKpCancellationPresentationAuthoring,
  type KpCancellationPresentationAuthoringDraft,
  type KpVerifiedCancellationPresentationAuthoring
} from "./cancellation-presentation-authoring.ts";

export const kpFractionCompositionAdditiveCancellationTransformationId =
  "fraction-solve.step.cancel-additive-inverses";

export function createKpFractionCompositionAdditiveCancellationAuthoring(
  transformation: KpSemanticTransformation
): KpVerifiedCancellationPresentationAuthoring {
  if (
    transformation.id !==
      kpFractionCompositionAdditiveCancellationTransformationId
  ) {
    throw new Error(
      `Expected fraction-composition additive cancellation, received ` +
      `${transformation.id}.`
    );
  }
  const records = transformation.correspondenceMap?.records ?? [];
  const draft: KpCancellationPresentationAuthoringDraft = {
    schemaVersion: "kp.cancellation-presentation-authoring.v1",
    id: "fraction-composition.cancellation.additive-inverses",
    transformationId: transformation.id,
    cancellationRecordId: "left-fours-cancel",
    inverseBundles: [
      {
        id: "fraction-composition.inverse.positive-four",
        selectorIds: [
          "balanced-subtraction.left.source.operator.1",
          "balanced-subtraction.left.4"
        ]
      },
      {
        id: "fraction-composition.inverse.negative-four",
        selectorIds: [
          "balanced-subtraction.left.minus4.minus",
          "balanced-subtraction.left.minus4.value"
        ]
      }
    ],
    catalysts: [],
    artifacts: structuralBundles(records),
    survivors: records
      .filter(({ relation }) =>
        relation === "identity" || relation === "role-change"
      )
      .map((record) => ({
        id: `fraction-composition.survivor.${record.id}`,
        sourceSelectorIds: record.sourceSelectorIds,
        targetSelectorIds: record.targetSelectorIds
      }))
  };
  const result = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft
  });
  if (result.status !== "verified") {
    throw new Error(
      result.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  return result.authoring;
}

function structuralBundles(
  records: NonNullable<
    KpSemanticTransformation["correspondenceMap"]
  >["records"]
) {
  return records
    .filter(({ relation }) =>
      relation === "removal" || relation === "artifact"
    )
    .map((record) => ({
      id: `fraction-composition.artifact.${record.id}`,
      selectorIds: record.sourceSelectorIds
    }));
}
