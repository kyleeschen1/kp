import {
  compileKpStateRetentionProjection,
  isKpVerifiedStateRetentionProjection,
  type KpVerifiedStateRetentionProjection
} from "../domain-ir/state-retention-projection.ts";
import { kpCanonicalCompiledLogProductOperation } from
  "./log-product-transformation-compiler.ts";

declare const kpVerifiedLogProductEquivalenceFrameBrand: unique symbol;

export const KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID =
  "animation.algebra.log-product.equivalence-frame" as const;

export const kpLogProductEquivalenceFrameOccurrenceIds = Object.freeze({
  source: "occurrence.log-product-equivalence.source",
  relation: "occurrence.log-product-equivalence.relation",
  target: "occurrence.log-product-equivalence.target"
} as const);

export type KpVerifiedLogProductEquivalenceFrame = Readonly<{
  schemaVersion: "kp.log-product-equivalence-frame.v1";
  kind: "verified-log-product-equivalence-frame";
  animationId: typeof KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID;
  operationId: string;
  sourceLatex: string;
  relationLatex: "=";
  targetLatex: string;
  projection: KpVerifiedStateRetentionProjection;
  readonly [kpVerifiedLogProductEquivalenceFrameBrand]: true;
}>;

const verifiedFrames = new WeakSet<object>();

export function createKpLogProductEquivalenceFrame():
KpVerifiedLogProductEquivalenceFrame {
  const operation = kpCanonicalCompiledLogProductOperation;
  const { source, target } = operation.contract;
  const expressionReferentId = "referent.log-product.equivalent-expression";
  const relationReferentId = "referent.log-product.equality";
  const projection = compileKpStateRetentionProjection({
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.log-product.equivalence-frame",
    policy: "equivalence-frame",
    semanticTransitionId: operation.transformation.id,
    referents: [{
      id: expressionReferentId,
      meaningId: "meaning.logarithm-product-law-equivalence"
    }, {
      id: relationReferentId,
      meaningId: "meaning.equality"
    }],
    sourceOccurrence: {
      id: kpLogProductEquivalenceFrameOccurrenceIds.source,
      stateId: source.id,
      kind: "source-state",
      referentIds: [expressionReferentId]
    },
    relationOccurrence: {
      id: kpLogProductEquivalenceFrameOccurrenceIds.relation,
      stateId: "state.log-product-equivalence.relation",
      kind: "relation",
      referentIds: [relationReferentId]
    },
    targetOccurrence: {
      id: kpLogProductEquivalenceFrameOccurrenceIds.target,
      stateId: target.id,
      kind: "target-state",
      referentIds: [expressionReferentId]
    },
    selectedOccurrenceId: kpLogProductEquivalenceFrameOccurrenceIds.target,
    historicalSnapshots: []
  });
  const frame = Object.freeze({
    schemaVersion: "kp.log-product-equivalence-frame.v1" as const,
    kind: "verified-log-product-equivalence-frame" as const,
    animationId: KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
    operationId: operation.transformation.id,
    sourceLatex: source.latex,
    relationLatex: "=" as const,
    targetLatex: target.latex,
    projection
  }) as KpVerifiedLogProductEquivalenceFrame;
  verifiedFrames.add(frame);
  return frame;
}

export function isKpVerifiedLogProductEquivalenceFrame(
  value: unknown
): value is KpVerifiedLogProductEquivalenceFrame {
  return typeof value === "object" && value !== null &&
    verifiedFrames.has(value) &&
    isKpVerifiedStateRetentionProjection(
      (value as KpVerifiedLogProductEquivalenceFrame).projection
    );
}

export const kpLogProductEquivalenceFrame =
  createKpLogProductEquivalenceFrame();
