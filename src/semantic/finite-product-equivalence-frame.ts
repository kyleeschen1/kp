import {
  compileKpStateRetentionProjection,
  isKpVerifiedStateRetentionProjection,
  type KpVerifiedStateRetentionProjection
} from "../domain-ir/state-retention-projection.ts";
import {
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID,
  kpCanonicalFiniteProductExpansionOperation
} from "./canonical-finite-product-expansion.ts";

declare const kpVerifiedFiniteProductEquivalenceFrameBrand: unique symbol;

export const kpFiniteProductEquivalenceFrameOccurrenceIds = Object.freeze({
  source: "occurrence.finite-product-equivalence.source",
  relation: "occurrence.finite-product-equivalence.relation",
  target: "occurrence.finite-product-equivalence.target"
} as const);

export type KpVerifiedFiniteProductEquivalenceFrame = Readonly<{
  schemaVersion: "kp.finite-product-equivalence-frame.v1";
  kind: "verified-finite-product-equivalence-frame";
  operationId: string;
  sourceLatex: typeof KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX;
  relationLatex: "=";
  targetLatex: typeof KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX;
  projection: KpVerifiedStateRetentionProjection;
  readonly [kpVerifiedFiniteProductEquivalenceFrameBrand]: true;
}>;

const verifiedFrames = new WeakSet<object>();

export function createKpFiniteProductEquivalenceFrame():
KpVerifiedFiniteProductEquivalenceFrame {
  const operation = kpCanonicalFiniteProductExpansionOperation;
  const expressionReferentId =
    "referent.finite-product.equivalent-expression";
  const projection = compileKpStateRetentionProjection({
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.finite-product.equivalence-frame",
    policy: "equivalence-frame",
    semanticTransitionId: operation.operation,
    referents: [{
      id: expressionReferentId,
      meaningId: "meaning.finite-product-expansion-equivalence"
    }, {
      id: "referent.finite-product.equality",
      meaningId: "meaning.equality"
    }],
    sourceOccurrence: {
      id: kpFiniteProductEquivalenceFrameOccurrenceIds.source,
      stateId: KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID,
      kind: "source-state",
      referentIds: [expressionReferentId]
    },
    relationOccurrence: {
      id: kpFiniteProductEquivalenceFrameOccurrenceIds.relation,
      stateId: "finite-product.relation.equality",
      kind: "relation",
      referentIds: ["referent.finite-product.equality"]
    },
    targetOccurrence: {
      id: kpFiniteProductEquivalenceFrameOccurrenceIds.target,
      stateId: KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID,
      kind: "target-state",
      referentIds: [expressionReferentId]
    },
    selectedOccurrenceId: kpFiniteProductEquivalenceFrameOccurrenceIds.target,
    historicalSnapshots: []
  });
  const frame = Object.freeze({
    schemaVersion: "kp.finite-product-equivalence-frame.v1" as const,
    kind: "verified-finite-product-equivalence-frame" as const,
    operationId: operation.operation,
    sourceLatex: KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
    relationLatex: "=" as const,
    targetLatex: KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
    projection
  }) as unknown as KpVerifiedFiniteProductEquivalenceFrame;
  verifiedFrames.add(frame);
  return frame;
}

export function isKpVerifiedFiniteProductEquivalenceFrame(
  value: unknown
): value is KpVerifiedFiniteProductEquivalenceFrame {
  return typeof value === "object" && value !== null &&
    verifiedFrames.has(value) &&
    isKpVerifiedStateRetentionProjection(
      (value as KpVerifiedFiniteProductEquivalenceFrame).projection
    );
}

export const kpFiniteProductEquivalenceFrame =
  createKpFiniteProductEquivalenceFrame();
