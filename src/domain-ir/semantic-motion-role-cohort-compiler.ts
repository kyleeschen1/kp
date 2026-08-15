import {
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1
} from "./semantic-motion-compiler-contract.ts";
import {
  isKpVerifiedSemanticMotionLifecycle,
  type KpVerifiedSemanticMotionLifecycle
} from "./semantic-motion-lifecycle-ownership.ts";

export type KpSemanticMotionRoleCardinality =
  | "exactly-one"
  | "zero-or-one"
  | "one-or-more"
  | "zero-or-more";

export interface KpSemanticMotionRoleSpec {
  readonly id: string;
  readonly cardinality: KpSemanticMotionRoleCardinality;
  readonly participation: "material" | "operator" | "punctuation" | "context";
  readonly attachment: "required" | "optional" | "none";
}

export interface KpSemanticMotionCohortSpec {
  readonly id: string;
  readonly memberRoleIds: readonly string[];
  readonly cohesion: {
    readonly scope: "family-local";
    readonly variantId: string;
  };
}

export interface KpSemanticMotionAttachmentSpec {
  readonly id: string;
  readonly kind:
    | "operator-argument"
    | "connector-between"
    | "punctuation-encloses"
    | "sign-term"
    | "ordered-membership";
  readonly anchorRoleIds: readonly string[];
  readonly attachedRoleIds: readonly string[];
}

export interface KpSemanticMotionOperationStructureContract {
  readonly operationId: string;
  readonly roles: readonly KpSemanticMotionRoleSpec[];
  readonly cohorts: readonly KpSemanticMotionCohortSpec[];
  readonly attachments: readonly KpSemanticMotionAttachmentSpec[];
}

export interface KpSemanticMotionResolvedCohort {
  readonly id: string;
  readonly roleIds: readonly string[];
  readonly entityIds: readonly string[];
  readonly cohesion: KpSemanticMotionCohortSpec["cohesion"];
}

export interface KpSemanticMotionResolvedAttachment {
  readonly id: string;
  readonly kind: KpSemanticMotionAttachmentSpec["kind"];
  readonly anchorEntityIds: readonly string[];
  readonly attachedEntityIds: readonly string[];
}

declare const kpSemanticMotionRoleCohortAuthority: unique symbol;

export type KpVerifiedSemanticMotionRoleCohorts = Readonly<{
  kind: "verified-semantic-motion-role-cohorts";
  requestId: string;
  operationId: string;
  lifecycle: KpVerifiedSemanticMotionLifecycle;
  roleBindings: Readonly<Record<string, readonly string[]>>;
  cohorts: readonly KpSemanticMotionResolvedCohort[];
  attachments: readonly KpSemanticMotionResolvedAttachment[];
  [kpSemanticMotionRoleCohortAuthority]: true;
}>;

export type KpSemanticMotionRoleCohortCompileResult =
  | {
      readonly status: "verified";
      readonly structure: KpVerifiedSemanticMotionRoleCohorts;
    }
  | KpSemanticMotionCompilerRepairRequiredV1;

const verifiedStructures = new WeakSet<object>();

export function compileKpSemanticMotionRoleCohorts(input: {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly lifecycle: KpVerifiedSemanticMotionLifecycle;
  readonly contract: KpSemanticMotionOperationStructureContract;
}): KpSemanticMotionRoleCohortCompileResult {
  const { request, lifecycle, contract } = input;
  if (!isKpVerifiedSemanticMotionLifecycle(lifecycle)) {
    throw new Error("Role/cohort compilation requires original lifecycle authority.");
  }
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];
  if (lifecycle.requestId !== request.id) {
    addIssue(issues, "authority-mismatch", "$", "Lifecycle authority does not belong to this request.");
  }
  if (contract.operationId !== request.operation.operationId) {
    addIssue(issues, "operation-mismatch", "$.operation.operationId", "Operation structure contract does not match the request operation.");
  }
  const roles = new Map<string, KpSemanticMotionRoleSpec>();
  contract.roles.forEach((role, index) => {
    if (roles.has(role.id)) {
      addIssue(issues, "duplicate-role", `$.contract.roles[${index}].id`, `Operation structure repeats role ${role.id}.`);
    }
    roles.set(role.id, role);
  });
  const bindingRoleIds = Object.keys(request.operation.roleBindings);
  bindingRoleIds.filter((roleId) => !roles.has(roleId)).forEach((roleId) =>
    addIssue(issues, "unknown-role", `$.operation.roleBindings.${roleId}`, `Request binds unknown operation role ${roleId}.`)
  );
  contract.roles.filter(({ id }) => !(id in request.operation.roleBindings)).forEach(({ id }) =>
    addIssue(issues, "missing-role", `$.operation.roleBindings.${id}`, `Request omits operation role ${id}.`)
  );

  const allowedEntities = new Set([
    ...lifecycle.provenance.endpointFrontier.sourceFrontierEntityIds,
    ...lifecycle.provenance.endpointFrontier.targetFrontierEntityIds,
    ...lifecycle.provenance.endpointFrontier.contextEntityIds
  ]);
  const entityRoles = new Map<string, string>();
  contract.roles.forEach((role) => {
    const entityIds = request.operation.roleBindings[role.id] ?? [];
    if (!cardinalityValid(role.cardinality, entityIds.length)) {
      addIssue(
        issues,
        "role-cardinality",
        `$.operation.roleBindings.${role.id}`,
        `Role ${role.id} requires ${role.cardinality}; received ${entityIds.length}.`
      );
    }
    if (new Set(entityIds).size !== entityIds.length) {
      addIssue(issues, "duplicate-entity", `$.operation.roleBindings.${role.id}`, `Role ${role.id} repeats a semantic entity.`);
    }
    entityIds.forEach((entityId) => {
      if (!allowedEntities.has(entityId)) {
        addIssue(issues, "foreign-entity", `$.operation.roleBindings.${role.id}`, `Role ${role.id} binds foreign entity ${entityId}.`);
      }
      const previous = entityRoles.get(entityId);
      if (previous !== undefined && previous !== role.id) {
        addIssue(issues, "ambiguous-entity", `$.operation.roleBindings.${role.id}`, `Entity ${entityId} is assigned to both ${previous} and ${role.id}.`);
      }
      entityRoles.set(entityId, role.id);
    });
  });

  const cohortIds = new Set<string>();
  const cohortRoleCounts = new Map<string, number>();
  contract.cohorts.forEach((cohort, index) => {
    const path = `$.contract.cohorts[${index}]`;
    if (cohortIds.has(cohort.id)) addIssue(issues, "duplicate-cohort", `${path}.id`, `Duplicate cohort ${cohort.id}.`);
    cohortIds.add(cohort.id);
    if (cohort.memberRoleIds.length === 0 || new Set(cohort.memberRoleIds).size !== cohort.memberRoleIds.length) {
      addIssue(issues, "cohort-membership", `${path}.memberRoleIds`, `Cohort ${cohort.id} requires unique role members.`);
    }
    if (cohort.cohesion.scope !== "family-local" || cohort.cohesion.variantId.trim().length === 0) {
      addIssue(issues, "cohesion", `${path}.cohesion`, `Cohort ${cohort.id} requires one named family-local cohesion variant.`);
    }
    cohort.memberRoleIds.forEach((roleId) => {
      const role = roles.get(roleId);
      if (role === undefined || role.participation === "context") {
        addIssue(issues, "cohort-role", `${path}.memberRoleIds`, `Cohort ${cohort.id} references missing or context role ${roleId}.`);
      }
      cohortRoleCounts.set(roleId, (cohortRoleCounts.get(roleId) ?? 0) + 1);
    });
  });
  contract.roles.filter(({ participation }) => participation !== "context").forEach(({ id }) => {
    const count = cohortRoleCounts.get(id) ?? 0;
    if (count !== 1) {
      addIssue(issues, "cohort-closure", "$.contract.cohorts", `Non-context role ${id} must belong to exactly one semantic cohort; received ${count}.`);
    }
  });

  const attachmentIds = new Set<string>();
  const attachedRoleIds = new Set<string>();
  contract.attachments.forEach((attachment, index) => {
    const path = `$.contract.attachments[${index}]`;
    if (attachmentIds.has(attachment.id)) addIssue(issues, "duplicate-attachment", `${path}.id`, `Duplicate attachment ${attachment.id}.`);
    attachmentIds.add(attachment.id);
    if (attachment.anchorRoleIds.length === 0 || attachment.attachedRoleIds.length === 0) {
      addIssue(issues, "attachment-closure", path, `Attachment ${attachment.id} requires anchors and attached roles.`);
    }
    [...attachment.anchorRoleIds, ...attachment.attachedRoleIds].forEach((roleId) => {
      if (!roles.has(roleId)) addIssue(issues, "attachment-role", path, `Attachment ${attachment.id} references unknown role ${roleId}.`);
    });
    attachment.attachedRoleIds.forEach((roleId) => {
      if (attachment.anchorRoleIds.includes(roleId)) {
        addIssue(issues, "attachment-closure", path, `Attachment ${attachment.id} cannot attach role ${roleId} to itself.`);
      }
      attachedRoleIds.add(roleId);
    });
  });
  contract.roles.filter(({ attachment }) => attachment === "required").forEach(({ id }) => {
    if (!attachedRoleIds.has(id)) {
      addIssue(issues, "attachment-closure", "$.contract.attachments", `Required attachment role ${id} is unattached.`);
    }
  });

  if (issues.length > 0) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues,
      repairTargets: [{ kind: "operation-binding", targetId: request.operation.stepId }]
    });
  }
  const roleBindings = Object.freeze(Object.fromEntries(
    contract.roles.map(({ id }) => [id, Object.freeze([...(request.operation.roleBindings[id] ?? [])])])
  ));
  const structure = Object.freeze({
    kind: "verified-semantic-motion-role-cohorts" as const,
    requestId: request.id,
    operationId: request.operation.operationId,
    lifecycle,
    roleBindings,
    cohorts: Object.freeze(contract.cohorts.map((cohort) => Object.freeze({
      id: cohort.id,
      roleIds: Object.freeze([...cohort.memberRoleIds]),
      entityIds: Object.freeze(cohort.memberRoleIds.flatMap((roleId) => roleBindings[roleId] ?? [])),
      cohesion: Object.freeze({ ...cohort.cohesion })
    }))),
    attachments: Object.freeze(contract.attachments.map((attachment) => Object.freeze({
      id: attachment.id,
      kind: attachment.kind,
      anchorEntityIds: Object.freeze(attachment.anchorRoleIds.flatMap((roleId) => roleBindings[roleId] ?? [])),
      attachedEntityIds: Object.freeze(attachment.attachedRoleIds.flatMap((roleId) => roleBindings[roleId] ?? []))
    })))
  }) as KpVerifiedSemanticMotionRoleCohorts;
  verifiedStructures.add(structure);
  return { status: "verified", structure };
}

export function isKpVerifiedSemanticMotionRoleCohorts(
  value: unknown
): value is KpVerifiedSemanticMotionRoleCohorts {
  return typeof value === "object" && value !== null && verifiedStructures.has(value);
}

function cardinalityValid(cardinality: KpSemanticMotionRoleCardinality, count: number): boolean {
  switch (cardinality) {
    case "exactly-one": return count === 1;
    case "zero-or-one": return count <= 1;
    case "one-or-more": return count >= 1;
    case "zero-or-more": return true;
  }
}

function addIssue(
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][],
  suffix:
    | "authority-mismatch"
    | "operation-mismatch"
    | "duplicate-role"
    | "unknown-role"
    | "missing-role"
    | "role-cardinality"
    | "duplicate-entity"
    | "foreign-entity"
    | "ambiguous-entity"
    | "duplicate-cohort"
    | "cohort-membership"
    | "cohesion"
    | "cohort-role"
    | "cohort-closure"
    | "duplicate-attachment"
    | "attachment-closure"
    | "attachment-role",
  path: string,
  message: string
): void {
  issues.push({ code: `semantic-motion.structure.${suffix}`, path, message });
}
