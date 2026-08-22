import {
  kpCanonicalCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";

export interface KpLogProductMaterialFactorContinuity {
  readonly semanticId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly identityEffect: "preserve";
}

export interface KpLogProductMaterialApplicationDerivation {
  readonly sourceApplicationEntityId: string;
  readonly generatedTargetApplicationEntityIds: readonly string[];
  readonly relation: "fan-out";
  readonly sourceIdentityEffect: "withdraw-source";
  readonly targetIdentityEffect: "generate-successor";
}

export interface KpLogProductMaterialLineageContract {
  readonly schemaVersion: "kp.log-product-material-lineage.v1";
  readonly factorContinuities: readonly KpLogProductMaterialFactorContinuity[];
  readonly applicationDerivation: KpLogProductMaterialApplicationDerivation;
}

function requireRecord(suffix: string) {
  const records = kpCanonicalCompiledLogProductOperation.transformation
    .correspondenceMap?.records;
  const record = records?.find(({ id }) =>
    id === `correspondence.log-product.${suffix}`
  );
  if (record === undefined) {
    throw new Error(`Missing canonical log-product ${suffix} correspondence.`);
  }
  return record;
}

function buildLineage(): KpLogProductMaterialLineageContract {
  const { family } = kpCanonicalCompiledLogProductOperation.contract;
  const factorContinuities = family.factors.map((factor) => {
    const record = requireRecord(`${factor.name}-argument-continuity`);
    if (
      record.relation !== "role-change" ||
      record.sourceSelectorIds.length !== 1 ||
      record.targetSelectorIds.length !== 1 ||
      record.sourceSelectorIds[0] !== factor.sourceOccurrenceId ||
      record.targetSelectorIds[0] !== factor.targetOccurrenceId
    ) {
      throw new Error(
        `Log-product factor ${factor.name} must preserve one authored occurrence lineage.`
      );
    }
    return Object.freeze({
      semanticId: factor.semanticId,
      sourceEntityId: factor.sourceOccurrenceId,
      targetEntityId: factor.targetOccurrenceId,
      identityEffect: "preserve" as const
    });
  });

  const applicationFission = requireRecord("application-fission");
  if (
    applicationFission.relation !== "fan-out" ||
    applicationFission.sourceSelectorIds.length !== 1 ||
    applicationFission.targetSelectorIds.length !== family.factors.length ||
    new Set(applicationFission.targetSelectorIds).size !==
      applicationFission.targetSelectorIds.length ||
    applicationFission.targetSelectorIds.includes(
      applicationFission.sourceSelectorIds[0]!
    )
  ) {
    throw new Error(
      "Log-product applications require one withdrawn source and distinct generated successors."
    );
  }

  return Object.freeze({
    schemaVersion: "kp.log-product-material-lineage.v1",
    factorContinuities: Object.freeze(factorContinuities),
    applicationDerivation: Object.freeze({
      sourceApplicationEntityId: applicationFission.sourceSelectorIds[0]!,
      generatedTargetApplicationEntityIds: Object.freeze([
        ...applicationFission.targetSelectorIds
      ]),
      relation: "fan-out",
      sourceIdentityEffect: "withdraw-source",
      targetIdentityEffect: "generate-successor"
    })
  });
}

// Compile this once from semantic correspondence so later visual projection
// cannot accidentally imply that one source ln occurrence duplicated itself.
export const kpCanonicalLogProductMaterialLineage = buildLineage();

