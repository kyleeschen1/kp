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
export const kpFractionCompositionDenominatorCancellationTransformationId =
  "fraction-solve.step.cancel-denominator";
export const kpFractionCompositionCoefficientCancellationTransformationId =
  "fraction-solve.step.cancel-coefficient";

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

export function createKpFractionCompositionDenominatorCancellationAuthoring(
  transformation: KpSemanticTransformation
): KpVerifiedCancellationPresentationAuthoring {
  requireTransformation(
    transformation,
    kpFractionCompositionDenominatorCancellationTransformationId
  );
  // The product operator participates in the cancellation beat but is not one
  // of the two inverse values; keeping it a catalyst prevents flat glyph sets
  // from making all three marks orbit as if they had the same semantic role.
  return verifyAuthoring(transformation, {
    schemaVersion: "kp.cancellation-presentation-authoring.v1",
    id: "fraction-composition.cancellation.denominator",
    transformationId: transformation.id,
    cancellationRecordId: "threes-cancel",
    inverseBundles: [
      {
        id: "fraction-composition.inverse.outer-three",
        selectorIds: ["balanced-multiplication.left.3"]
      },
      {
        id: "fraction-composition.inverse.denominator-three",
        selectorIds: [
          "balanced-multiplication.left.fraction.denominator"
        ]
      }
    ],
    catalysts: [{
      id: "fraction-composition.catalyst.product-operator",
      selectorIds: ["balanced-multiplication.left.operator.1"]
    }],
    artifacts: structuralBundles(
      transformation.correspondenceMap?.records ?? []
    ),
    survivors: survivorBundles(
      transformation.correspondenceMap?.records ?? []
    )
  });
}

export function createKpFractionCompositionCoefficientCancellationAuthoring(
  transformation: KpSemanticTransformation
): KpVerifiedCancellationPresentationAuthoring {
  requireTransformation(
    transformation,
    kpFractionCompositionCoefficientCancellationTransformationId
  );
  return verifyAuthoring(transformation, {
    schemaVersion: "kp.cancellation-presentation-authoring.v1",
    id: "fraction-composition.cancellation.coefficient",
    transformationId: transformation.id,
    cancellationRecordId: "twos-cancel",
    inverseBundles: [
      {
        id: "fraction-composition.inverse.numerator-two",
        selectorIds: ["balanced-division.left.numerator.2"]
      },
      {
        id: "fraction-composition.inverse.denominator-two",
        selectorIds: ["balanced-division.left.denominator"]
      }
    ],
    catalysts: [],
    artifacts: structuralBundles(
      transformation.correspondenceMap?.records ?? []
    ),
    survivors: survivorBundles(
      transformation.correspondenceMap?.records ?? []
    )
  });
}

function requireTransformation(
  transformation: KpSemanticTransformation,
  expectedId: string
): void {
  if (transformation.id !== expectedId) {
    throw new Error(
      `Expected fraction-composition transformation ${expectedId}, received ` +
      `${transformation.id}.`
    );
  }
}

function verifyAuthoring(
  transformation: KpSemanticTransformation,
  draft: KpCancellationPresentationAuthoringDraft
): KpVerifiedCancellationPresentationAuthoring {
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

function survivorBundles(
  records: NonNullable<
    KpSemanticTransformation["correspondenceMap"]
  >["records"]
) {
  return records
    .filter(({ relation }) =>
      relation === "identity" || relation === "role-change"
    )
    .map((record) => ({
      id: `fraction-composition.survivor.${record.id}`,
      sourceSelectorIds: record.sourceSelectorIds,
      targetSelectorIds: record.targetSelectorIds
    }));
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
