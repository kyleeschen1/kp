/** Internal exemplar input, not an Article directive or a general knowledge schema. */
export interface KpReasoningSource {
  readonly schemaVersion: "kp.reasoning-example.v1";
  readonly id: string;
  readonly title: string;
  readonly formula: {
    readonly lawId: string;
    readonly commonFactorId: string;
    readonly addendIds: readonly string[];
  };
  readonly parent: {
    readonly id: string;
    readonly statement: string;
    readonly sourceStateId: string;
    readonly targetStateId: string;
    readonly assumptionIds: readonly string[];
  };
  readonly reason: {
    readonly id: string;
    readonly title: string;
    readonly operationIds: readonly string[];
    readonly explanation: string;
    readonly assumptionIds: readonly string[];
  };
  readonly compact: string;
}

export class KpReasoningRepairGap extends Error {
  readonly code: string;
  readonly path: string;
  readonly expected: string;
  constructor(code: string, path: string, expected: string) {
    super(`${path}: ${expected}`);
    this.name = "KpReasoningRepairGap";
    this.code = code;
    this.path = path;
    this.expected = expected;
  }
}

export function createKpReasoningSource(): KpReasoningSource {
  return readKpReasoningSource({
    schemaVersion: "kp.reasoning-example.v1",
    id: "lesson.reasoning.distribute-evaluate",
    title: "Make the constant visible",
    formula: {
      lawId: "kp.algebra.distribute.v1",
      commonFactorId: "fraction-fan-out.source.factor",
      addendIds: ["fraction-fan-out.source.addend.x", "fraction-fan-out.source.addend.6"]
    },
    parent: {
      id: "claim.expand-and-evaluate",
      statement: "Distribute the fraction, then evaluate the constant term.",
      sourceStateId: "fraction-solve.state.factored",
      targetStateId: "fraction-solve.state.constant-quotient",
      assumptionIds: ["assumption.real-scalar-x", "assumption.nonzero-denominator"]
    },
    reason: {
      id: "reason.distribute-evaluate",
      title: "Why does this step work?",
      operationIds: [
        "fraction-solve.step.distribute", "fraction-solve.step.normalize",
        "fraction-solve.step.constant-product", "fraction-solve.step.constant-quotient"
      ],
      explanation: "The same factor multiplies both terms. Rewrite the products as fractions, then evaluate the constant product and quotient.",
      assumptionIds: ["assumption.real-scalar-x", "assumption.nonzero-denominator"]
    },
    compact: "Distribute to both terms; evaluate the constant."
  });
}

/** Shape validation alone supplies no proof. Binding to the trusted trace is separate. */
export function readKpReasoningSource(value: unknown): KpReasoningSource {
  const root = record(value, "$", ["schemaVersion", "id", "title", "formula", "parent", "reason", "compact"]);
  if (root.schemaVersion !== "kp.reasoning-example.v1") gap("$.schemaVersion", "Use kp.reasoning-example.v1.");
  const parent = record(root.parent, "$.parent", ["id", "statement", "sourceStateId", "targetStateId", "assumptionIds"]);
  const reason = record(root.reason, "$.reason", ["id", "title", "operationIds", "explanation", "assumptionIds"]);
  const formula = record(root.formula, "$.formula", ["lawId", "commonFactorId", "addendIds"]);
  if (!Array.isArray(formula.addendIds) || formula.addendIds.length !== 2) {
    gap("$.formula.addendIds", "Bind exactly two addends for this distribution exemplar.");
  }
  const addendIds = formula.addendIds.map((id: unknown, index: number) => text(id, `$.formula.addendIds[${index}]`));
  const operations = reason.operationIds;
  if (!Array.isArray(operations) || operations.length < 1 || operations.length > 13) {
    gap("$.reason.operationIds", "Select between one and thirteen existing operations.");
  }
  const ids = operations.map((id: unknown, index: number) => text(id, `$.reason.operationIds[${index}]`));
  if (new Set(ids).size !== ids.length) gap("$.reason.operationIds", "Select each operation once.");
  const source: KpReasoningSource = {
    schemaVersion: "kp.reasoning-example.v1",
    id: text(root.id, "$.id"),
    title: text(root.title, "$.title"),
    formula: Object.freeze({
      lawId: text(formula.lawId, "$.formula.lawId"),
      commonFactorId: text(formula.commonFactorId, "$.formula.commonFactorId"),
      addendIds: Object.freeze(addendIds)
    }),
    parent: Object.freeze({
      id: text(parent.id, "$.parent.id"), statement: text(parent.statement, "$.parent.statement"),
      sourceStateId: text(parent.sourceStateId, "$.parent.sourceStateId"),
      targetStateId: text(parent.targetStateId, "$.parent.targetStateId"),
      assumptionIds: assumptionIds(parent.assumptionIds, "$.parent.assumptionIds")
    }),
    reason: Object.freeze({
      id: text(reason.id, "$.reason.id"), title: text(reason.title, "$.reason.title"),
      operationIds: Object.freeze(ids), explanation: text(reason.explanation, "$.reason.explanation"),
      assumptionIds: assumptionIds(reason.assumptionIds, "$.reason.assumptionIds")
    }),
    compact: text(root.compact, "$.compact")
  };
  if (new Set([source.id, source.parent.id, source.reason.id]).size !== 3) {
    gap("$.id", "Lesson, parent and reason require distinct local identities.");
  }
  return Object.freeze(source);
}

function record<const Keys extends readonly string[]>(value: unknown, path: string, keys: Keys): Record<Keys[number], unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) gap(path, "Expected an object.");
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) gap(`${path}.${key}`, "Remove the unsupported field; author semantic references and prose only.");
  }
  return value as Record<Keys[number], unknown>;
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 8000) {
    gap(path, "Expected nonempty text of at most 8000 characters.");
  }
  return value;
}

function assumptionIds(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value) || value.length > 8) gap(path, "Supply a bounded list of assumption references.");
  const ids = value.map((id: unknown, index: number) => text(id, `${path}[${index}]`));
  if (new Set(ids).size !== ids.length) gap(path, "Assumption references must be unique.");
  return Object.freeze(ids);
}

function gap(path: string, expected: string): never {
  throw new KpReasoningRepairGap("kp.reasoning.source-shape", path, expected);
}
