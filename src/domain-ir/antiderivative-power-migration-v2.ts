import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2,
  compileKpEquationEvaluationFamilyCohortCertificatesV2,
  type KpVerifiedEquationEvaluationFamilyCertificateV2
} from "./equation-evaluation-family-certificate-v2.ts";
import {
  resolveKpEquationEmbeddedEvaluationAuthorityV2
} from "./equation-evaluation-authority-registry-v2.ts";
import type { KpEquationAssetMigrationV2 } from
  "./equation-asset-migration-v2.ts";
import {
  compileKpEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2,
  type KpEquationPresentationDomainPayloadV2
} from "./equation-presentation-plan-v2.ts";
import {
  compileKpTerminalEquationMigrationV2
} from "./terminal-equation-migration-v2.ts";

export const kpAntiderivativePowerAssetId =
  "animation.generated.calculus.integral.power-rule-quadratic" as const;

export const kpAntiderivativePowerEvaluationCohortIds = Object.freeze([
  "cohort.antiderivative-power.numerator-successor",
  "cohort.antiderivative-power.denominator-successor"
] as const);

export interface KpAntiderivativePowerEvaluationCohortV2 {
  readonly cohortId:
    (typeof kpAntiderivativePowerEvaluationCohortIds)[number];
  readonly certificate: KpVerifiedEquationEvaluationFamilyCertificateV2;
}

export interface KpAntiderivativePowerEvaluationCohortsPayloadV2
  extends KpEquationPresentationDomainPayloadV2 {
  readonly kind:
    "equation-domain.antiderivative-power-evaluation-cohorts.v2";
  readonly operationId: "kp.arithmetic.add";
  readonly cohorts: readonly [
    KpAntiderivativePowerEvaluationCohortV2,
    KpAntiderivativePowerEvaluationCohortV2
  ];
}

export interface KpAntiderivativePowerMigrationV2
  extends Omit<KpEquationAssetMigrationV2, "presentationPlan"> {
  readonly presentationPlan:
    KpCompiledEquationPresentationPlanV2<
      KpAntiderivativePowerEvaluationCohortsPayloadV2
    >;
}

/**
 * The parent antiderivative resolution remains one authored transformation.
 * Its two local additions travel as a bounded certified payload, so the
 * generic presentation plan does not pretend one transition is two events.
 */
export function compileKpAntiderivativePowerMigrationV2(
  animation: KpAnimationAsset
): KpAntiderivativePowerMigrationV2 {
  if (animation.id !== kpAntiderivativePowerAssetId) {
    throw new Error(`Unsupported antiderivative power asset ${animation.id}.`);
  }
  const migration = compileKpTerminalEquationMigrationV2(animation);
  const transformation = requiredTransformation(
    animation,
    "simplifyAntiderivativePowerRule"
  );
  const transitionId = `transition.${transformation.id}`;
  const parentTransition = migration.presentationPlan.transitions.find(
    ({ id }) => id === transitionId
  );
  if (parentTransition === undefined ||
      parentTransition.semanticOperation.operationId !==
        "kp.semantic-motion.resolve-antiderivative" ||
      parentTransition.semanticOperation.semanticClass !== "transformation") {
    throw new Error(
      `${transformation.id} lost its parent antiderivative operation.`
    );
  }
  const authority = resolveKpEquationEmbeddedEvaluationAuthorityV2({
    grammar: migration.grammar,
    transitionId,
    transformation,
    operationId: "kp.arithmetic.add"
  });
  if (authority.status !== "resolved") {
    throw new Error(authority.diagnostics.map(({ message }) => message)
      .join("\n"));
  }
  const family = compileKpEquationEvaluationFamilyCohortCertificatesV2({
    bundle: animation.bundle,
    transformation,
    authority: authority.authority
  });
  if (family.status !== "certified") {
    throw new Error(family.diagnostics.map(({ message }) => message)
      .join("\n"));
  }
  const cohorts = Object.freeze(family.certificates.map((certificate, index) => {
    const cohortId = certificate.topologyCertificate.cohortId;
    const expectedId = kpAntiderivativePowerEvaluationCohortIds[index];
    if (cohortId !== expectedId) {
      throw new Error(
        `${transformation.id} requires cohort ${expectedId}; received ${cohortId ?? "none"}.`
      );
    }
    return Object.freeze({ cohortId, certificate });
  })) as unknown as
    KpAntiderivativePowerEvaluationCohortsPayloadV2["cohorts"];
  const payload = Object.freeze({
    kind: "equation-domain.antiderivative-power-evaluation-cohorts.v2" as const,
    transitionId,
    authorityId: authority.authority.authorityId,
    operationId: "kp.arithmetic.add" as const,
    cohorts
  } satisfies KpAntiderivativePowerEvaluationCohortsPayloadV2);
  const presentation = compileKpEquationPresentationPlanV2({
    grammar: migration.grammar,
    domainPayloads: [payload]
  });
  if (presentation.status !== "compiled") {
    throw new Error(presentation.diagnostics.map(({ message }) => message)
      .join("\n"));
  }
  return Object.freeze({
    ...migration,
    presentationPlan: presentation.plan
  });
}

export function isKpAntiderivativePowerEvaluationCohortsPayloadV2(
  value: KpEquationPresentationDomainPayloadV2
): value is KpAntiderivativePowerEvaluationCohortsPayloadV2 {
  if (value.kind !==
      "equation-domain.antiderivative-power-evaluation-cohorts.v2") {
    return false;
  }
  const candidate = value as KpAntiderivativePowerEvaluationCohortsPayloadV2;
  return candidate.operationId === "kp.arithmetic.add" &&
    candidate.cohorts.length === 2 &&
    candidate.cohorts.every((cohort, index) =>
      cohort.cohortId === kpAntiderivativePowerEvaluationCohortIds[index] &&
      isKpVerifiedEquationEvaluationFamilyCertificateV2(
        cohort.certificate
      )
    );
}

function requiredTransformation(
  animation: KpAnimationAsset,
  transformType: string
): KpSemanticTransformation {
  const matches = animation.transformations.filter(
    (transformation) => transformation.transformType === transformType
  );
  if (matches.length !== 1) {
    throw new Error(
      `${animation.id} requires one ${transformType} transformation.`
    );
  }
  return matches[0]!;
}
