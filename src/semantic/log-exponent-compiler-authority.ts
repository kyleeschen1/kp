import {
  listKpLogExponentExpressionNodes,
  listKpLogExponentBranchNodeIds,
  type KpLogExponentSolveState,
  type KpLogExponentSolveStateId
} from "./log-exponent-solve-states.ts";

export type KpLogExponentSemanticRole =
  | "equality"
  | "base"
  | "unknown-x"
  | "right-value"
  | "power"
  | "logged-power-value"
  | "log-base-value"
  | "log-right-value"
  | "log-left-operator"
  | "log-right-operator"
  | "log-left-open-delimiter"
  | "log-left-close-delimiter"
  | "extracted-product"
  | "solved-quotient";

export interface KpLogExponentRoleBinding {
  readonly role: KpLogExponentSemanticRole;
  readonly semanticId: string;
  readonly occurrenceIds: readonly string[];
}

declare const kpLogExponentCompilerAuthority: unique symbol;
const compiledRoleAuthorities = new WeakSet<object>();

export interface KpCompiledLogExponentStateRoles {
  readonly schemaVersion: "kp.compiled-log-exponent-state-roles.v1";
  readonly stateId: KpLogExponentSolveStateId;
  readonly bindings: readonly KpLogExponentRoleBinding[];
  readonly branchByOccurrenceId: Readonly<Record<string, "lhs" | "rhs">>;
  readonly [kpLogExponentCompilerAuthority]: true;
}

const rolesBySemanticId = Object.freeze({
  "semantic.equality": "equality",
  "semantic.base.two": "base",
  "semantic.unknown.x": "unknown-x",
  "semantic.value.seven": "right-value",
  "semantic.power.two-to-x": "power",
  "semantic.expression.log-two-power-x": "logged-power-value",
  "semantic.value.log-two": "log-base-value",
  "semantic.value.log-seven": "log-right-value",
  "semantic.operator.ln.left-lineage": "log-left-operator",
  "semantic.operator.ln.right-lineage": "log-right-operator",
  "semantic.shell.log-left.open": "log-left-open-delimiter",
  "semantic.shell.log-left.close": "log-left-close-delimiter",
  "semantic.product.x-log-two": "extracted-product",
  "semantic.quotient.log-seven-log-two": "solved-quotient"
} as const satisfies Readonly<Record<string, KpLogExponentSemanticRole>>);

/**
 * This compiler is the only nominal authority for executable role bindings.
 * Authored state shapes and serialized copies remain inspectable but untrusted.
 */
export function compileKpLogExponentStateRoles(
  state: KpLogExponentSolveState
): KpCompiledLogExponentStateRoles {
  const occurrences = new Map<string, string[]>();
  for (const node of listKpLogExponentExpressionNodes(state)) {
    if (!(node.semanticId in rolesBySemanticId)) {
      throw new Error(
        `Log-exponent state ${state.id} contains unregistered semantic identity ${node.semanticId}.`
      );
    }
    const ids = occurrences.get(node.semanticId) ?? [];
    ids.push(node.id);
    occurrences.set(node.semanticId, ids);
  }
  const bindings = Object.freeze(
    [...occurrences.entries()].map(([semanticId, occurrenceIds]) =>
      Object.freeze({
        role: rolesBySemanticId[semanticId as keyof typeof rolesBySemanticId],
        semanticId,
        occurrenceIds: Object.freeze([...occurrenceIds])
      })
    )
  );
  const lhsIds = listKpLogExponentBranchNodeIds(state, "lhs");
  const rhsIds = listKpLogExponentBranchNodeIds(state, "rhs");
  const rhsIdSet = new Set(rhsIds);
  const branchByOccurrenceId = Object.freeze(Object.fromEntries([
    ...lhsIds.map((id) => [id, "lhs"] as const),
    ...rhsIds.map((id) => [id, "rhs"] as const)
  ]));
  if (lhsIds.some((id) => rhsIdSet.has(id))) {
    throw new Error(
      `Log-exponent state ${state.id} reuses an occurrence across equation branches.`
    );
  }
  const compiled = Object.freeze({
    schemaVersion: "kp.compiled-log-exponent-state-roles.v1" as const,
    stateId: state.id,
    bindings,
    branchByOccurrenceId
  }) as KpCompiledLogExponentStateRoles;
  compiledRoleAuthorities.add(compiled);
  return compiled;
}

export function isKpCompiledLogExponentStateRoles(
  value: unknown
): value is KpCompiledLogExponentStateRoles {
  return typeof value === "object" && value !== null &&
    compiledRoleAuthorities.has(value);
}

export function findKpLogExponentRoleBinding(
  compiled: KpCompiledLogExponentStateRoles,
  role: KpLogExponentSemanticRole
): KpLogExponentRoleBinding | undefined {
  if (!isKpCompiledLogExponentStateRoles(compiled)) {
    throw new Error("Log-exponent role lookup requires nominal compiler authority.");
  }
  return compiled.bindings.find((binding) => binding.role === role);
}
