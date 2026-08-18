declare const kpVerifiedBothSidesOperationBrand: unique symbol;

/** Capability evidence names the family contract, not any caller's optics. */
export const KP_BOTH_SIDES_OPERATION_FAMILY_AUTHORITY =
  "operation.equation.apply-both-sides.v1" as const;

export type KpBothSidesOperationKind =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "apply-injective-function";

export interface KpBothSidesEqualityRelation {
  readonly kind: "equality";
  readonly semanticId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
}

export interface KpBothSidesBranchRole<Side extends "lhs" | "rhs"> {
  readonly side: Side;
  readonly sourceExpressionEntityIds: readonly [string, ...string[]];
  readonly targetExpressionEntityIds: readonly [string, ...string[]];
  readonly appliedEntityIds: readonly [string, ...string[]];
}

export interface KpBothSidesBranchRoles {
  readonly lhs: KpBothSidesBranchRole<"lhs">;
  readonly rhs: KpBothSidesBranchRole<"rhs">;
}

interface KpBothSidesOperationBase {
  readonly schemaVersion: "kp.both-sides-operation.v1";
  readonly id: string;
  readonly relation: KpBothSidesEqualityRelation;
  readonly branches: KpBothSidesBranchRoles;
}

interface KpLawAuthority<LawId extends string> {
  readonly id: LawId;
  readonly authorityRefId: string;
  readonly level: "strict";
}

interface KpUnconditionalRelationDomainEvidence {
  readonly kind: "declared-relation-domain";
  readonly evidenceIds: readonly [string, ...string[]];
}

interface KpNonzeroOperandDomainEvidence {
  readonly kind: "nonzero-operand";
  readonly operandSemanticId: string;
  readonly evidenceId: string;
}

interface KpInjectiveFunctionDomainEvidence {
  readonly kind: "injective-function-domain";
  readonly functionSemanticId: string;
  readonly lhsDomainEvidenceId: string;
  readonly rhsDomainEvidenceId: string;
  readonly injectivityEvidenceId: string;
}

interface KpBinaryBothSidesOperation<Kind extends string> {
  readonly kind: Kind;
  readonly operandSemanticId: string;
}

export type KpAddBothSidesOperationDraft = KpBothSidesOperationBase & {
  readonly operation: KpBinaryBothSidesOperation<"add">;
  readonly lawAuthority: KpLawAuthority<"law.equation.add-both-sides">;
  readonly domainEvidence: KpUnconditionalRelationDomainEvidence;
};

export type KpSubtractBothSidesOperationDraft = KpBothSidesOperationBase & {
  readonly operation: KpBinaryBothSidesOperation<"subtract">;
  readonly lawAuthority:
    KpLawAuthority<"law.equation.subtract-both-sides">;
  readonly domainEvidence: KpUnconditionalRelationDomainEvidence;
};

export type KpMultiplyBothSidesOperationDraft = KpBothSidesOperationBase & {
  readonly operation: KpBinaryBothSidesOperation<"multiply">;
  readonly lawAuthority:
    KpLawAuthority<"law.equation.multiply-both-sides">;
  readonly domainEvidence: KpNonzeroOperandDomainEvidence;
};

export type KpDivideBothSidesOperationDraft = KpBothSidesOperationBase & {
  readonly operation: KpBinaryBothSidesOperation<"divide">;
  readonly lawAuthority:
    KpLawAuthority<"law.equation.divide-both-sides">;
  readonly domainEvidence: KpNonzeroOperandDomainEvidence;
};

export type KpApplyInjectiveFunctionBothSidesOperationDraft =
KpBothSidesOperationBase & {
  readonly operation: {
    readonly kind: "apply-injective-function";
    readonly functionSemanticId: string;
    readonly lhsArgumentSemanticId: string;
    readonly rhsArgumentSemanticId: string;
  };
  readonly lawAuthority:
    KpLawAuthority<"law.equation.apply-injective-function">;
  readonly domainEvidence: KpInjectiveFunctionDomainEvidence;
};

export type KpBothSidesOperationDraft =
  | KpAddBothSidesOperationDraft
  | KpSubtractBothSidesOperationDraft
  | KpMultiplyBothSidesOperationDraft
  | KpDivideBothSidesOperationDraft
  | KpApplyInjectiveFunctionBothSidesOperationDraft;

export type KpVerifiedBothSidesOperation = KpBothSidesOperationDraft & {
  readonly [kpVerifiedBothSidesOperationBrand]: true;
};

const verifiedOperations = new WeakSet<object>();

/**
 * This boundary verifies semantic data only. Animation callbacks, timing,
 * geometry, and optics belong to later projections so mathematical authority
 * cannot be smuggled through renderer behavior.
 */
export function verifyKpBothSidesOperation(
  draft: KpBothSidesOperationDraft
): KpVerifiedBothSidesOperation {
  assertDataOnly(draft, "operation");
  assertExactKeys(draft, [
    "schemaVersion",
    "id",
    "relation",
    "branches",
    "operation",
    "lawAuthority",
    "domainEvidence"
  ], "operation");
  if (draft.schemaVersion !== "kp.both-sides-operation.v1") {
    throw new Error("Both-sides operation has an unsupported schema version.");
  }
  requireId(draft.id, "operation.id");
  validateRelation(draft.relation);
  validateBranches(draft.branches);
  validateVariant(draft);
  const verified = deepFreeze(draft) as KpVerifiedBothSidesOperation;
  verifiedOperations.add(verified);
  return verified;
}

export function isKpVerifiedBothSidesOperation(
  value: unknown
): value is KpVerifiedBothSidesOperation {
  return typeof value === "object" && value !== null &&
    verifiedOperations.has(value);
}

function validateRelation(relation: KpBothSidesEqualityRelation): void {
  assertExactKeys(relation, [
    "kind",
    "semanticId",
    "sourceEntityId",
    "targetEntityId"
  ], "operation.relation");
  if (relation.kind !== "equality") {
    throw new Error("The first both-sides family is limited to equality.");
  }
  requireId(relation.semanticId, "operation.relation.semanticId");
  requireId(relation.sourceEntityId, "operation.relation.sourceEntityId");
  requireId(relation.targetEntityId, "operation.relation.targetEntityId");
}

function validateBranches(branches: KpBothSidesBranchRoles): void {
  assertExactKeys(branches, ["lhs", "rhs"], "operation.branches");
  validateBranch(branches.lhs, "lhs");
  validateBranch(branches.rhs, "rhs");
  const lhsApplied = new Set(branches.lhs.appliedEntityIds);
  if (branches.rhs.appliedEntityIds.some((id) => lhsApplied.has(id))) {
    throw new Error(
      "Both-sides branches require distinct applied-entity occurrences."
    );
  }
}

function validateBranch<Side extends "lhs" | "rhs">(
  branch: KpBothSidesBranchRole<Side>,
  side: Side
): void {
  assertExactKeys(branch, [
    "side",
    "sourceExpressionEntityIds",
    "targetExpressionEntityIds",
    "appliedEntityIds"
  ], `operation.branches.${side}`);
  if (branch.side !== side) {
    throw new Error(`Both-sides ${side} branch has role ${branch.side}.`);
  }
  for (const [name, ids] of [
    ["sourceExpressionEntityIds", branch.sourceExpressionEntityIds],
    ["targetExpressionEntityIds", branch.targetExpressionEntityIds],
    ["appliedEntityIds", branch.appliedEntityIds]
  ] as const) {
    if (ids.length === 0 || new Set(ids).size !== ids.length) {
      throw new Error(
        `Both-sides ${side}.${name} must be a nonempty unique list.`
      );
    }
    ids.forEach((id, index) => requireId(id, `${side}.${name}[${index}]`));
  }
}

function validateVariant(draft: KpBothSidesOperationDraft): void {
  assertExactKeys(draft.lawAuthority, [
    "id",
    "authorityRefId",
    "level"
  ], "operation.lawAuthority");
  requireId(draft.lawAuthority.authorityRefId, "lawAuthority.authorityRefId");
  if (draft.lawAuthority.level !== "strict") {
    throw new Error("Both-sides operations require strict law authority.");
  }
  switch (draft.operation.kind) {
    case "add":
      validateBinaryVariant(
        draft as KpBinaryBothSidesOperationDraft,
        "law.equation.add-both-sides",
        "declared-relation-domain"
      );
      return;
    case "subtract":
      validateBinaryVariant(
        draft as KpBinaryBothSidesOperationDraft,
        "law.equation.subtract-both-sides",
        "declared-relation-domain"
      );
      return;
    case "multiply":
      validateBinaryVariant(
        draft as KpBinaryBothSidesOperationDraft,
        "law.equation.multiply-both-sides",
        "nonzero-operand"
      );
      return;
    case "divide":
      validateBinaryVariant(
        draft as KpBinaryBothSidesOperationDraft,
        "law.equation.divide-both-sides",
        "nonzero-operand"
      );
      return;
    case "apply-injective-function":
      validateFunctionVariant(draft as KpFunctionBothSidesOperationDraft);
  }
}

type KpBinaryBothSidesOperationDraft =
  | KpAddBothSidesOperationDraft
  | KpSubtractBothSidesOperationDraft
  | KpMultiplyBothSidesOperationDraft
  | KpDivideBothSidesOperationDraft;

type KpFunctionBothSidesOperationDraft =
  KpApplyInjectiveFunctionBothSidesOperationDraft;

function validateBinaryVariant(
  draft: KpBinaryBothSidesOperationDraft,
  lawId: string,
  evidenceKind: "declared-relation-domain" | "nonzero-operand"
): void {
  assertExactKeys(
    draft.operation,
    ["kind", "operandSemanticId"],
    "operation.operation"
  );
  requireId(draft.operation.operandSemanticId, "operation.operandSemanticId");
  if (draft.lawAuthority.id !== lawId) {
    throw new Error(
      `${draft.operation.kind} requires law authority ${lawId}.`
    );
  }
  if (draft.domainEvidence.kind !== evidenceKind) {
    throw new Error(
      `${draft.operation.kind} requires ${evidenceKind} domain evidence.`
    );
  }
  if (draft.domainEvidence.kind === "declared-relation-domain") {
    assertExactKeys(
      draft.domainEvidence,
      ["kind", "evidenceIds"],
      "operation.domainEvidence"
    );
    requireEvidenceIds(draft.domainEvidence.evidenceIds);
    return;
  }
  assertExactKeys(
    draft.domainEvidence,
    ["kind", "operandSemanticId", "evidenceId"],
    "operation.domainEvidence"
  );
  if (draft.domainEvidence.operandSemanticId !==
      draft.operation.operandSemanticId) {
    throw new Error("Nonzero evidence must name the applied operand.");
  }
  requireId(draft.domainEvidence.evidenceId, "domainEvidence.evidenceId");
}

function validateFunctionVariant(
  draft: KpFunctionBothSidesOperationDraft
): void {
  assertExactKeys(draft.operation, [
    "kind",
    "functionSemanticId",
    "lhsArgumentSemanticId",
    "rhsArgumentSemanticId"
  ], "operation.operation");
  for (const [name, id] of Object.entries(draft.operation)) {
    if (name !== "kind") requireId(id, `operation.${name}`);
  }
  if (draft.lawAuthority.id !== "law.equation.apply-injective-function") {
    throw new Error(
      "Function application requires the injective-function equality law."
    );
  }
  if (draft.domainEvidence.kind !== "injective-function-domain") {
    throw new Error(
      "Function application requires injective-function domain evidence."
    );
  }
  assertExactKeys(draft.domainEvidence, [
    "kind",
    "functionSemanticId",
    "lhsDomainEvidenceId",
    "rhsDomainEvidenceId",
    "injectivityEvidenceId"
  ], "operation.domainEvidence");
  if (draft.domainEvidence.functionSemanticId !==
      draft.operation.functionSemanticId) {
    throw new Error("Injectivity evidence must name the applied function.");
  }
  for (const [name, id] of Object.entries(draft.domainEvidence)) {
    if (name !== "kind") requireId(id, `domainEvidence.${name}`);
  }
}

function requireEvidenceIds(ids: readonly string[]): void {
  if (ids.length === 0 || new Set(ids).size !== ids.length) {
    throw new Error("Declared relation-domain evidence must be nonempty and unique.");
  }
  ids.forEach((id, index) => requireId(id, `domainEvidence.evidenceIds[${index}]`));
}

function assertDataOnly(value: unknown, path: string): void {
  if (typeof value === "function") {
    throw new Error(`Both-sides semantic authority cannot contain a function at ${path}.`);
  }
  if (typeof value !== "object" || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertDataOnly(item, `${path}[${index}]`));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`Both-sides semantic authority requires plain data at ${path}.`);
  }
  Object.entries(value).forEach(([key, item]) =>
    assertDataOnly(item, `${path}.${key}`)
  );
}

function assertExactKeys(
  value: object,
  allowed: readonly string[],
  path: string
): void {
  const allowedKeys = new Set(allowed);
  const unexpected = Object.keys(value).find((key) => !allowedKeys.has(key));
  if (unexpected !== undefined) {
    throw new Error(`Unexpected both-sides field ${path}.${unexpected}.`);
  }
  const missing = allowed.find((key) => !Object.hasOwn(value, key));
  if (missing !== undefined) {
    throw new Error(`Missing both-sides field ${path}.${missing}.`);
  }
}

function requireId(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Both-sides ${path} must be a nonempty semantic ID.`);
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}
