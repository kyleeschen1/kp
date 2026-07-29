import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation,
  kpGeneratedAlgebraTransformationFamilyId,
  type KpCompilerGeneratedAlgebraTransformation
} from "../semantic/generated-algebra-transformation-authority.ts";
import {
  deriveKpCancellationPresentationRoleComplements,
  validateAndMintKpCancellationPresentationAuthoring,
  type KpCancellationPresentationAuthoringDraft
} from "./cancellation-presentation-authoring.ts";
import {
  compileKpCancellationOperationPresentationPlan
} from "./cancellation-operation-presentation-plan.ts";
import type {
  KpVerifiedInverseCancellationPresentationPlan
} from "./operation-presentation-plan-types.ts";

const generatedCancellationSpecs = {
  "definition.generated.linear-solve.cancel-additive-inverses": {
    transformType: "cancelAdditiveInverses",
    operationId: "kp.algebra.cancel-additive-inverses",
    cancellationRecordId: "generated-additive-inverses-cancel",
    inverseSuffixes: ["lhs.addend", "lhs.subtract"]
  },
  "definition.generated.linear-solve.cancel-multiplicative-inverses": {
    transformType: "cancelMultiplicativeInverses",
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    cancellationRecordId: "generated-multiplicative-inverses-cancel",
    inverseSuffixes: ["lhs.coefficient", "lhs.divide"]
  }
} as const;

type KpGeneratedCancellationDefinitionId =
  keyof typeof generatedCancellationSpecs;

export const kpGeneratedCancellationDefinitionIds = Object.freeze(
  Object.keys(generatedCancellationSpecs) as
    KpGeneratedCancellationDefinitionId[]
);

export function compileKpGeneratedAlgebraCancellationPresentationPlan(
  transformation: KpSemanticTransformation
): KpVerifiedInverseCancellationPresentationPlan | undefined {
  if (!isKpCompilerGeneratedAlgebraTransformation(transformation)) {
    return undefined;
  }
  return compileAuthorizedGeneratedCancellation(transformation);
}

function compileAuthorizedGeneratedCancellation(
  transformation: KpCompilerGeneratedAlgebraTransformation
): KpVerifiedInverseCancellationPresentationPlan | undefined {
  const definitionId = transformation.definitionId;
  if (
    definitionId === undefined ||
    !isGeneratedCancellationDefinitionId(definitionId)
  ) return undefined;
  if (
    kpGeneratedAlgebraTransformationFamilyId(transformation) !==
      "generated.linear-solve"
  ) {
    throw new Error(
      `Generated cancellation ${transformation.id} has foreign family authority.`
    );
  }
  const spec = generatedCancellationSpecs[definitionId];
  if (transformation.transformType !== spec.transformType) {
    throw new Error(
      `Generated cancellation ${transformation.id} does not match ` +
      `${definitionId}.`
    );
  }
  if (transformation.sourceObjectIds.length !== 1) {
    throw new Error(
      `Generated cancellation ${transformation.id} requires one source.`
    );
  }
  const sourceObjectId = transformation.sourceObjectIds[0]!;
  const namespace = `generated-cancellation.${transformation.id}`;
  const draft: KpCancellationPresentationAuthoringDraft = {
    schemaVersion: "kp.cancellation-presentation-authoring.v1",
    id: `${namespace}.authoring`,
    transformationId: transformation.id,
    cancellationRecordId: spec.cancellationRecordId,
    inverseBundles: [
      {
        id: `${namespace}.inverse.first`,
        selectorIds: [`${sourceObjectId}.${spec.inverseSuffixes[0]}`]
      },
      {
        id: `${namespace}.inverse.second`,
        selectorIds: [`${sourceObjectId}.${spec.inverseSuffixes[1]}`]
      }
    ],
    catalysts: [],
    ...deriveKpCancellationPresentationRoleComplements({
      transformation,
      bundleNamespace: namespace
    })
  };
  const authoring = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft
  });
  if (authoring.status !== "verified") {
    throw new Error(
      `Generated cancellation ${transformation.id} is not role-complete:\n` +
      authoring.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  const plan = compileKpCancellationOperationPresentationPlan(
    authoring.authoring
  );
  if (plan.planKind !== "inverse-cancellation") {
    throw new Error(
      `Generated cancellation ${transformation.id} compiled ${plan.planKind}.`
    );
  }
  return plan;
}

function isGeneratedCancellationDefinitionId(
  value: string
): value is KpGeneratedCancellationDefinitionId {
  return Object.hasOwn(generatedCancellationSpecs, value);
}
