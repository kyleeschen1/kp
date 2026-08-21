import {
  compileKpRootRewritePlan,
  isKpVerifiedRootRewritePlan,
  type KpRootRewriteOccurrence,
  type KpVerifiedRootRewritePlan
} from "./root-rewrite-plan.ts";
import {
  isKpVerifiedRootValueEvaluation,
  KP_ROOT_VALUE_EVALUATION_AUTHORITY,
  verifyKpRootValueEvaluation,
  type KpVerifiedRootValueEvaluation
} from "./root-value-evaluation.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "./root-rewrite-vocabulary.ts";

declare const kpVerifiedClosedRootEvaluationExemplarBrand: unique symbol;

export const KP_CLOSED_ROOT_EVALUATION_EXEMPLAR_ID =
  "exemplar.root.closed-evaluation.sqrt-144" as const;

export interface KpClosedRootEvaluationSourceState {
  readonly id: "state.root.closed-evaluation.sqrt-144.source";
  readonly kind: "closed-root-expression";
  readonly latex: "\\sqrt{144}";
  readonly accessibleText: "the square root of one hundred forty-four";
  readonly radical: KpRootRewriteOccurrence;
  readonly radicand: KpRootRewriteOccurrence;
}

export interface KpClosedRootEvaluationTargetState {
  readonly id: "state.root.closed-evaluation.sqrt-144.target";
  readonly kind: "closed-root-value";
  readonly latex: "12";
  readonly accessibleText: "twelve";
  readonly value: KpRootRewriteOccurrence;
}

export type KpVerifiedClosedRootEvaluationExemplar = Readonly<{
  schemaVersion: "kp.closed-root-evaluation-exemplar.v1";
  kind: "verified-closed-root-evaluation-exemplar";
  id: typeof KP_CLOSED_ROOT_EVALUATION_EXEMPLAR_ID;
  states: readonly [KpClosedRootEvaluationSourceState,
    KpClosedRootEvaluationTargetState];
  plan: KpVerifiedRootRewritePlan;
  arithmetic: KpVerifiedRootValueEvaluation;
  readonly [kpVerifiedClosedRootEvaluationExemplarBrand]: true;
}>;

const verifiedExemplars = new WeakSet<object>();

export function createKpClosedRootEvaluationExemplar():
  KpVerifiedClosedRootEvaluationExemplar {
  const source = sourceState();
  const target = targetState();
  const planResult = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.closed-evaluation.sqrt-144",
    operationClass: "closed-evaluation",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-radical": source.radical,
      "source-radicand": source.radicand,
      "target-value": target.value
    },
    evidence: {
      "closed-value": "evidence.root.sqrt-144.closed-value",
      "exact-root": "evidence.root.sqrt-144.exact-root"
    },
    priorOperationIds: []
  });
  if (planResult.status !== "verified") {
    throw new Error("Closed root evaluation unexpectedly produced a gap.");
  }
  const arithmetic = verifyKpRootValueEvaluation({
    schemaVersion: "kp.root-value-evaluation.v1",
    id: "operation.root.evaluate.sqrt-144",
    operationAuthority: KP_ROOT_VALUE_EVALUATION_AUTHORITY,
    lawAuthority: {
      id: "law.arithmetic.real-root-evaluation",
      authorityRefId: "definition.principal-square-root",
      level: "strict"
    },
    sourceStateId: source.id,
    targetStateId: target.id,
    sourceRootExpressionEntityId: source.radical.entityId,
    targetValueEntityId: target.value.entityId,
    rootValue: {
      index: 2,
      radicand: 144,
      value: 12,
      arithmeticEvidenceId: "evidence.arithmetic.twelve-squared-is-144"
    },
    branchCorrespondence: [{
      branchId: "branch.principal-root.sqrt-144",
      sign: "unique-real",
      solutionSemanticId: "semantic.value.twelve",
      sourceEntityId: source.radical.entityId,
      targetEntityId: target.value.entityId,
      substitutionEvidenceId: "evidence.substitution.twelve-squared-is-144"
    }]
  });
  const exemplar = deepFreeze({
    schemaVersion: "kp.closed-root-evaluation-exemplar.v1" as const,
    kind: "verified-closed-root-evaluation-exemplar" as const,
    id: KP_CLOSED_ROOT_EVALUATION_EXEMPLAR_ID,
    states: [source, target] as const,
    plan: planResult.plan,
    arithmetic
  }) as unknown as KpVerifiedClosedRootEvaluationExemplar;
  verifiedExemplars.add(exemplar);
  return exemplar;
}

export function isKpVerifiedClosedRootEvaluationExemplar(
  value: unknown
): value is KpVerifiedClosedRootEvaluationExemplar {
  return typeof value === "object" && value !== null &&
    verifiedExemplars.has(value) &&
    isKpVerifiedRootRewritePlan(
      (value as KpVerifiedClosedRootEvaluationExemplar).plan
    ) &&
    isKpVerifiedRootValueEvaluation(
      (value as KpVerifiedClosedRootEvaluationExemplar).arithmetic
    );
}

export const kpClosedRootEvaluationExemplar =
  createKpClosedRootEvaluationExemplar();

function sourceState(): KpClosedRootEvaluationSourceState {
  return deepFreeze({
    id: "state.root.closed-evaluation.sqrt-144.source" as const,
    kind: "closed-root-expression" as const,
    latex: "\\sqrt{144}" as const,
    accessibleText: "the square root of one hundred forty-four" as const,
    radical: occurrence(
      "source.closed-root.radical",
      "semantic.operator.square-root",
      "subtree.closed-root.sqrt-144",
      "operator"
    ),
    radicand: occurrence(
      "source.closed-root.radicand.144",
      "semantic.value.144",
      "subtree.value.144",
      "value"
    )
  });
}

function targetState(): KpClosedRootEvaluationTargetState {
  return deepFreeze({
    id: "state.root.closed-evaluation.sqrt-144.target" as const,
    kind: "closed-root-value" as const,
    latex: "12" as const,
    accessibleText: "twelve" as const,
    value: occurrence(
      "target.closed-root.value.12",
      "semantic.value.twelve",
      "subtree.value.twelve",
      "value"
    )
  });
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
