import {
  isKpVerifiedBothSidesOperation,
  type KpBothSidesOperationKind,
  type KpVerifiedBothSidesOperation
} from "../semantic/both-sides-operation-family.ts";

declare const kpVerifiedBothSidesCausalRecipeBrand: unique symbol;

export type KpBothSidesCausalDirection = "forward" | "rewind";

export interface KpBothSidesPrepareBranchesPhase {
  readonly id: "prepare-branches";
  readonly endpoint: "source" | "target";
  readonly branches: readonly [
    { readonly side: "lhs"; readonly entityIds: readonly string[] },
    { readonly side: "rhs"; readonly entityIds: readonly string[] }
  ];
}

export interface KpBothSidesSynchronizeApplicationPhase {
  readonly id: "synchronize-application";
  readonly action: "apply" | "withdraw";
  readonly synchronization: "same-causal-beat";
  readonly applications: readonly [
    { readonly side: "lhs"; readonly entityIds: readonly string[] },
    { readonly side: "rhs"; readonly entityIds: readonly string[] }
  ];
}

export interface KpBothSidesPreserveRelationPhase {
  readonly id: "preserve-relation";
  readonly relationKind: "equality";
  readonly semanticId: string;
  readonly fromEntityId: string;
  readonly toEntityId: string;
}

export interface KpBothSidesSettleBranchesPhase {
  readonly id: "settle-branches";
  readonly endpoint: "source" | "target";
  readonly branches: readonly [
    { readonly side: "lhs"; readonly entityIds: readonly string[] },
    { readonly side: "rhs"; readonly entityIds: readonly string[] }
  ];
}

export type KpBothSidesCausalPhases = readonly [
  KpBothSidesPrepareBranchesPhase,
  KpBothSidesSynchronizeApplicationPhase,
  KpBothSidesPreserveRelationPhase,
  KpBothSidesSettleBranchesPhase
];

export interface KpBothSidesCausalRecipe {
  readonly schemaVersion: "kp.both-sides-causal-recipe.v1";
  readonly id: string;
  readonly operationId: string;
  readonly operationKind: KpBothSidesOperationKind;
  readonly lawId: string;
  readonly direction: KpBothSidesCausalDirection;
  readonly phases: KpBothSidesCausalPhases;
  readonly [kpVerifiedBothSidesCausalRecipeBrand]: true;
}

export interface KpBothSidesCausalRecipeDiagnostic {
  readonly lawId:
    | "law.both-sides.phase-order"
    | "law.both-sides.branch-synchronization"
    | "law.both-sides.relation-continuity"
    | "law.both-sides.endpoint-settlement"
    | "law.both-sides.exact-rewind";
  readonly message: string;
}

const verifiedRecipes = new WeakSet<object>();

/**
 * The recipe captures causal order only. Each caller remains responsible for
 * how those causes look and how long they take, avoiding a shared animation
 * preset disguised as semantic infrastructure.
 */
export function compileKpBothSidesCausalRecipe(input: {
  readonly operation: KpVerifiedBothSidesOperation;
  readonly direction: KpBothSidesCausalDirection;
}): KpBothSidesCausalRecipe {
  assertExactInput(input);
  if (!isKpVerifiedBothSidesOperation(input.operation)) {
    throw new Error(
      "Both-sides causal recipes require verifier-minted semantic authority."
    );
  }
  if (input.direction !== "forward" && input.direction !== "rewind") {
    throw new Error(`Unknown both-sides direction ${String(input.direction)}.`);
  }
  const forward = input.direction === "forward";
  const operation = input.operation;
  const phases = Object.freeze([
    Object.freeze({
      id: "prepare-branches" as const,
      endpoint: forward ? "source" as const : "target" as const,
      branches: branchEndpoint(operation, forward ? "source" : "target")
    }),
    Object.freeze({
      id: "synchronize-application" as const,
      action: forward ? "apply" as const : "withdraw" as const,
      synchronization: "same-causal-beat" as const,
      applications: branchApplications(operation)
    }),
    Object.freeze({
      id: "preserve-relation" as const,
      relationKind: operation.relation.kind,
      semanticId: operation.relation.semanticId,
      fromEntityId: forward
        ? operation.relation.sourceEntityId
        : operation.relation.targetEntityId,
      toEntityId: forward
        ? operation.relation.targetEntityId
        : operation.relation.sourceEntityId
    }),
    Object.freeze({
      id: "settle-branches" as const,
      endpoint: forward ? "target" as const : "source" as const,
      branches: branchEndpoint(operation, forward ? "target" : "source")
    })
  ] satisfies KpBothSidesCausalPhases);
  const recipe = Object.freeze({
    schemaVersion: "kp.both-sides-causal-recipe.v1" as const,
    id: `recipe.both-sides.${operation.id}.${input.direction}`,
    operationId: operation.id,
    operationKind: operation.operation.kind,
    lawId: operation.lawAuthority.id,
    direction: input.direction,
    phases
  }) as KpBothSidesCausalRecipe;
  const diagnostics = runKpBothSidesCausalRecipeLaws(recipe, operation);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map(({ lawId, message }) =>
      `${lawId}: ${message}`
    ).join("\n"));
  }
  verifiedRecipes.add(recipe);
  return recipe;
}

export function isKpBothSidesCausalRecipe(
  value: unknown
): value is KpBothSidesCausalRecipe {
  return typeof value === "object" && value !== null &&
    verifiedRecipes.has(value);
}

export function runKpBothSidesCausalRecipeLaws(
  recipe: KpBothSidesCausalRecipe,
  operation: KpVerifiedBothSidesOperation
): readonly KpBothSidesCausalRecipeDiagnostic[] {
  const diagnostics: KpBothSidesCausalRecipeDiagnostic[] = [];
  const expectedPhaseIds = [
    "prepare-branches",
    "synchronize-application",
    "preserve-relation",
    "settle-branches"
  ];
  if (recipe.phases.some(({ id }, index) => id !== expectedPhaseIds[index])) {
    diagnostics.push(diagnostic(
      "law.both-sides.phase-order",
      "Causal phases must retain prepare, synchronize, preserve, settle order."
    ));
  }
  const synchronization = recipe.phases[1];
  if (
    synchronization.synchronization !== "same-causal-beat" ||
    synchronization.applications[0].side !== "lhs" ||
    synchronization.applications[1].side !== "rhs" ||
    !sameSet(
      synchronization.applications[0].entityIds,
      operation.branches.lhs.appliedEntityIds
    ) ||
    !sameSet(
      synchronization.applications[1].entityIds,
      operation.branches.rhs.appliedEntityIds
    )
  ) {
    diagnostics.push(diagnostic(
      "law.both-sides.branch-synchronization",
      "One synchronized phase must own both complete branch applications."
    ));
  }
  const relation = recipe.phases[2];
  const expectedFrom = recipe.direction === "forward"
    ? operation.relation.sourceEntityId
    : operation.relation.targetEntityId;
  const expectedTo = recipe.direction === "forward"
    ? operation.relation.targetEntityId
    : operation.relation.sourceEntityId;
  if (
    relation.semanticId !== operation.relation.semanticId ||
    relation.fromEntityId !== expectedFrom ||
    relation.toEntityId !== expectedTo
  ) {
    diagnostics.push(diagnostic(
      "law.both-sides.relation-continuity",
      "The equality relation must preserve identity in the requested direction."
    ));
  }
  const expectedPrepareEndpoint = recipe.direction === "forward"
    ? "source"
    : "target";
  const expectedSettleEndpoint = recipe.direction === "forward"
    ? "target"
    : "source";
  if (
    recipe.phases[0].endpoint !== expectedPrepareEndpoint ||
    recipe.phases[3].endpoint !== expectedSettleEndpoint ||
    !matchesEndpoint(recipe.phases[0].branches, operation, expectedPrepareEndpoint) ||
    !matchesEndpoint(recipe.phases[3].branches, operation, expectedSettleEndpoint)
  ) {
    diagnostics.push(diagnostic(
      "law.both-sides.endpoint-settlement",
      "Prepare and settle must own the exact directional equation endpoints."
    ));
  }
  return Object.freeze(diagnostics);
}

export function runKpBothSidesCausalRecipeReverseLaw(input: {
  readonly forward: KpBothSidesCausalRecipe;
  readonly rewind: KpBothSidesCausalRecipe;
}): readonly KpBothSidesCausalRecipeDiagnostic[] {
  const { forward, rewind } = input;
  if (
    forward.direction !== "forward" ||
    rewind.direction !== "rewind" ||
    forward.operationId !== rewind.operationId ||
    forward.operationKind !== rewind.operationKind ||
    forward.lawId !== rewind.lawId ||
    !sameBranches(forward.phases[0].branches, rewind.phases[3].branches) ||
    !sameBranches(forward.phases[3].branches, rewind.phases[0].branches) ||
    !sameBranches(
      forward.phases[1].applications,
      rewind.phases[1].applications
    ) ||
    forward.phases[2].fromEntityId !== rewind.phases[2].toEntityId ||
    forward.phases[2].toEntityId !== rewind.phases[2].fromEntityId
  ) {
    return Object.freeze([diagnostic(
      "law.both-sides.exact-rewind",
      "Rewind must exchange endpoints while preserving operation and branch identity."
    )]);
  }
  return Object.freeze([]);
}

function branchEndpoint(
  operation: KpVerifiedBothSidesOperation,
  endpoint: "source" | "target"
): KpBothSidesPrepareBranchesPhase["branches"] {
  const key = endpoint === "source"
    ? "sourceExpressionEntityIds"
    : "targetExpressionEntityIds";
  return Object.freeze([
    Object.freeze({ side: "lhs" as const, entityIds: operation.branches.lhs[key] }),
    Object.freeze({ side: "rhs" as const, entityIds: operation.branches.rhs[key] })
  ]);
}

function branchApplications(
  operation: KpVerifiedBothSidesOperation
): KpBothSidesSynchronizeApplicationPhase["applications"] {
  return Object.freeze([
    Object.freeze({
      side: "lhs" as const,
      entityIds: operation.branches.lhs.appliedEntityIds
    }),
    Object.freeze({
      side: "rhs" as const,
      entityIds: operation.branches.rhs.appliedEntityIds
    })
  ]);
}

function matchesEndpoint(
  branches: KpBothSidesPrepareBranchesPhase["branches"],
  operation: KpVerifiedBothSidesOperation,
  endpoint: "source" | "target"
): boolean {
  const expected = branchEndpoint(operation, endpoint);
  return sameBranches(branches, expected);
}

function sameBranches(
  left: readonly { readonly side: "lhs" | "rhs"; readonly entityIds: readonly string[] }[],
  right: readonly { readonly side: "lhs" | "rhs"; readonly entityIds: readonly string[] }[]
): boolean {
  return left.length === right.length && left.every((branch, index) =>
    branch.side === right[index]?.side &&
    sameSet(branch.entityIds, right[index]?.entityIds ?? [])
  );
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const rightSet = new Set(right);
  return left.length === right.length && new Set(left).size === left.length &&
    left.every((id) => rightSet.has(id));
}

function diagnostic(
  lawId: KpBothSidesCausalRecipeDiagnostic["lawId"],
  message: string
): KpBothSidesCausalRecipeDiagnostic {
  return Object.freeze({ lawId, message });
}

function assertExactInput(value: object): void {
  const keys = Object.keys(value);
  if (
    keys.length !== 2 ||
    !keys.includes("operation") ||
    !keys.includes("direction")
  ) {
    throw new Error(
      "Both-sides causal compilation accepts only operation and direction."
    );
  }
}
