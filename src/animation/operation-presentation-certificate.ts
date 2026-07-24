import type {
  KpChoreographyActivityKind,
  KpChoreographyEnvelopePhaseId
} from "./choreography-plan.ts";

export const kpOperationPresentationMaterialRoleIds = [
  "focal-operand",
  "continuant",
  "introduced",
  "eliminated",
  "copied",
  "merged",
  "structural"
] as const;

export type KpOperationPresentationMaterialRoleId =
  (typeof kpOperationPresentationMaterialRoleIds)[number];

export interface KpOperationPresentationAuthorityOperation {
  readonly id: string;
  readonly semanticRank: number;
  readonly canonicalOperationId: string;
}

export interface KpOperationPresentationMaterial {
  readonly entityId: string;
  readonly semanticRoleId: string;
  readonly presentationRole: KpOperationPresentationMaterialRoleId;
}

export interface KpOperationPresentationPhase {
  readonly id: string;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly activityKind: KpChoreographyActivityKind;
  readonly materialEntityIds: readonly string[];
}

export interface KpOperationPresentationSpan {
  readonly id: string;
  readonly presentation: "atomic" | "compound";
  readonly representedOperationIds: readonly string[];
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly motifId: string;
  readonly phases: readonly KpOperationPresentationPhase[];
}

export interface KpOperationPresentationCertificate {
  readonly kind: "kp-operation-presentation-certificate";
  readonly schemaVersion: "kp.operation-presentation-certificate.v1";
  readonly id: string;
  readonly authorityRefId: string;
  readonly timelineRefId: string;
  readonly authorityOperations:
    readonly KpOperationPresentationAuthorityOperation[];
  readonly materials: readonly KpOperationPresentationMaterial[];
  readonly spans: readonly KpOperationPresentationSpan[];
}

export interface KpOperationPresentationCertificateIssue {
  readonly path: string;
  readonly message: string;
}

export interface KpOperationPresentationCoverageIssue {
  readonly code:
    | "operation-coverage.authority-order"
    | "operation-coverage.missing"
    | "operation-coverage.duplicate"
    | "operation-coverage.presentation-order"
    | "operation-coverage.noncontiguous-compound";
  readonly operationIds: readonly string[];
  readonly message: string;
}

export interface KpOperationPresentationMaterialIssue {
  readonly code:
    | "material-role.unused"
    | "material-role.focal-not-acted"
    | "material-role.continuant-acted"
    | "material-role.continuant-not-reflowed"
    | "material-role.operation-result-not-acted"
    | "material-role.structural-acted";
  readonly entityId: string;
  readonly message: string;
}

export function createKpOperationPresentationCertificate(
  input: Omit<
    KpOperationPresentationCertificate,
    "kind" | "schemaVersion"
  >
): KpOperationPresentationCertificate {
  const certificate: KpOperationPresentationCertificate = {
    kind: "kp-operation-presentation-certificate",
    schemaVersion: "kp.operation-presentation-certificate.v1",
    id: input.id,
    authorityRefId: input.authorityRefId,
    timelineRefId: input.timelineRefId,
    authorityOperations: input.authorityOperations.map((operation) => ({
      ...operation
    })),
    materials: input.materials.map((material) => ({ ...material })),
    spans: input.spans.map((span) => ({
      ...span,
      representedOperationIds: [...span.representedOperationIds],
      phases: span.phases.map((phase) => ({
        ...phase,
        materialEntityIds: [...phase.materialEntityIds]
      }))
    }))
  };
  const issues = validateKpOperationPresentationCertificate(certificate);
  if (issues.length > 0) {
    throw new Error(
      issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")
    );
  }
  return certificate;
}

export function validateKpOperationPresentationCertificate(
  certificate: KpOperationPresentationCertificate
): readonly KpOperationPresentationCertificateIssue[] {
  const issues: KpOperationPresentationCertificateIssue[] = [];
  requireText(certificate.id, "id", issues);
  requireText(certificate.authorityRefId, "authorityRefId", issues);
  requireText(certificate.timelineRefId, "timelineRefId", issues);
  requireNonEmpty(certificate.authorityOperations, "authorityOperations", issues);
  requireNonEmpty(certificate.materials, "materials", issues);
  requireNonEmpty(certificate.spans, "spans", issues);

  const operationIds = collectUniqueIds(
    certificate.authorityOperations.map((operation) => operation.id),
    "authorityOperations",
    issues
  );
  certificate.authorityOperations.forEach((operation, index) => {
    requireText(
      operation.canonicalOperationId,
      `authorityOperations[${index}].canonicalOperationId`,
      issues
    );
    if (!Number.isInteger(operation.semanticRank) ||
        operation.semanticRank < 0) {
      issues.push({
        path: `authorityOperations[${index}].semanticRank`,
        message: "Semantic rank must be a non-negative integer."
      });
    }
  });

  const materialIds = collectUniqueIds(
    certificate.materials.map((material) => material.entityId),
    "materials",
    issues
  );
  certificate.materials.forEach((material, index) => {
    requireText(
      material.semanticRoleId,
      `materials[${index}].semanticRoleId`,
      issues
    );
  });

  collectUniqueIds(
    certificate.spans.map((span) => span.id),
    "spans",
    issues
  );
  certificate.spans.forEach((span, spanIndex) => {
    const path = `spans[${spanIndex}]`;
    requireText(span.sourceStateId, `${path}.sourceStateId`, issues);
    requireText(span.targetStateId, `${path}.targetStateId`, issues);
    requireText(span.motifId, `${path}.motifId`, issues);
    requireNonEmpty(
      span.representedOperationIds,
      `${path}.representedOperationIds`,
      issues
    );
    span.representedOperationIds.forEach((operationId, operationIndex) => {
      if (!operationIds.has(operationId)) {
        issues.push({
          path: `${path}.representedOperationIds[${operationIndex}]`,
          message: `Unknown authority operation ${operationId}.`
        });
      }
    });
    if (span.presentation === "atomic" &&
        span.representedOperationIds.length !== 1) {
      issues.push({
        path: `${path}.representedOperationIds`,
        message: "An atomic span must represent exactly one operation."
      });
    }
    requireNonEmpty(span.phases, `${path}.phases`, issues);
    collectUniqueIds(
      span.phases.map((phase) => phase.id),
      `${path}.phases`,
      issues
    );
    span.phases.forEach((phase, phaseIndex) => {
      phase.materialEntityIds.forEach((entityId, entityIndex) => {
        if (!materialIds.has(entityId)) {
          issues.push({
            path:
              `${path}.phases[${phaseIndex}].materialEntityIds[${entityIndex}]`,
            message: `Unknown visible material ${entityId}.`
          });
        }
      });
    });
  });
  return issues;
}

export function evaluateKpOperationPresentationCoverage(
  certificate: KpOperationPresentationCertificate
): readonly KpOperationPresentationCoverageIssue[] {
  const issues: KpOperationPresentationCoverageIssue[] = [];
  const authorityOperations = [...certificate.authorityOperations].sort(
    (left, right) => left.semanticRank - right.semanticRank
  );
  const authorityIds = authorityOperations.map((operation) => operation.id);
  if (!sameIds(
    certificate.authorityOperations.map((operation) => operation.id),
    authorityIds
  ) || new Set(authorityOperations.map(
    (operation) => operation.semanticRank
  )).size !== authorityOperations.length) {
    issues.push({
      code: "operation-coverage.authority-order",
      operationIds: authorityIds,
      message:
        "Authority operations must have unique ranks and be stored in semantic order."
    });
  }

  const representedIds = certificate.spans.flatMap(
    (span) => span.representedOperationIds
  );
  const representedCounts = new Map<string, number>();
  representedIds.forEach((operationId) => {
    representedCounts.set(
      operationId,
      (representedCounts.get(operationId) ?? 0) + 1
    );
  });
  const missing = authorityIds.filter(
    (operationId) => !representedCounts.has(operationId)
  );
  if (missing.length > 0) {
    issues.push({
      code: "operation-coverage.missing",
      operationIds: missing,
      message: `Missing visible operation coverage for ${missing.join(", ")}.`
    });
  }
  const duplicated = authorityIds.filter(
    (operationId) => (representedCounts.get(operationId) ?? 0) > 1
  );
  if (duplicated.length > 0) {
    issues.push({
      code: "operation-coverage.duplicate",
      operationIds: duplicated,
      message:
        `Authority operations cannot be represented more than once: ${duplicated.join(", ")}.`
    });
  }
  if (!sameIds(representedIds, authorityIds)) {
    issues.push({
      code: "operation-coverage.presentation-order",
      operationIds: representedIds,
      message:
        "Visible operation spans must preserve exact semantic dependency order."
    });
  }

  const rankById = new Map(
    authorityOperations.map(
      (operation, index) => [operation.id, index] as const
    )
  );
  certificate.spans
    .filter((span) => span.presentation === "compound")
    .forEach((span) => {
      const ranks = span.representedOperationIds.map(
        (operationId) => rankById.get(operationId)
      );
      if (ranks.some((rank) => rank === undefined) ||
          ranks.some((rank, index) =>
            index > 0 && rank !== (ranks[index - 1] ?? Infinity) + 1
          )) {
        issues.push({
          code: "operation-coverage.noncontiguous-compound",
          operationIds: span.representedOperationIds,
          message:
            `Compound span ${span.id} must cover one contiguous operation interval.`
        });
      }
    });
  return issues;
}

export function evaluateKpOperationPresentationMaterialRoles(
  certificate: KpOperationPresentationCertificate
): readonly KpOperationPresentationMaterialIssue[] {
  const issues: KpOperationPresentationMaterialIssue[] = [];
  const phases = certificate.spans.flatMap((span) => span.phases);
  certificate.materials.forEach((material) => {
    const participating = phases.filter(
      (phase) => phase.materialEntityIds.includes(material.entityId)
    );
    const executes = participating.some(
      (phase) => phase.activityKind === "execute-operation"
    );
    const reflows = participating.some(
      (phase) =>
        phase.activityKind === "reserve-space" ||
        phase.activityKind === "move-continuant"
    );
    if (participating.length === 0) {
      issues.push({
        code: "material-role.unused",
        entityId: material.entityId,
        message:
          `Visible material ${material.entityId} has no presentation participation.`
      });
      return;
    }
    if (material.presentationRole === "focal-operand" && !executes) {
      issues.push({
        code: "material-role.focal-not-acted",
        entityId: material.entityId,
        message:
          `Focal operand ${material.entityId} must participate in execute-operation.`
      });
    }
    if (material.presentationRole === "continuant") {
      if (executes) {
        issues.push({
          code: "material-role.continuant-acted",
          entityId: material.entityId,
          message:
            `Continuant ${material.entityId} cannot be animated as an operand.`
        });
      }
      if (!reflows) {
        issues.push({
          code: "material-role.continuant-not-reflowed",
          entityId: material.entityId,
          message:
            `Continuant ${material.entityId} must reserve space or reflow.`
        });
      }
    }
    if ([
      "introduced",
      "eliminated",
      "copied",
      "merged"
    ].includes(material.presentationRole) && !executes) {
      issues.push({
        code: "material-role.operation-result-not-acted",
        entityId: material.entityId,
        message:
          `${material.presentationRole} material ${material.entityId} must participate in execute-operation.`
      });
    }
    if (material.presentationRole === "structural" && executes) {
      issues.push({
        code: "material-role.structural-acted",
        entityId: material.entityId,
        message:
          `Structural material ${material.entityId} cannot execute the operation.`
      });
    }
  });
  return issues;
}

function requireText(
  value: string,
  path: string,
  issues: KpOperationPresentationCertificateIssue[]
): void {
  if (value.trim().length === 0) {
    issues.push({ path, message: "Expected non-empty text." });
  }
}

function requireNonEmpty(
  value: readonly unknown[],
  path: string,
  issues: KpOperationPresentationCertificateIssue[]
): void {
  if (value.length === 0) {
    issues.push({ path, message: "Expected at least one entry." });
  }
}

function collectUniqueIds(
  ids: readonly string[],
  path: string,
  issues: KpOperationPresentationCertificateIssue[]
): ReadonlySet<string> {
  const unique = new Set<string>();
  ids.forEach((id, index) => {
    requireText(id, `${path}[${index}].id`, issues);
    if (unique.has(id)) {
      issues.push({
        path: `${path}[${index}].id`,
        message: `Duplicate id ${id}.`
      });
    }
    unique.add(id);
  });
  return unique;
}

function sameIds(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}
