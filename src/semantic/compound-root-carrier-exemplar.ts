import {
  compileKpRootRewritePlan,
  isKpVerifiedRootRewritePlan,
  type KpRootRewriteOccurrence,
  type KpVerifiedRootRewritePlan
} from "./root-rewrite-plan.ts";
import {
  certifyKpRootPersistentSubtree,
  isKpRootPersistentSubtreeCertificate,
  type KpRootPersistentSubtreeCertificate,
  type KpRootSemanticSubtreeNode
} from "./root-persistent-subtree-certificate.ts";
import { KP_ROOT_REWRITE_VOCABULARY_AUTHORITY } from
  "./root-rewrite-vocabulary.ts";

declare const kpVerifiedCompoundRootCarrierExemplarBrand: unique symbol;

export const KP_COMPOUND_ROOT_CARRIER_EXEMPLAR_ID =
  "exemplar.root.compound-carrier.x-plus-one" as const;

export interface KpCompoundRootCarrierSourceState {
  readonly id: "state.root.compound-carrier.source";
  readonly kind: "radical-perfect-square";
  readonly latex: "\\sqrt{(x+1)^2}";
  readonly accessibleText: string;
  readonly radical: KpRootRewriteOccurrence;
  readonly radicand: KpRootRewriteOccurrence;
  readonly power: KpRootRewriteOccurrence;
  readonly grouping: KpRootRewriteOccurrence;
  readonly exponent: KpRootRewriteOccurrence;
  readonly carrier: KpRootSemanticSubtreeNode;
}

export interface KpCompoundRootCarrierTargetState {
  readonly id: "state.root.compound-carrier.target";
  readonly kind: "absolute-value";
  readonly latex: "\\lvert x+1 \\rvert";
  readonly accessibleText: string;
  readonly absoluteValue: KpRootRewriteOccurrence;
  readonly carrier: KpRootSemanticSubtreeNode;
}

export type KpVerifiedCompoundRootCarrierExemplar = Readonly<{
  schemaVersion: "kp.compound-root-carrier-exemplar.v1";
  kind: "verified-compound-root-carrier-exemplar";
  id: typeof KP_COMPOUND_ROOT_CARRIER_EXEMPLAR_ID;
  lawAuthority: Readonly<{
    id: "law.real.principal-square-root-of-square";
    authorityRefId: string;
    resultForm: "absolute-value";
  }>;
  domainEvidence: Readonly<{
    carrierDomain: "real";
    carrierRealEvidenceId: string;
  }>;
  states: readonly [KpCompoundRootCarrierSourceState,
    KpCompoundRootCarrierTargetState];
  plan: KpVerifiedRootRewritePlan;
  subtreeCertificate: KpRootPersistentSubtreeCertificate;
  readonly [kpVerifiedCompoundRootCarrierExemplarBrand]: true;
}>;

const verifiedExemplars = new WeakSet<object>();

export function createKpCompoundRootCarrierExemplar():
  KpVerifiedCompoundRootCarrierExemplar {
  const source = sourceState();
  const target = targetState();
  const planResult = compileKpRootRewritePlan({
    schemaVersion: "kp.root-rewrite-plan-draft.v1",
    id: "plan.root.compound-carrier.x-plus-one",
    operationClass: "compound-carrier-normalization",
    vocabularyAuthority: KP_ROOT_REWRITE_VOCABULARY_AUTHORITY,
    sourceStateId: source.id,
    targetStateId: target.id,
    roleBindings: {
      "source-radical": source.radical,
      "source-exponent": source.exponent,
      "source-carrier": source.carrier.occurrence,
      "target-carrier": target.carrier.occurrence,
      "target-absolute-value-enclosure": target.absoluteValue
    },
    evidence: {
      "even-positive-integer-power": "evidence.root.x-plus-one.square",
      "real-valued-carrier": "evidence.root.x-plus-one.real"
    },
    priorOperationIds: []
  });
  if (planResult.status !== "verified") {
    throw new Error("Compound root exemplar unexpectedly produced a gap.");
  }
  const subtreeCertificate = certifyKpRootPersistentSubtree({
    id: "certificate.root.x-plus-one.persistence",
    plan: planResult.plan,
    source: source.carrier,
    target: target.carrier
  });
  const exemplar = deepFreeze({
    schemaVersion: "kp.compound-root-carrier-exemplar.v1" as const,
    kind: "verified-compound-root-carrier-exemplar" as const,
    id: KP_COMPOUND_ROOT_CARRIER_EXEMPLAR_ID,
    lawAuthority: {
      id: "law.real.principal-square-root-of-square" as const,
      authorityRefId: "definition.absolute-value.principal-square-root",
      resultForm: "absolute-value" as const
    },
    domainEvidence: {
      carrierDomain: "real" as const,
      carrierRealEvidenceId: "evidence.root.x-plus-one.real"
    },
    states: [source, target] as const,
    plan: planResult.plan,
    subtreeCertificate
  }) as unknown as KpVerifiedCompoundRootCarrierExemplar;
  verifiedExemplars.add(exemplar);
  return exemplar;
}

export function isKpVerifiedCompoundRootCarrierExemplar(
  value: unknown
): value is KpVerifiedCompoundRootCarrierExemplar {
  return typeof value === "object" && value !== null &&
    verifiedExemplars.has(value) &&
    isKpVerifiedRootRewritePlan(
      (value as KpVerifiedCompoundRootCarrierExemplar).plan
    ) &&
    isKpRootPersistentSubtreeCertificate(
      (value as KpVerifiedCompoundRootCarrierExemplar).subtreeCertificate
    );
}

export const kpCompoundRootCarrierExemplar =
  createKpCompoundRootCarrierExemplar();

function sourceState(): KpCompoundRootCarrierSourceState {
  return deepFreeze({
    id: "state.root.compound-carrier.source" as const,
    kind: "radical-perfect-square" as const,
    latex: "\\sqrt{(x+1)^2}" as const,
    accessibleText: "the square root of the square of x plus one",
    radical: occurrence("source.radical", "semantic.operator.square-root",
      "subtree.source.radical", "operator"),
    radicand: occurrence("source.radicand", "semantic.perfect-square",
      "subtree.source.radicand", "compound"),
    power: occurrence("source.power", "semantic.perfect-square",
      "subtree.source.power", "compound"),
    grouping: occurrence("source.grouping", "semantic.grouping.source",
      "subtree.source.grouping", "enclosure"),
    exponent: occurrence("source.exponent", "semantic.exponent.two",
      "subtree.exponent.two", "atomic"),
    carrier: carrierSubtree("source")
  });
}

function targetState(): KpCompoundRootCarrierTargetState {
  return deepFreeze({
    id: "state.root.compound-carrier.target" as const,
    kind: "absolute-value" as const,
    latex: "\\lvert x+1 \\rvert" as const,
    accessibleText: "the absolute value of x plus one",
    absoluteValue: occurrence("target.absolute-value",
      "semantic.operator.absolute-value", "subtree.target.absolute-value",
      "enclosure"),
    carrier: carrierSubtree("target")
  });
}

function carrierSubtree(prefix: "source" | "target"):
  KpRootSemanticSubtreeNode {
  return deepFreeze({
    occurrence: occurrence(`${prefix}.carrier`, "semantic.expression.x-plus-one",
      "subtree.expression.x-plus-one", "compound"),
    children: [
      leaf(`${prefix}.x`, "semantic.variable.x", "subtree.variable.x",
        "atomic"),
      leaf(`${prefix}.plus`, "semantic.operator.plus", "subtree.operator.plus",
        "operator"),
      leaf(`${prefix}.one`, "semantic.value.one", "subtree.value.one",
        "value")
    ]
  });
}

function leaf(
  entityId: string,
  semanticId: string,
  subtreeId: string,
  subtreeKind: KpRootRewriteOccurrence["subtreeKind"]
): KpRootSemanticSubtreeNode {
  return { occurrence: occurrence(entityId, semanticId, subtreeId,
    subtreeKind), children: [] };
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

