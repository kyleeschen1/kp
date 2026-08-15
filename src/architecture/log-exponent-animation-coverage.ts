import {
  symbolicManipulationFamilyById
} from "../animation/symbolic-manipulation-family-registry.ts";

export type KpLogExponentCoverageStatus =
  | "concrete-law-sample"
  | "supporting-motif-sample"
  | "semantic-definition-only";

export interface KpLogExponentOperationCoverage {
  readonly definitionId: string;
  readonly transformType: string;
  readonly status: KpLogExponentCoverageStatus;
  readonly animationIds: readonly string[];
  readonly note: string;
}

export interface KpLogExponentCoverageInventory {
  readonly schemaVersion: "kp.log-exponent-animation-coverage.v1";
  readonly familyId: "family.algebra.exponent-log-laws";
  readonly declaredDefinitionCount: number;
  readonly concreteRuntimeSampleCount: number;
  readonly concretelySampledDefinitionCount: number;
  readonly supportingSampleAnimationIds: readonly string[];
  readonly operations: readonly KpLogExponentOperationCoverage[];
}

const familyId = "family.algebra.exponent-log-laws" as const;

/**
 * Family promotion records semantic readiness, not visual completion. This
 * inventory keeps that distinction executable so new work cannot mistake a
 * generic wrapper sample for an animated logarithm law.
 */
export function createKpLogExponentCoverageInventory():
  KpLogExponentCoverageInventory {
  const family = symbolicManipulationFamilyById(familyId);
  if (family === undefined) {
    throw new Error(`Missing symbolic manipulation family ${familyId}.`);
  }

  const concreteSamples = family.runtimeSamples.filter(
    (sample) => sample.availability === "concrete"
  );
  const sampledDefinitions = new Map<string, string[]>();
  const supportingSampleAnimationIds: string[] = [];

  for (const sample of concreteSamples) {
    const definitionIds = sample.transformationDefinitionIds ?? [];
    if (definitionIds.length === 0) {
      supportingSampleAnimationIds.push(sample.animationId);
      continue;
    }
    for (const definitionId of definitionIds) {
      const animationIds = sampledDefinitions.get(definitionId) ?? [];
      animationIds.push(sample.animationId);
      sampledDefinitions.set(definitionId, animationIds);
    }
  }

  return Object.freeze({
    schemaVersion: "kp.log-exponent-animation-coverage.v1",
    familyId,
    declaredDefinitionCount: family.transformationDefinitions.length,
    concreteRuntimeSampleCount: concreteSamples.length,
    concretelySampledDefinitionCount: sampledDefinitions.size,
    supportingSampleAnimationIds: Object.freeze(
      [...supportingSampleAnimationIds].sort()
    ),
    operations: Object.freeze(
      family.transformationDefinitions.map((definition) => {
        const animationIds = sampledDefinitions.get(definition.id) ?? [];
        return Object.freeze({
          definitionId: definition.id,
          transformType: definition.transformType,
          status: animationIds.length > 0
            ? "concrete-law-sample" as const
            : "semantic-definition-only" as const,
          animationIds: Object.freeze([...animationIds].sort()),
          note: animationIds.length > 0
            ? "The family names a concrete sample for this exact law."
            : "The family declares this law but has no concrete runtime sample."
        });
      })
    )
  });
}

