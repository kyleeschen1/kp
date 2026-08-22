import {
  compileKpStateRetentionProjection,
  isKpVerifiedStateRetentionProjection,
  type KpVerifiedStateRetentionProjection
} from "../domain-ir/state-retention-projection.ts";
import {
  KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID,
  KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
  KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID,
  kpCanonicalFiniteSumExpansionOperation
} from "./canonical-finite-sum-expansion.ts";

declare const kpVerifiedFiniteSumEquivalenceFrameBrand: unique symbol;

export const kpFiniteSumEquivalenceFrameOccurrenceIds = Object.freeze({
  source: "occurrence.finite-sum-equivalence.source",
  relation: "occurrence.finite-sum-equivalence.relation",
  target: "occurrence.finite-sum-equivalence.target"
} as const);

export type KpVerifiedFiniteSumEquivalenceFrame = Readonly<{
  schemaVersion: "kp.finite-sum-equivalence-frame.v1";
  kind: "verified-finite-sum-equivalence-frame";
  operationId: string;
  sourceLatex: typeof KP_CANONICAL_FINITE_SUM_SOURCE_LATEX;
  relationLatex: "=";
  targetLatex: typeof KP_CANONICAL_FINITE_SUM_TARGET_LATEX;
  projection: KpVerifiedStateRetentionProjection;
  readonly [kpVerifiedFiniteSumEquivalenceFrameBrand]: true;
}>;

const verifiedFrames = new WeakSet<object>();

/**
 * The equation frame retains a frozen representation of the source while a
 * distinct live occurrence constructs the target. This is representation
 * topology, not a claim that one semantic occurrence occupies two places.
 */
export function createKpFiniteSumEquivalenceFrame():
KpVerifiedFiniteSumEquivalenceFrame {
  const operation = kpCanonicalFiniteSumExpansionOperation;
  const expressionReferentId = "referent.finite-sum.equivalent-expression";
  const relationReferentId = "referent.finite-sum.equality";
  const projection = compileKpStateRetentionProjection({
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.finite-sum.equivalence-frame",
    policy: "equivalence-frame",
    semanticTransitionId: operation.operation,
    referents: [{
      id: expressionReferentId,
      meaningId: "meaning.finite-sum-expansion-equivalence"
    }, {
      id: relationReferentId,
      meaningId: "meaning.equality"
    }],
    sourceOccurrence: {
      id: kpFiniteSumEquivalenceFrameOccurrenceIds.source,
      stateId: KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID,
      kind: "source-state",
      referentIds: [expressionReferentId]
    },
    relationOccurrence: {
      id: kpFiniteSumEquivalenceFrameOccurrenceIds.relation,
      stateId: "finite-sum.relation.equality",
      kind: "relation",
      referentIds: [relationReferentId]
    },
    targetOccurrence: {
      id: kpFiniteSumEquivalenceFrameOccurrenceIds.target,
      stateId: KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID,
      kind: "target-state",
      referentIds: [expressionReferentId]
    },
    selectedOccurrenceId: kpFiniteSumEquivalenceFrameOccurrenceIds.target,
    historicalSnapshots: []
  });
  const frame = Object.freeze({
    schemaVersion: "kp.finite-sum-equivalence-frame.v1" as const,
    kind: "verified-finite-sum-equivalence-frame" as const,
    operationId: operation.operation,
    sourceLatex: KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
    relationLatex: "=" as const,
    targetLatex: KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
    projection
  }) as unknown as KpVerifiedFiniteSumEquivalenceFrame;
  verifiedFrames.add(frame);
  return frame;
}

export function isKpVerifiedFiniteSumEquivalenceFrame(
  value: unknown
): value is KpVerifiedFiniteSumEquivalenceFrame {
  return typeof value === "object" && value !== null &&
    verifiedFrames.has(value) &&
    isKpVerifiedStateRetentionProjection(
      (value as KpVerifiedFiniteSumEquivalenceFrame).projection
    );
}

export const kpFiniteSumEquivalenceFrame =
  createKpFiniteSumEquivalenceFrame();
