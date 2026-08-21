import {
  compileKpRootRewritePlan,
  isKpVerifiedRootRewritePlan,
  type KpRootRewriteOccurrence,
  type KpRootRewritePlanResult,
  type KpVerifiedRootRewritePlan
} from "./root-rewrite-plan.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "./root-rewrite-vocabulary.ts";

declare const kpVerifiedRootCompositionPressureCorpusBrand: unique symbol;

interface KpRootCompositionPressureState {
  readonly id: string;
  readonly latex: string;
  readonly accessibleText: string;
  readonly occurrences: Readonly<Record<string, KpRootRewriteOccurrence>>;
}

interface KpBlockedRootPressureCase {
  readonly kind: "blocked-root-pressure-case";
  readonly id: "pressure.root.blocked-sum";
  readonly source: KpRootCompositionPressureState;
  readonly result: Extract<KpRootRewritePlanResult, { status: "typed-gap" }>;
  readonly transitionPolicy: "none";
}

interface KpNestedRootPressureCase {
  readonly kind: "nested-root-pressure-case";
  readonly id: "pressure.root.nested-composition";
  readonly states: readonly [KpRootCompositionPressureState,
    KpRootCompositionPressureState];
  readonly plan: KpVerifiedRootRewritePlan;
  readonly carrierIdentity: Readonly<{
    semanticId: string;
    subtreeId: string;
    sourceEntityId: string;
    targetEntityId: string;
  }>;
}

interface KpComposedRootPressureCase {
  readonly kind: "composed-root-pressure-case";
  readonly id: "pressure.root.factoring-first";
  readonly states: readonly [KpRootCompositionPressureState,
    KpRootCompositionPressureState, KpRootCompositionPressureState];
  readonly plan: KpVerifiedRootRewritePlan;
  readonly operationSequence: readonly [
    "operation.equation.factor-perfect-square",
    "operation.root.compound-carrier-normalization"
  ];
  readonly transitionPolicy: "ordered-states-only";
}

export type KpRootCompositionPressureCase =
  | KpBlockedRootPressureCase
  | KpNestedRootPressureCase
  | KpComposedRootPressureCase;

export type KpVerifiedRootCompositionPressureCorpus = Readonly<{
  schemaVersion: "kp.root-composition-pressure-corpus.v1";
  kind: "verified-root-composition-pressure-corpus";
  cases: readonly KpRootCompositionPressureCase[];
  readonly [kpVerifiedRootCompositionPressureCorpusBrand]: true;
}>;

const verifiedCorpora = new WeakSet<object>();

export function createKpRootCompositionPressureCorpus():
  KpVerifiedRootCompositionPressureCorpus {
  const corpus = deepFreeze({
    schemaVersion: "kp.root-composition-pressure-corpus.v1" as const,
    kind: "verified-root-composition-pressure-corpus" as const,
    cases: [blockedCase(), nestedCase(), composedCase()]
  }) as unknown as KpVerifiedRootCompositionPressureCorpus;
  verifiedCorpora.add(corpus);
  return corpus;
}

export function isKpVerifiedRootCompositionPressureCorpus(
  value: unknown
): value is KpVerifiedRootCompositionPressureCorpus {
  if (typeof value !== "object" || value === null ||
    !verifiedCorpora.has(value)) return false;
  const corpus = value as KpVerifiedRootCompositionPressureCorpus;
  return corpus.cases.every((entry) => {
    if (entry.kind === "blocked-root-pressure-case") {
      return entry.result.status === "typed-gap" &&
        entry.transitionPolicy === "none";
    }
    return isKpVerifiedRootRewritePlan(entry.plan);
  });
}

export const kpRootCompositionPressureCorpus =
  createKpRootCompositionPressureCorpus();

function blockedCase(): KpBlockedRootPressureCase {
  const source = state("state.root.blocked-sum.source",
    "\\sqrt{x^{2}+y^{2}}", "the square root of x squared plus y squared", {
      expression: occurrence("blocked.source.expression",
        "semantic.expression.root-of-sum-of-squares",
        "subtree.root-of-sum-of-squares", "compound")
    });
  const result = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.blocked-sum-of-squares",
    operationClass: "blocked-rewrite",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    roleBindings: { "source-expression": source.occurrences["expression"]! },
    evidence: { "no-valid-root-law": "evidence.root.no-sum-distribution" },
    priorOperationIds: []
  });
  if (result.status !== "typed-gap") {
    throw new Error("A blocked root expression cannot mint a transition.");
  }
  return deepFreeze({
    kind: "blocked-root-pressure-case" as const,
    id: "pressure.root.blocked-sum" as const,
    source,
    result,
    transitionPolicy: "none" as const
  });
}

function nestedCase(): KpNestedRootPressureCase {
  const source = state("state.root.nested.source", "\\sqrt{\\sqrt{x}}",
    "the square root of the square root of x", {
      outerRadical: occurrence("nested.source.radical.outer",
        "semantic.operator.square-root.outer", "subtree.nested.radical.outer",
        "operator"),
      innerRadical: occurrence("nested.source.radical.inner",
        "semantic.operator.square-root.inner", "subtree.nested.radical.inner",
        "operator"),
      carrier: occurrence("nested.source.x", "semantic.variable.x",
        "subtree.variable.x", "atomic")
    });
  const target = state("state.root.nested.target", "\\sqrt[4]{x}",
    "the fourth root of x", {
      radical: occurrence("nested.target.radical.fourth",
        "semantic.operator.fourth-root", "subtree.nested.radical.fourth",
        "operator"),
      carrier: occurrence("nested.target.x", "semantic.variable.x",
        "subtree.variable.x", "atomic")
    });
  const result = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.nested-square-roots-to-fourth-root",
    operationClass: "nested-root-composition",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-outer-radical": source.occurrences["outerRadical"]!,
      "source-inner-radical": source.occurrences["innerRadical"]!,
      "source-carrier": source.occurrences["carrier"]!,
      "target-radical": target.occurrences["radical"]!,
      "target-carrier": target.occurrences["carrier"]!
    },
    evidence: {
      "nested-index-product": "evidence.root.index.two-times-two-is-four"
    },
    priorOperationIds: []
  });
  const plan = requirePlan(result);
  const sourceCarrier = source.occurrences["carrier"]!;
  const targetCarrier = target.occurrences["carrier"]!;
  return deepFreeze({
    kind: "nested-root-pressure-case" as const,
    id: "pressure.root.nested-composition" as const,
    states: [source, target] as const,
    plan,
    carrierIdentity: {
      semanticId: sourceCarrier.semanticId,
      subtreeId: sourceCarrier.subtreeId,
      sourceEntityId: sourceCarrier.entityId,
      targetEntityId: targetCarrier.entityId
    }
  });
}

function composedCase(): KpComposedRootPressureCase {
  const source = state("state.root.factoring-first.source",
    "\\sqrt{x^{2}+2x+1}",
    "the square root of x squared plus two x plus one", {
      expression: occurrence("composed.source.expression",
        "semantic.expression.root-perfect-square-trinomial",
        "subtree.root-perfect-square-trinomial", "compound")
    });
  const factored = state("state.root.factoring-first.factored",
    "\\sqrt{(x+1)^{2}}", "the square root of x plus one squared", {
      carrier: occurrence("composed.factored.carrier",
        "semantic.expression.x-plus-one", "subtree.expression.x-plus-one",
        "compound")
    });
  const target = state("state.root.factoring-first.target",
    "\\left\\lvert x+1\\right\\rvert", "the absolute value of x plus one", {
      carrier: occurrence("composed.target.carrier",
        "semantic.expression.x-plus-one", "subtree.expression.x-plus-one",
        "compound"),
      absoluteValue: occurrence("composed.target.absolute-value",
        "semantic.operator.absolute-value", "subtree.composed.absolute-value",
        "enclosure")
    });
  const result = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.factoring-first-perfect-square",
    operationClass: "composed-derivation",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-expression": source.occurrences["expression"]!,
      "target-carrier": target.occurrences["carrier"]!,
      "target-absolute-value-enclosure": target.occurrences["absoluteValue"]!
    },
    evidence: {
      "prior-factoring-state": factored.id,
      "even-positive-integer-power": "evidence.root.factored-square.even",
      "real-valued-carrier": "evidence.root.x-plus-one.real"
    },
    priorOperationIds: ["operation.equation.factor-perfect-square"]
  });
  return deepFreeze({
    kind: "composed-root-pressure-case" as const,
    id: "pressure.root.factoring-first" as const,
    states: [source, factored, target] as const,
    plan: requirePlan(result),
    operationSequence: [
      "operation.equation.factor-perfect-square",
      "operation.root.compound-carrier-normalization"
    ] as const,
    transitionPolicy: "ordered-states-only" as const
  });
}

function requirePlan(result: KpRootRewritePlanResult):
  KpVerifiedRootRewritePlan {
  if (result.status !== "verified") {
    throw new Error("Root composition fixture unexpectedly produced a gap.");
  }
  return result.plan;
}

function state(
  id: string,
  latex: string,
  accessibleText: string,
  occurrences: Record<string, KpRootRewriteOccurrence>
): KpRootCompositionPressureState {
  return deepFreeze({ id, latex, accessibleText, occurrences });
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
