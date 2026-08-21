import {
  compileKpRootRewritePlan,
  isKpVerifiedRootRewritePlan,
  type KpRootRewriteOccurrence,
  type KpVerifiedRootRewritePlan
} from "./root-rewrite-plan.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "./root-rewrite-vocabulary.ts";

declare const kpVerifiedRootExtractionPressureCaseBrand: unique symbol;

interface KpRootExtractionPressureState {
  readonly id: string;
  readonly latex: string;
  readonly accessibleText: string;
  readonly occurrences: Readonly<Record<string, KpRootRewriteOccurrence>>;
}

export interface KpVerifiedRootExtractionPressureCase {
  readonly schemaVersion: "kp.root-extraction-pressure-case.v1";
  readonly kind: "verified-root-extraction-pressure-case";
  readonly id: "pressure.root.mixed-evaluation" |
    "pressure.root.partial-extraction";
  readonly operationClass: "mixed-evaluation" | "partial-extraction";
  readonly states: readonly [KpRootExtractionPressureState,
    KpRootExtractionPressureState];
  readonly plan: KpVerifiedRootRewritePlan;
  readonly identityPairs: readonly Readonly<{
    semanticId: string;
    sourceEntityId: string;
    targetEntityId: string;
  }>[];
  readonly [kpVerifiedRootExtractionPressureCaseBrand]: true;
}

const verifiedCases = new WeakSet<object>();

export const kpRootExtractionPressureCorpus = Object.freeze([
  createMixedEvaluationCase(),
  createPartialExtractionCase()
] as const);

export function isKpVerifiedRootExtractionPressureCase(
  value: unknown
): value is KpVerifiedRootExtractionPressureCase {
  return typeof value === "object" && value !== null &&
    verifiedCases.has(value) &&
    isKpVerifiedRootRewritePlan(
      (value as KpVerifiedRootExtractionPressureCase).plan
    );
}

function createMixedEvaluationCase():
  KpVerifiedRootExtractionPressureCase {
  const source = state(
    "state.root.mixed.source",
    "\\sqrt{4x^{2}}",
    "the square root of four x squared",
    {
      radical: occurrence("mixed.source.radical", "semantic.operator.sqrt",
        "subtree.mixed.source.radical", "operator"),
      radicand: occurrence("mixed.source.radicand",
        "semantic.expression.four-x-squared", "subtree.mixed.source.radicand",
        "compound"),
      coefficient: occurrence("mixed.source.coefficient.four",
        "semantic.value.four", "subtree.value.four", "value"),
      power: occurrence("mixed.source.power", "semantic.expression.x-squared",
        "subtree.mixed.source.power", "compound"),
      carrier: occurrence("mixed.source.x", "semantic.variable.x",
        "subtree.variable.x", "atomic"),
      exponent: occurrence("mixed.source.exponent.two", "semantic.index.two",
        "subtree.index.two", "value")
    }
  );
  const target = state(
    "state.root.mixed.target",
    "2\\left\\lvert x\\right\\rvert",
    "two times the absolute value of x",
    {
      expression: occurrence("mixed.target.expression",
        "semantic.expression.two-abs-x", "subtree.mixed.target.expression",
        "compound"),
      coefficient: occurrence("mixed.target.coefficient.two",
        "semantic.value.two", "subtree.value.two", "value"),
      absoluteValue: occurrence("mixed.target.absolute-value",
        "semantic.operator.absolute-value", "subtree.mixed.target.absolute",
        "enclosure"),
      carrier: occurrence("mixed.target.x", "semantic.variable.x",
        "subtree.variable.x", "atomic")
    }
  );
  const planResult = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.mixed-evaluation.four-x-squared",
    operationClass: "mixed-evaluation",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-radical": source.occurrences["radical"]!,
      "source-coefficient": source.occurrences["coefficient"]!,
      "source-exponent": source.occurrences["exponent"]!,
      "source-carrier": source.occurrences["carrier"]!,
      "target-coefficient": target.occurrences["coefficient"]!,
      "target-carrier": target.occurrences["carrier"]!,
      "target-absolute-value-enclosure":
        target.occurrences["absoluteValue"]!
    },
    evidence: {
      "closed-value": "evidence.root.four.closed-value",
      "exact-root": "evidence.root.four.exact-root-two",
      "even-positive-integer-power": "evidence.root.x.square",
      "real-valued-carrier": "evidence.root.x.real"
    },
    priorOperationIds: ["operation.root.extract-perfect-power-factor"]
  });
  return verifiedCase({
    id: "pressure.root.mixed-evaluation",
    operationClass: "mixed-evaluation",
    source,
    target,
    plan: requirePlan(planResult),
    identityPairs: [identityPair(
      source.occurrences["carrier"]!, target.occurrences["carrier"]!
    )]
  });
}

function createPartialExtractionCase():
  KpVerifiedRootExtractionPressureCase {
  const source = state(
    "state.root.partial.source",
    "\\sqrt{x^{2}y}",
    "the square root of x squared times y",
    {
      radical: occurrence("partial.source.radical", "semantic.operator.sqrt",
        "subtree.partial.radical", "operator"),
      radicand: occurrence("partial.source.radicand",
        "semantic.expression.x-squared-y", "subtree.partial.radicand",
        "compound"),
      power: occurrence("partial.source.power", "semantic.expression.x-squared",
        "subtree.partial.power", "compound"),
      carrier: occurrence("partial.source.x", "semantic.variable.x",
        "subtree.variable.x", "atomic"),
      exponent: occurrence("partial.source.exponent.two", "semantic.index.two",
        "subtree.index.two", "value"),
      residual: occurrence("partial.source.y", "semantic.variable.y",
        "subtree.variable.y", "atomic")
    }
  );
  const target = state(
    "state.root.partial.target",
    "\\left\\lvert x\\right\\rvert\\sqrt{y}",
    "the absolute value of x times the square root of y",
    {
      expression: occurrence("partial.target.expression",
        "semantic.expression.abs-x-root-y", "subtree.partial.target.expression",
        "compound"),
      absoluteValue: occurrence("partial.target.absolute-value",
        "semantic.operator.absolute-value", "subtree.partial.target.absolute",
        "enclosure"),
      carrier: occurrence("partial.target.x", "semantic.variable.x",
        "subtree.variable.x", "atomic"),
      radical: occurrence("partial.target.radical", "semantic.operator.sqrt",
        "subtree.partial.radical", "operator"),
      residual: occurrence("partial.target.y", "semantic.variable.y",
        "subtree.variable.y", "atomic")
    }
  );
  const planResult = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.partial-extraction.x-squared-y",
    operationClass: "partial-extraction",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-radical": source.occurrences["radical"]!,
      "source-exponent": source.occurrences["exponent"]!,
      "source-carrier": source.occurrences["carrier"]!,
      "source-residual": source.occurrences["residual"]!,
      "target-carrier": target.occurrences["carrier"]!,
      "target-residual": target.occurrences["residual"]!,
      "target-radical": target.occurrences["radical"]!,
      "target-absolute-value-enclosure":
        target.occurrences["absoluteValue"]!
    },
    evidence: {
      "perfect-power-factor": "evidence.root.x-square.factor",
      "residual-radicand": "evidence.root.y.residual",
      "real-valued-carrier": "evidence.root.x.real"
    },
    priorOperationIds: []
  });
  return verifiedCase({
    id: "pressure.root.partial-extraction",
    operationClass: "partial-extraction",
    source,
    target,
    plan: requirePlan(planResult),
    identityPairs: [
      identityPair(source.occurrences["carrier"]!,
        target.occurrences["carrier"]!),
      identityPair(source.occurrences["residual"]!,
        target.occurrences["residual"]!),
      identityPair(source.occurrences["radical"]!,
        target.occurrences["radical"]!)
    ]
  });
}

function verifiedCase(input: {
  readonly id: KpVerifiedRootExtractionPressureCase["id"];
  readonly operationClass:
    KpVerifiedRootExtractionPressureCase["operationClass"];
  readonly source: KpRootExtractionPressureState;
  readonly target: KpRootExtractionPressureState;
  readonly plan: KpVerifiedRootRewritePlan;
  readonly identityPairs: KpVerifiedRootExtractionPressureCase["identityPairs"];
}): KpVerifiedRootExtractionPressureCase {
  const result = deepFreeze({
    schemaVersion: "kp.root-extraction-pressure-case.v1" as const,
    kind: "verified-root-extraction-pressure-case" as const,
    id: input.id,
    operationClass: input.operationClass,
    states: [input.source, input.target] as const,
    plan: input.plan,
    identityPairs: input.identityPairs
  }) as unknown as KpVerifiedRootExtractionPressureCase;
  verifiedCases.add(result);
  return result;
}

function state(
  id: string,
  latex: string,
  accessibleText: string,
  occurrences: Record<string, KpRootRewriteOccurrence>
): KpRootExtractionPressureState {
  return deepFreeze({ id, latex, accessibleText, occurrences });
}

function identityPair(
  source: KpRootRewriteOccurrence,
  target: KpRootRewriteOccurrence
) {
  if (source.semanticId !== target.semanticId ||
    source.subtreeId !== target.subtreeId) {
    throw new Error("Root pressure identity requires matching semantic subtrees.");
  }
  return Object.freeze({
    semanticId: source.semanticId,
    sourceEntityId: source.entityId,
    targetEntityId: target.entityId
  });
}

function requirePlan(
  result: ReturnType<typeof compileKpRootRewritePlan>
): KpVerifiedRootRewritePlan {
  if (result.status !== "verified") {
    throw new Error("Root extraction pressure unexpectedly produced a gap.");
  }
  return result.plan;
}

function occurrence(
  entityId: string,
  semanticId: string,
  subtreeId: string,
  subtreeKind: KpRootRewriteOccurrence["subtreeKind"]
): KpRootRewriteOccurrence {
  return { entityId, semanticId, subtreeId, subtreeKind };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
