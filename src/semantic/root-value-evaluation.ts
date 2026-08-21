declare const kpVerifiedRootValueEvaluationBrand: unique symbol;

export const KP_ROOT_VALUE_EVALUATION_AUTHORITY =
  "operation.arithmetic.evaluate-real-root.v1" as const;

export interface KpRootValueBranchCorrespondence {
  readonly branchId: string;
  readonly sign: "positive" | "negative" | "zero" | "unique-real";
  readonly solutionSemanticId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly substitutionEvidenceId: string;
}

export interface KpRootValueEvaluationDraft {
  readonly schemaVersion: "kp.root-value-evaluation.v1";
  readonly id: string;
  readonly operationAuthority: typeof KP_ROOT_VALUE_EVALUATION_AUTHORITY;
  readonly lawAuthority: Readonly<{
    id: "law.arithmetic.real-root-evaluation";
    authorityRefId: string;
    level: "strict";
  }>;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly sourceRootExpressionEntityId: string;
  readonly targetValueEntityId: string;
  readonly rootValue: Readonly<{
    index: number;
    radicand: number;
    value: number;
    arithmeticEvidenceId: string;
  }>;
  readonly branchCorrespondence: readonly [
    KpRootValueBranchCorrespondence,
    ...KpRootValueBranchCorrespondence[]
  ];
}

export type KpVerifiedRootValueEvaluation = KpRootValueEvaluationDraft & {
  readonly [kpVerifiedRootValueEvaluationBrand]: true;
};

const verifiedEvaluations = new WeakSet<object>();

/** Numerical root evaluation is a distinct semantic step from constructing
 * radical notation, so animation cannot hide arithmetic inside a handoff. */
export function verifyKpRootValueEvaluation(
  draft: KpRootValueEvaluationDraft
): KpVerifiedRootValueEvaluation {
  assertDataOnly(draft, "rootEvaluation");
  assertExactKeys(draft, [
    "schemaVersion",
    "id",
    "operationAuthority",
    "lawAuthority",
    "sourceStateId",
    "targetStateId",
    "sourceRootExpressionEntityId",
    "targetValueEntityId",
    "rootValue",
    "branchCorrespondence"
  ], "rootEvaluation");
  if (draft.schemaVersion !== "kp.root-value-evaluation.v1") {
    throw new Error("Unsupported root-value evaluation schema.");
  }
  if (draft.operationAuthority !== KP_ROOT_VALUE_EVALUATION_AUTHORITY) {
    throw new Error("Unknown root-value evaluation authority.");
  }
  for (const [path, id] of [
    ["id", draft.id],
    ["sourceStateId", draft.sourceStateId],
    ["targetStateId", draft.targetStateId],
    ["sourceRootExpressionEntityId", draft.sourceRootExpressionEntityId],
    ["targetValueEntityId", draft.targetValueEntityId]
  ] as const) requireId(id, path);
  if (draft.sourceStateId === draft.targetStateId) {
    throw new Error("Root evaluation requires distinct adjacent states.");
  }
  assertExactKeys(draft.lawAuthority,
    ["id", "authorityRefId", "level"], "lawAuthority");
  if (
    draft.lawAuthority.id !== "law.arithmetic.real-root-evaluation" ||
    draft.lawAuthority.level !== "strict"
  ) {
    throw new Error("Root evaluation requires strict arithmetic law authority.");
  }
  requireId(draft.lawAuthority.authorityRefId,
    "lawAuthority.authorityRefId");
  validateRootValue(draft.rootValue);
  validateBranches(draft.branchCorrespondence);
  const verified = deepFreeze(draft) as KpVerifiedRootValueEvaluation;
  verifiedEvaluations.add(verified);
  return verified;
}

export function isKpVerifiedRootValueEvaluation(
  value: unknown
): value is KpVerifiedRootValueEvaluation {
  return typeof value === "object" && value !== null &&
    verifiedEvaluations.has(value);
}

function validateRootValue(value: KpRootValueEvaluationDraft["rootValue"]): void {
  assertExactKeys(value,
    ["index", "radicand", "value", "arithmeticEvidenceId"], "rootValue");
  if (!Number.isSafeInteger(value.index) || value.index <= 0) {
    throw new Error("Root evaluation index must be a positive safe integer.");
  }
  if (!Number.isFinite(value.radicand) || !Number.isFinite(value.value)) {
    throw new Error("Root evaluation requires finite real values.");
  }
  if (value.index % 2 === 0 && value.value < 0) {
    throw new Error("An even principal real root cannot evaluate negative.");
  }
  if (value.value ** value.index !== value.radicand) {
    throw new Error("Root evaluation evidence does not satisfy value^index = radicand.");
  }
  requireId(value.arithmeticEvidenceId, "rootValue.arithmeticEvidenceId");
}

function validateBranches(
  branches: KpRootValueEvaluationDraft["branchCorrespondence"]
): void {
  if (branches.length === 0) {
    throw new Error("Root evaluation requires at least one retained branch.");
  }
  const ids = new Set<string>();
  const sourceEntities = new Set<string>();
  const targetEntities = new Set<string>();
  branches.forEach((branch, index) => {
    assertExactKeys(branch, [
      "branchId",
      "sign",
      "solutionSemanticId",
      "sourceEntityId",
      "targetEntityId",
      "substitutionEvidenceId"
    ], `branchCorrespondence[${index}]`);
    for (const [name, id] of Object.entries(branch)) {
      if (name !== "sign") requireId(id, `branchCorrespondence[${index}].${name}`);
    }
    if (
      ids.has(branch.branchId) ||
      sourceEntities.has(branch.sourceEntityId) ||
      targetEntities.has(branch.targetEntityId)
    ) {
      throw new Error("Root evaluation branch and occurrence IDs must be unique.");
    }
    ids.add(branch.branchId);
    sourceEntities.add(branch.sourceEntityId);
    targetEntities.add(branch.targetEntityId);
  });
}

function assertDataOnly(value: unknown, path: string): void {
  if (typeof value === "function") {
    throw new Error(`Root evaluation cannot contain a function at ${path}.`);
  }
  if (typeof value !== "object" || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertDataOnly(item, `${path}[${index}]`));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`Root evaluation requires plain data at ${path}.`);
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
    throw new Error(`Unexpected root-evaluation field ${path}.${unexpected}.`);
  }
  const missing = allowed.find((key) => !Object.hasOwn(value, key));
  if (missing !== undefined) {
    throw new Error(`Missing root-evaluation field ${path}.${missing}.`);
  }
}

function requireId(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a nonempty semantic ID.`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
