import {
  listKpStructuredExpressionSubtrees,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

export type KpStructuredExpressionEndpoint = "source" | "target";

export type KpStructuredExpressionRoleCardinality =
  | "exactly-one"
  | "zero-or-one"
  | "one-or-more";

export interface KpStructuredExpressionRoleSpec {
  readonly id: string;
  readonly endpoint: KpStructuredExpressionEndpoint;
  readonly cardinality: KpStructuredExpressionRoleCardinality;
  readonly allowedKinds: readonly KpStructuredExpressionNode["kind"][];
  readonly summary: string;
}

export type KpStructuredExpressionRoleBindings = Readonly<
  Record<string, string | readonly string[]>
>;

export interface KpBoundStructuredExpressionRole {
  readonly roleId: string;
  readonly endpoint: KpStructuredExpressionEndpoint;
  readonly subtreeIds: readonly string[];
}

export interface KpStructuredExpressionRoleBindingSet {
  readonly schemaVersion: "kp.structured-expression-role-binding.v1";
  readonly contractId: string;
  readonly expressions: Readonly<
    Partial<Record<KpStructuredExpressionEndpoint, KpStructuredExpression>>
  >;
  readonly roles: readonly KpStructuredExpressionRoleSpec[];
  readonly bindings: Readonly<Record<string, KpBoundStructuredExpressionRole>>;
}

export function bindKpStructuredExpressionRoles(input: {
  readonly contractId: string;
  readonly expressions: Readonly<
    Partial<Record<KpStructuredExpressionEndpoint, KpStructuredExpression>>
  >;
  readonly roles: readonly KpStructuredExpressionRoleSpec[];
  readonly bindings: KpStructuredExpressionRoleBindings;
}): KpStructuredExpressionRoleBindingSet {
  requireText(input.contractId, "Structured expression role contract id");
  const roles = cloneAndValidateRoles(input.roles);
  const roleIds = new Set(roles.map((role) => role.id));
  Object.keys(input.bindings).forEach((roleId) => {
    if (!roleIds.has(roleId)) {
      throw new Error(`Role contract ${input.contractId} binds unknown role ${roleId}.`);
    }
  });

  const subtreeIndexes = new Map<KpStructuredExpressionEndpoint, ReadonlyMap<string, KpStructuredExpressionNode>>();
  const bindings = Object.fromEntries(roles.map((role) => {
    const expression = input.expressions[role.endpoint];
    if (expression === undefined) {
      throw new Error(
        `Role contract ${input.contractId} requires a ${role.endpoint} expression for role ${role.id}.`
      );
    }
    let subtreeIndex = subtreeIndexes.get(role.endpoint);
    if (subtreeIndex === undefined) {
      subtreeIndex = new Map(
        listKpStructuredExpressionSubtrees(expression).map((node) => [node.id, node])
      );
      subtreeIndexes.set(role.endpoint, subtreeIndex);
    }
    const raw = input.bindings[role.id];
    const subtreeIds = raw === undefined ? [] : typeof raw === "string" ? [raw] : [...raw];
    validateCardinality(input.contractId, role, subtreeIds.length);
    if (new Set(subtreeIds).size !== subtreeIds.length) {
      throw new Error(`Role contract ${input.contractId} role ${role.id} repeats a subtree id.`);
    }
    subtreeIds.forEach((subtreeId) => {
      requireText(subtreeId, `Role contract ${input.contractId} role ${role.id} subtree id`);
      const subtree = subtreeIndex.get(subtreeId);
      if (subtree === undefined) {
        throw new Error(
          `Role contract ${input.contractId} role ${role.id} references missing ${role.endpoint} subtree ${subtreeId}.`
        );
      }
      if (!role.allowedKinds.includes(subtree.kind)) {
        throw new Error(
          `Role contract ${input.contractId} role ${role.id} requires ${role.allowedKinds.join(" or ")}; ` +
          `subtree ${subtreeId} is ${subtree.kind}.`
        );
      }
    });
    return [role.id, Object.freeze({
      roleId: role.id,
      endpoint: role.endpoint,
      subtreeIds: Object.freeze(subtreeIds)
    })];
  }));

  // Binding retains semantic IDs only; renderers remain responsible for mapping
  // those identities to selectors, geometry, timing, and visible treatment.
  return Object.freeze({
    schemaVersion: "kp.structured-expression-role-binding.v1" as const,
    contractId: input.contractId,
    expressions: Object.freeze({ ...input.expressions }),
    roles: Object.freeze(roles),
    bindings: Object.freeze(bindings)
  });
}

export function resolveKpStructuredExpressionRole(
  bindingSet: KpStructuredExpressionRoleBindingSet,
  roleId: string
): readonly KpStructuredExpressionNode[] {
  const binding = bindingSet.bindings[roleId];
  if (binding === undefined) return Object.freeze([]);
  const expression = bindingSet.expressions[binding.endpoint];
  if (expression === undefined) return Object.freeze([]);
  const index = new Map(
    listKpStructuredExpressionSubtrees(expression).map((node) => [node.id, node])
  );
  return Object.freeze(binding.subtreeIds.map((subtreeId) => index.get(subtreeId)!));
}

function cloneAndValidateRoles(
  roles: readonly KpStructuredExpressionRoleSpec[]
): KpStructuredExpressionRoleSpec[] {
  const ids = new Set<string>();
  return roles.map((role, index) => {
    requireText(role.id, `Structured expression role ${index} id`);
    requireText(role.summary, `Structured expression role ${role.id} summary`);
    if (ids.has(role.id)) throw new Error(`Structured expression role contract repeats role ${role.id}.`);
    ids.add(role.id);
    if (role.allowedKinds.length === 0) {
      throw new Error(`Structured expression role ${role.id} must allow at least one node kind.`);
    }
    if (new Set(role.allowedKinds).size !== role.allowedKinds.length) {
      throw new Error(`Structured expression role ${role.id} repeats an allowed node kind.`);
    }
    return Object.freeze({
      ...role,
      allowedKinds: Object.freeze([...role.allowedKinds])
    });
  });
}

function validateCardinality(
  contractId: string,
  role: KpStructuredExpressionRoleSpec,
  count: number
): void {
  const valid = role.cardinality === "exactly-one"
    ? count === 1
    : role.cardinality === "zero-or-one"
      ? count <= 1
      : count >= 1;
  if (!valid) {
    throw new Error(
      `Role contract ${contractId} role ${role.id} requires ${role.cardinality}; received ${count}.`
    );
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
