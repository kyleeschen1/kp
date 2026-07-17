import type { SelectorCorrespondenceRelationId } from "./correspondence.ts";
import type { KpCanonicalOperationRole } from "./canonical-operation.ts";

export type KpCanonicalOperationOwnershipMode =
  | "continuant"
  | "replacement"
  | "persistent-source-copying"
  | "fission-fusion";

export interface KpCanonicalOperationContract {
  readonly kind: "canonical-operation-contract";
  readonly schemaVersion: "kp.canonical-operation-contract.v1";
  readonly authority: {
    readonly kind: "core-descriptor" | "transformation-definition" | "operation-spec";
    readonly refId: string;
  };
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly lineageRelationIds: readonly SelectorCorrespondenceRelationId[];
  readonly ownershipMode: KpCanonicalOperationOwnershipMode;
  readonly lawIds: readonly string[];
  readonly witnessIds: readonly string[];
  readonly reverse: {
    readonly kind: "self" | "inverse" | "one-way";
    readonly operationId?: string | undefined;
  };
  readonly motifRequirementIds: readonly string[];
  readonly pacing: {
    readonly kind: "single" | "per-descendant" | "per-index" | "per-cell";
    readonly unitRoleId?: string | undefined;
  };
  readonly cost: {
    readonly tokenRoleIds: readonly string[];
    readonly simultaneousGroupRoleIds: readonly string[];
    readonly fragmentRoleIds: readonly string[];
    readonly shadowPolicy: "none" | "optional" | "required";
    readonly threeDPolicy: "none" | "optional";
  };
  readonly fixtureIds: readonly string[];
}

export function createKpCanonicalOperationContract(
  input: Omit<KpCanonicalOperationContract, "kind" | "schemaVersion">
): KpCanonicalOperationContract {
  const contract: KpCanonicalOperationContract = {
    ...input,
    kind: "canonical-operation-contract",
    schemaVersion: "kp.canonical-operation-contract.v1",
    authority: { ...input.authority },
    roles: input.roles.map((role) => ({ ...role })),
    lineageRelationIds: [...input.lineageRelationIds],
    lawIds: [...input.lawIds],
    witnessIds: [...input.witnessIds],
    reverse: { ...input.reverse },
    motifRequirementIds: [...input.motifRequirementIds],
    pacing: { ...input.pacing },
    cost: {
      ...input.cost,
      tokenRoleIds: [...input.cost.tokenRoleIds],
      simultaneousGroupRoleIds: [...input.cost.simultaneousGroupRoleIds],
      fragmentRoleIds: [...input.cost.fragmentRoleIds]
    },
    fixtureIds: [...input.fixtureIds]
  };
  const issues = validateKpCanonicalOperationContract(contract);
  if (issues.length > 0) throw new Error(issues.join("\n"));
  return contract;
}

export function validateKpCanonicalOperationContract(
  contract: KpCanonicalOperationContract
): readonly string[] {
  const issues: string[] = [];
  const roleIds = new Set<string>();
  contract.roles.forEach((role) => {
    if (roleIds.has(role.id)) issues.push(`Duplicate operation role ${role.id}.`);
    roleIds.add(role.id);
  });
  requireValues(contract.authority.refId, "authority.refId", issues);
  requireList(contract.roles, "roles", issues);
  requireList(contract.lineageRelationIds, "lineageRelationIds", issues);
  requireList(contract.lawIds, "lawIds", issues);
  requireList(contract.motifRequirementIds, "motifRequirementIds", issues);
  requireList(contract.fixtureIds, "fixtureIds", issues);
  roleRefs(contract.cost.tokenRoleIds, "cost.tokenRoleIds", roleIds, issues);
  roleRefs(
    contract.cost.simultaneousGroupRoleIds,
    "cost.simultaneousGroupRoleIds",
    roleIds,
    issues
  );
  roleRefs(contract.cost.fragmentRoleIds, "cost.fragmentRoleIds", roleIds, issues);
  if (
    contract.pacing.kind !== "single" &&
    contract.pacing.unitRoleId === undefined
  ) issues.push(`${contract.pacing.kind} pacing requires pacing.unitRoleId.`);
  if (
    contract.pacing.unitRoleId !== undefined &&
    !roleIds.has(contract.pacing.unitRoleId)
  ) issues.push(`Unknown pacing role ${contract.pacing.unitRoleId}.`);
  if (
    contract.reverse.kind !== "one-way" &&
    contract.reverse.operationId === undefined
  ) issues.push(`${contract.reverse.kind} reverse meaning requires an operationId.`);
  if (
    contract.reverse.kind === "one-way" &&
    contract.reverse.operationId !== undefined
  ) issues.push("One-way reverse meaning cannot name an operationId.");
  return issues;
}

function roleRefs(
  refs: readonly string[],
  path: string,
  roleIds: ReadonlySet<string>,
  issues: string[]
): void {
  refs.forEach((roleId) => {
    if (!roleIds.has(roleId)) issues.push(`${path} references unknown role ${roleId}.`);
  });
}

function requireList(
  values: readonly unknown[],
  path: string,
  issues: string[]
): void {
  if (values.length === 0) issues.push(`${path} must not be empty.`);
}

function requireValues(value: string, path: string, issues: string[]): void {
  if (value.trim().length === 0) issues.push(`${path} must not be empty.`);
}
