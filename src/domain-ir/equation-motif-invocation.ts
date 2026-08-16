import type {
  KpFamilyId,
  KpMotifId,
  KpOperationKind,
  KpRendererCapabilityId
} from "./equation-motion-vocabulary.ts";

export type KpMotifRoleCardinality =
  | "exactly-one"
  | "one-or-more"
  | "zero-or-more";

export type KpMotifMaterialKind =
  | "continuant"
  | "syntax"
  | "enclosure"
  | "connector"
  | "material";

export interface KpMotifRoleSchema<RoleId extends string = string> {
  readonly id: RoleId;
  readonly cardinality: KpMotifRoleCardinality;
  readonly materialKind: KpMotifMaterialKind;
}

export interface KpMotifSchema<
  Roles extends readonly KpMotifRoleSchema[] =
    readonly KpMotifRoleSchema[]
> {
  readonly schemaVersion: "kp.equation-motif-schema.v1";
  readonly kind: "equation-motif-schema";
  readonly id: KpMotifId;
  readonly familyId: KpFamilyId;
  readonly operationKinds: readonly KpOperationKind[];
  readonly roles: Roles;
  readonly requiredRendererCapabilityIds:
    readonly KpRendererCapabilityId[];
}

export interface KpMotifEntityBinding {
  readonly entityId: string;
  readonly semanticObjectId: string;
}

type KpBindingForRole<Role extends KpMotifRoleSchema> =
  Role["cardinality"] extends "exactly-one"
    ? readonly [KpMotifEntityBinding]
    : Role["cardinality"] extends "one-or-more"
      ? readonly [KpMotifEntityBinding, ...KpMotifEntityBinding[]]
      : readonly KpMotifEntityBinding[];

export type KpMotifRoleBindings<
  Roles extends readonly KpMotifRoleSchema[]
> = {
  readonly [Role in Roles[number] as Role["id"]]: KpBindingForRole<Role>;
};

export interface KpMotifInvocation {
  readonly schemaVersion: "kp.equation-motif-invocation.v1";
  readonly kind: "equation-motif-invocation";
  readonly id: string;
  readonly motifId: KpMotifId;
  readonly operationKind: KpOperationKind;
  readonly roleBindings:
    Readonly<Record<string, readonly KpMotifEntityBinding[]>>;
}

export type KpTypedMotifInvocation<
  Schema extends KpMotifSchema
> = Omit<KpMotifInvocation, "motifId" | "operationKind" | "roleBindings"> & {
  readonly motifId: Schema["id"];
  readonly operationKind: Schema["operationKinds"][number];
  readonly roleBindings: KpMotifRoleBindings<Schema["roles"]>;
};

export type KpMotifInvocationDiagnosticCode =
  | "motif.invocation.id"
  | "motif.invocation.motif-mismatch"
  | "motif.invocation.unsupported-operation"
  | "motif.invocation.missing-role"
  | "motif.invocation.unknown-role"
  | "motif.invocation.cardinality"
  | "motif.invocation.binding"
  | "motif.invocation.duplicate-owner"
  | "motif.invocation.unsupported-capability";

export interface KpMotifInvocationDiagnostic {
  readonly code: KpMotifInvocationDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpCompiledMotifRoleBinding {
  readonly roleId: string;
  readonly materialKind: KpMotifMaterialKind;
  readonly entities: readonly KpMotifEntityBinding[];
}

declare const kpCompiledMotifPlanAuthority: unique symbol;

export type KpCompiledMotifPlan = Readonly<{
  schemaVersion: "kp.compiled-equation-motif-plan.v1";
  kind: "compiled-equation-motif-plan";
  id: string;
  invocationId: string;
  motifId: KpMotifId;
  familyId: KpFamilyId;
  operationKind: KpOperationKind;
  roleBindings: readonly KpCompiledMotifRoleBinding[];
  requiredRendererCapabilityIds: readonly KpRendererCapabilityId[];
  rendererNeutral: true;
  [kpCompiledMotifPlanAuthority]: true;
}>;

export type KpMotifInvocationCompilationResult =
  | {
      readonly status: "compiled";
      readonly plan: KpCompiledMotifPlan;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "invalid";
      readonly diagnostics: readonly KpMotifInvocationDiagnostic[];
    };

const compiledPlans = new WeakSet<object>();

export function defineKpMotifSchema<
  const Roles extends readonly KpMotifRoleSchema[]
>(input: {
  readonly id: KpMotifId;
  readonly familyId: KpFamilyId;
  readonly operationKinds: readonly KpOperationKind[];
  readonly roles: Roles;
  readonly requiredRendererCapabilityIds:
    readonly KpRendererCapabilityId[];
}): KpMotifSchema<Roles> {
  requireUnique(input.roles.map(({ id }) => id), "motif role");
  requireUnique(input.operationKinds, "motif operation");
  requireUnique(
    input.requiredRendererCapabilityIds,
    "motif renderer capability"
  );
  if (input.roles.length === 0) {
    throw new Error(`Motif ${input.id} requires at least one semantic role.`);
  }
  if (input.operationKinds.length === 0) {
    throw new Error(`Motif ${input.id} requires at least one operation kind.`);
  }
  return Object.freeze({
    schemaVersion: "kp.equation-motif-schema.v1" as const,
    kind: "equation-motif-schema" as const,
    id: input.id,
    familyId: input.familyId,
    operationKinds: Object.freeze([...input.operationKinds]),
    roles: Object.freeze(
      input.roles.map((role) => Object.freeze({ ...role }))
    ) as unknown as Roles,
    requiredRendererCapabilityIds: Object.freeze([
      ...input.requiredRendererCapabilityIds
    ])
  });
}

export function createKpMotifEntityBinding(input: {
  readonly entityId: string;
  readonly semanticObjectId: string;
}): KpMotifEntityBinding {
  requireText(input.entityId, "Motif entity");
  requireText(input.semanticObjectId, "Motif semantic object");
  return Object.freeze({ ...input });
}

export function createKpMotifInvocation<
  const Schema extends KpMotifSchema
>(schema: Schema, input: {
  readonly id: string;
  readonly motifId: Schema["id"];
  readonly operationKind: Schema["operationKinds"][number];
  readonly roleBindings: KpMotifRoleBindings<Schema["roles"]>;
}): KpTypedMotifInvocation<Schema> {
  if (input.motifId !== schema.id) {
    throw new Error(
      `Motif invocation ${input.id} must target schema ${schema.id}.`
    );
  }
  const sourceBindings = input.roleBindings as Readonly<
    Record<string, readonly KpMotifEntityBinding[]>
  >;
  const roleBindings = Object.freeze(Object.fromEntries(
    schema.roles.map(({ id: roleId }) => [
      roleId,
      Object.freeze((sourceBindings[roleId] ?? []).map((binding) =>
        Object.freeze({ ...binding })
      ))
    ])
  )) as KpMotifRoleBindings<Schema["roles"]>;
  return Object.freeze({
    schemaVersion: "kp.equation-motif-invocation.v1" as const,
    kind: "equation-motif-invocation" as const,
    id: input.id,
    motifId: input.motifId,
    operationKind: input.operationKind,
    roleBindings
  }) as KpTypedMotifInvocation<Schema>;
}

export function compileKpMotifInvocation(input: {
  readonly schema: KpMotifSchema;
  readonly invocation: KpMotifInvocation;
  readonly rendererCapabilityIds: readonly KpRendererCapabilityId[];
}): KpMotifInvocationCompilationResult {
  const diagnostics = validateInvocation(input);
  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "invalid" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }
  const roleBindings = input.schema.roles.map((role) => Object.freeze({
    roleId: role.id,
    materialKind: role.materialKind,
    entities: Object.freeze(
      input.invocation.roleBindings[role.id]!.map((binding) =>
        Object.freeze({ ...binding })
      )
    )
  }));
  const plan = Object.freeze({
    schemaVersion: "kp.compiled-equation-motif-plan.v1" as const,
    kind: "compiled-equation-motif-plan" as const,
    id: `compiled.${input.invocation.id}`,
    invocationId: input.invocation.id,
    motifId: input.schema.id,
    familyId: input.schema.familyId,
    operationKind: input.invocation.operationKind,
    roleBindings: Object.freeze(roleBindings),
    requiredRendererCapabilityIds: Object.freeze([
      ...input.schema.requiredRendererCapabilityIds
    ]),
    rendererNeutral: true as const
  }) as KpCompiledMotifPlan;
  compiledPlans.add(plan);
  return Object.freeze({
    status: "compiled" as const,
    plan,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpCompiledMotifPlan(
  value: unknown
): value is KpCompiledMotifPlan {
  return typeof value === "object" && value !== null && compiledPlans.has(value);
}

function validateInvocation(input: {
  readonly schema: KpMotifSchema;
  readonly invocation: KpMotifInvocation;
  readonly rendererCapabilityIds: readonly KpRendererCapabilityId[];
}): KpMotifInvocationDiagnostic[] {
  const diagnostics: KpMotifInvocationDiagnostic[] = [];
  if (input.invocation.id.trim() === "") {
    diagnostics.push(diagnostic(
      "motif.invocation.id",
      "$.id",
      "Motif invocation requires a non-empty id."
    ));
  }
  if (input.invocation.motifId !== input.schema.id) {
    diagnostics.push(diagnostic(
      "motif.invocation.motif-mismatch",
      "$.motifId",
      `Invocation motif ${input.invocation.motifId} does not match ${input.schema.id}.`
    ));
  }
  if (!input.schema.operationKinds.includes(input.invocation.operationKind)) {
    diagnostics.push(diagnostic(
      "motif.invocation.unsupported-operation",
      "$.operationKind",
      `Motif ${input.schema.id} does not support ${input.invocation.operationKind}.`
    ));
  }
  const schemaRoles = new Map(input.schema.roles.map((role) => [role.id, role]));
  for (const role of input.schema.roles) {
    const bindings = input.invocation.roleBindings[role.id];
    if (bindings === undefined) {
      diagnostics.push(diagnostic(
        "motif.invocation.missing-role",
        `$.roleBindings.${role.id}`,
        `Motif ${input.schema.id} requires role ${role.id}.`
      ));
      continue;
    }
    const validCardinality = role.cardinality === "exactly-one"
      ? bindings.length === 1
      : role.cardinality === "one-or-more"
        ? bindings.length >= 1
        : true;
    if (!validCardinality) {
      diagnostics.push(diagnostic(
        "motif.invocation.cardinality",
        `$.roleBindings.${role.id}`,
        `Role ${role.id} requires ${role.cardinality} binding cardinality.`
      ));
    }
  }
  for (const roleId of Object.keys(input.invocation.roleBindings)) {
    if (!schemaRoles.has(roleId)) {
      diagnostics.push(diagnostic(
        "motif.invocation.unknown-role",
        `$.roleBindings.${roleId}`,
        `Motif ${input.schema.id} does not declare role ${roleId}.`
      ));
    }
  }
  const ownerPaths = new Map<string, string>();
  for (const [roleId, bindings] of Object.entries(
    input.invocation.roleBindings
  )) {
    bindings.forEach((binding, index) => {
      const path = `$.roleBindings.${roleId}[${index}]`;
      if (
        binding.entityId.trim() === "" ||
        binding.semanticObjectId.trim() === ""
      ) {
        diagnostics.push(diagnostic(
          "motif.invocation.binding",
          path,
          "Motif bindings require entity and semantic object ids."
        ));
      }
      const prior = ownerPaths.get(binding.entityId);
      if (prior !== undefined) {
        diagnostics.push(diagnostic(
          "motif.invocation.duplicate-owner",
          path,
          `Entity ${binding.entityId} is already owned by ${prior}.`
        ));
      } else {
        ownerPaths.set(binding.entityId, path);
      }
    });
  }
  const availableCapabilities = new Set(input.rendererCapabilityIds);
  for (const capabilityId of input.schema.requiredRendererCapabilityIds) {
    if (!availableCapabilities.has(capabilityId)) {
      diagnostics.push(diagnostic(
        "motif.invocation.unsupported-capability",
        "$.rendererCapabilityIds",
        `Motif ${input.schema.id} requires unavailable ${capabilityId}.`
      ));
    }
  }
  return diagnostics;
}

function diagnostic(
  code: KpMotifInvocationDiagnosticCode,
  path: string,
  message: string
): KpMotifInvocationDiagnostic {
  return Object.freeze({ code, path, message });
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} requires a non-empty id.`);
}

function requireUnique(values: readonly string[], label: string): void {
  for (const value of values) requireText(value, label);
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}
