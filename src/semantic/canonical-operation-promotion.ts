import {
  validateKpCanonicalOperationSpec,
  type KpCanonicalOperationSpec
} from "./canonical-operation-spec.ts";

export type KpCanonicalOperationStatus =
  | "proposed"
  | "experimental"
  | "promoted";

export type KpCanonicalOperationPromotionEvidenceKind =
  | "positive-example"
  | "counterexample"
  | "continuity"
  | "rewind"
  | "accessibility"
  | "human-review";

export interface KpCanonicalOperationPromotionEvidence {
  readonly kind: KpCanonicalOperationPromotionEvidenceKind;
  readonly sourceRef: string;
  readonly summary: string;
}

export interface KpCanonicalOperationRegistration {
  readonly spec: KpCanonicalOperationSpec;
  readonly status: KpCanonicalOperationStatus;
  readonly evidence: readonly KpCanonicalOperationPromotionEvidence[];
}

export interface KpCanonicalOperationPromotionFailure {
  readonly path: string;
  readonly message: string;
}

export interface KpCanonicalOperationPromotionResult {
  readonly lawId: "canonical-operation.promotion";
  readonly passed: boolean;
  readonly executionAllowed: boolean;
  readonly failures: readonly KpCanonicalOperationPromotionFailure[];
}

export const kpRequiredCanonicalOperationPromotionEvidence:
  readonly KpCanonicalOperationPromotionEvidenceKind[] = [
    "positive-example",
    "counterexample",
    "continuity",
    "rewind",
    "accessibility",
    "human-review"
  ];

export function checkKpCanonicalOperationPromotion(input: {
  readonly registration: KpCanonicalOperationRegistration;
  readonly trustedPrimitiveIds: ReadonlySet<string>;
}): KpCanonicalOperationPromotionResult {
  const failures: KpCanonicalOperationPromotionFailure[] =
    validateKpCanonicalOperationSpec(input.registration.spec).map((issue) => ({
      path: `spec.${issue.path}`,
      message: issue.message
    }));
  const untrustedPrimitiveIds = [
    ...new Set(
      input.registration.spec.motif
        .map((step) => step.primitiveId)
        .filter((primitiveId) => !input.trustedPrimitiveIds.has(primitiveId))
    )
  ];

  if (input.registration.status !== "proposed") {
    untrustedPrimitiveIds.forEach((primitiveId) => {
      failures.push({
        path: "spec.motif",
        message:
          `Operation ${input.registration.spec.id} uses untrusted primitive ${primitiveId}; ` +
          "it must remain proposal-only."
      });
    });
  }

  if (input.registration.status === "promoted") {
    const evidenceKinds = new Set(input.registration.evidence.map((evidence) => evidence.kind));
    kpRequiredCanonicalOperationPromotionEvidence.forEach((kind) => {
      if (!evidenceKinds.has(kind)) {
        failures.push({
          path: "evidence",
          message: `Promoted operation ${input.registration.spec.id} is missing ${kind} evidence.`
        });
      }
    });
    input.registration.evidence.forEach((evidence, index) => {
      if (evidence.sourceRef.trim().length === 0) {
        failures.push({
          path: `evidence[${index}].sourceRef`,
          message: `Promotion evidence ${evidence.kind} must name its source.`
        });
      }
    });
  }

  const passed = failures.length === 0;
  return {
    lawId: "canonical-operation.promotion",
    passed,
    executionAllowed:
      passed &&
      input.registration.status !== "proposed" &&
      untrustedPrimitiveIds.length === 0,
    failures
  };
}

