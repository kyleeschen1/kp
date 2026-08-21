import {
  compileKpRootRewritePlan,
  isKpVerifiedRootRewritePlan,
  type KpRootRewriteOccurrence,
  type KpVerifiedRootRewritePlan
} from "./root-rewrite-plan.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "./root-rewrite-vocabulary.ts";

declare const kpVerifiedRationalExponentCompositionBrand: unique symbol;

export const KP_RATIONAL_EXPONENT_COMPOSITION_EXEMPLAR_ID =
  "exemplar.root.exponent-index-composition.x-two-thirds" as const;

export interface KpRationalExponentCompositionSourceState {
  readonly id: "state.root.exponent-index.source";
  readonly latex: "\\sqrt[3]{x^{2}}";
  readonly accessibleText: "the cube root of x squared";
  readonly radical: KpRootRewriteOccurrence;
  readonly rootIndex: KpRootRewriteOccurrence;
  readonly power: KpRootRewriteOccurrence;
  readonly carrier: KpRootRewriteOccurrence;
  readonly exponent: KpRootRewriteOccurrence;
}

export interface KpRationalExponentCompositionTargetState {
  readonly id: "state.root.exponent-index.target";
  readonly latex: "x^{2/3}";
  readonly accessibleText: "x to the two thirds power";
  readonly power: KpRootRewriteOccurrence;
  readonly carrier: KpRootRewriteOccurrence;
  readonly exponent: KpRootRewriteOccurrence;
  readonly numerator: KpRootRewriteOccurrence;
  readonly division: KpRootRewriteOccurrence;
  readonly denominator: KpRootRewriteOccurrence;
}

export type KpRationalExponentCompositionCorrespondence = Readonly<{
  id: string;
  relation: "identity" | "role-change" | "introduction" | "removal";
  sourceEntityIds: readonly string[];
  targetEntityIds: readonly string[];
}>;

export type KpVerifiedRationalExponentCompositionExemplar = Readonly<{
  schemaVersion: "kp.rational-exponent-composition-exemplar.v1";
  kind: "verified-rational-exponent-composition-exemplar";
  id: typeof KP_RATIONAL_EXPONENT_COMPOSITION_EXEMPLAR_ID;
  states: readonly [KpRationalExponentCompositionSourceState,
    KpRationalExponentCompositionTargetState];
  plan: KpVerifiedRootRewritePlan;
  correspondence: readonly KpRationalExponentCompositionCorrespondence[];
  readonly [kpVerifiedRationalExponentCompositionBrand]: true;
}>;

const verifiedExemplars = new WeakSet<object>();

export function createKpRationalExponentCompositionExemplar():
  KpVerifiedRationalExponentCompositionExemplar {
  const source = sourceState();
  const target = targetState();
  const planResult = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.exponent-index-composition.x-two-thirds",
    operationClass: "exponent-index-composition",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-radical": source.radical,
      "source-root-index": source.rootIndex,
      "source-exponent": source.exponent,
      "source-carrier": source.carrier,
      "target-carrier": target.carrier,
      "target-exponent": target.exponent
    },
    evidence: {
      "positive-integer-root-index":
        "evidence.root.index.three.positive-integer"
    },
    priorOperationIds: []
  });
  if (planResult.status !== "verified") {
    throw new Error("Rational exponent composition unexpectedly produced a gap.");
  }
  const correspondence = Object.freeze([
    relationRecord("carrier", "identity", [source.carrier.entityId],
      [target.carrier.entityId]),
    relationRecord("exponent-to-numerator", "role-change",
      [source.exponent.entityId], [target.numerator.entityId]),
    relationRecord("index-to-denominator", "role-change",
      [source.rootIndex.entityId], [target.denominator.entityId]),
    relationRecord("division-introduced", "introduction", [],
      [target.division.entityId]),
    relationRecord("radical-removed", "removal", [source.radical.entityId], [])
  ]);
  const exemplar = deepFreeze({
    schemaVersion: "kp.rational-exponent-composition-exemplar.v1" as const,
    kind: "verified-rational-exponent-composition-exemplar" as const,
    id: KP_RATIONAL_EXPONENT_COMPOSITION_EXEMPLAR_ID,
    states: [source, target] as const,
    plan: planResult.plan,
    correspondence
  }) as unknown as KpVerifiedRationalExponentCompositionExemplar;
  verifiedExemplars.add(exemplar);
  return exemplar;
}

export function isKpVerifiedRationalExponentCompositionExemplar(
  value: unknown
): value is KpVerifiedRationalExponentCompositionExemplar {
  return typeof value === "object" && value !== null &&
    verifiedExemplars.has(value) &&
    isKpVerifiedRootRewritePlan(
      (value as KpVerifiedRationalExponentCompositionExemplar).plan
    );
}

export const kpRationalExponentCompositionExemplar =
  createKpRationalExponentCompositionExemplar();

function sourceState(): KpRationalExponentCompositionSourceState {
  return deepFreeze({
    id: "state.root.exponent-index.source" as const,
    latex: "\\sqrt[3]{x^{2}}" as const,
    accessibleText: "the cube root of x squared" as const,
    radical: occurrence("source.exponent-index.radical",
      "semantic.operator.cube-root", "subtree.source.radical", "operator"),
    rootIndex: occurrence("source.exponent-index.root-index.three",
      "semantic.index.three", "subtree.index.three", "value"),
    power: occurrence("source.exponent-index.power",
      "semantic.expression.x-squared", "subtree.source.power", "compound"),
    carrier: occurrence("source.exponent-index.x", "semantic.variable.x",
      "subtree.variable.x", "atomic"),
    exponent: occurrence("source.exponent-index.exponent.two",
      "semantic.index.two", "subtree.index.two", "value")
  });
}

function targetState(): KpRationalExponentCompositionTargetState {
  return deepFreeze({
    id: "state.root.exponent-index.target" as const,
    latex: "x^{2/3}" as const,
    accessibleText: "x to the two thirds power" as const,
    power: occurrence("target.exponent-index.power",
      "semantic.expression.x-two-thirds", "subtree.target.power", "compound"),
    carrier: occurrence("target.exponent-index.x", "semantic.variable.x",
      "subtree.variable.x", "atomic"),
    exponent: occurrence("target.exponent-index.exponent",
      "semantic.rational.two-thirds", "subtree.target.exponent", "compound"),
    numerator: occurrence("target.exponent-index.numerator.two",
      "semantic.index.two", "subtree.index.two", "value"),
    division: occurrence("target.exponent-index.division",
      "semantic.operator.division", "subtree.target.division", "operator"),
    denominator: occurrence("target.exponent-index.denominator.three",
      "semantic.index.three", "subtree.index.three", "value")
  });
}

function relationRecord(
  suffix: string,
  relation: KpRationalExponentCompositionCorrespondence["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[]
): KpRationalExponentCompositionCorrespondence {
  return Object.freeze({
    id: `correspondence.root.exponent-index.${suffix}`,
    relation,
    sourceEntityIds: Object.freeze([...sourceEntityIds]),
    targetEntityIds: Object.freeze([...targetEntityIds])
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
