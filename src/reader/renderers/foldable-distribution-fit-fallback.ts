import {
  createKpFoldableDistributionFoldIntent
} from "../../semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionAdaptiveProjection,
  type KpFoldableDistributionProjection
} from "../../semantic/foldable-distribution-fold-projection.ts";
import {
  compileKpFoldableDistributionFoldTimeline
} from "../../semantic/foldable-distribution-fold-timeline.ts";
import {
  planKpFoldableDistributionLayout,
  type KpFoldableDistributionLayoutIntent,
  type KpFoldableDistributionPhaseLayout,
  type KpFoldableDistributionViewport
} from "../runtime/public-api.ts";
import type {
  KpEquationStagePhaseIntent
} from "../runtime/public-api.ts";
import type {
  KpReaderCertifiedEquationStageFitResult,
  KpReaderCertifiedEquationStageResponsiveFitPlan
} from "./equation-responsive-fit.ts";

export type KpFoldableDistributionFitFallbackStrategy =
  | "requested"
  | "semantic-stage"
  | "semantic-fold"
  | "semantic-condense";

export interface KpFoldableDistributionFitFallbackPreservation {
  readonly timelineId: "timeline.foldable-distribution.shared";
  readonly phaseNodeIds: readonly string[];
  readonly operationIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly accessibilityContentIds: readonly string[];
}

export interface KpFoldableDistributionFitFallbackCandidate {
  readonly id: string;
  readonly strategy: KpFoldableDistributionFitFallbackStrategy;
  readonly projection: KpFoldableDistributionProjection;
  readonly layoutIntent: KpFoldableDistributionLayoutIntent;
  readonly preservation: KpFoldableDistributionFitFallbackPreservation;
}

export interface KpFoldableDistributionFitFallbackPlan {
  readonly schemaVersion: "kp.foldable-distribution-fit-fallback.v1";
  readonly candidates: readonly KpFoldableDistributionFitFallbackCandidate[];
  readonly preservation: KpFoldableDistributionFitFallbackPreservation;
  readonly wrapAllowed: false;
  readonly operationSpecificCoordinates: false;
  readonly timelineAuthority: "timeline.foldable-distribution.shared";
}

export interface KpFoldableDistributionFitFallbackAssessment {
  readonly candidateId: string;
  readonly phaseResults: readonly KpReaderCertifiedEquationStageFitResult[];
}

export interface KpFoldableDistributionFitFallbackSatisfied {
  readonly kind: "satisfied";
  readonly candidate: KpFoldableDistributionFitFallbackCandidate;
  readonly phaseFits: readonly KpReaderCertifiedEquationStageResponsiveFitPlan[];
  readonly attemptedCandidateIds: readonly string[];
}

export interface KpFoldableDistributionFitFallbackUnsatisfied {
  readonly kind: "unsatisfied";
  readonly reason: "no-readable-semantic-fallback";
  readonly attemptedCandidateIds: readonly string[];
}

export type KpFoldableDistributionFitFallbackResolution =
  | KpFoldableDistributionFitFallbackSatisfied
  | KpFoldableDistributionFitFallbackUnsatisfied;

/**
 * Fallback changes only semantic disclosure density and row staging. Every
 * candidate retains the same tree, operations, checkpoints, and transcript IDs.
 */
export function planKpFoldableDistributionFitFallback(input: {
  readonly projection: KpFoldableDistributionProjection;
  readonly viewport: KpFoldableDistributionViewport;
}): KpFoldableDistributionFitFallbackPlan {
  const requested = candidate(
    "requested",
    input.projection,
    input.viewport
  );
  const candidates = [requested];
  if (input.viewport === "wide") {
    candidates.push(candidate(
      "semantic-stage",
      input.projection,
      "phone"
    ));
  }

  const automaticIntent = createKpFoldableDistributionFoldIntent({
    mode: "automatic"
  });
  const requiredExpanded = input.projection.mode === "pinned"
    ? new Set(input.projection.expandedNodeIds)
    : new Set<string>();
  const foldCandidates = [
    {
      strategy: "semantic-fold" as const,
      detailBudget: "balanced" as const
    },
    {
      strategy: "semantic-condense" as const,
      detailBudget: "compact" as const
    }
  ];
  for (const { strategy, detailBudget } of foldCandidates) {
    const projection = compileKpFoldableDistributionAdaptiveProjection({
      intent: automaticIntent,
      detailBudget
    });
    const preservesPins = [...requiredExpanded].every((nodeId) =>
      projection.expandedNodeIds.includes(nodeId)
    );
    if (
      preservesPins &&
      projection.expandedNodeIds.length < input.projection.expandedNodeIds.length
    ) {
      candidates.push(candidate(strategy, projection, "phone"));
    }
  }

  const deduplicated = deduplicateCandidates(candidates);
  const preservation = requested.preservation;
  for (const next of deduplicated) {
    assertPreservationEquivalent(preservation, next.preservation);
  }
  return Object.freeze({
    schemaVersion: "kp.foldable-distribution-fit-fallback.v1" as const,
    candidates: Object.freeze(deduplicated),
    preservation,
    wrapAllowed: false as const,
    operationSpecificCoordinates: false as const,
    timelineAuthority: "timeline.foldable-distribution.shared" as const
  });
}

export function resolveKpFoldableDistributionFitFallback(input: {
  readonly plan: KpFoldableDistributionFitFallbackPlan;
  readonly assessments:
    readonly KpFoldableDistributionFitFallbackAssessment[];
}): KpFoldableDistributionFitFallbackResolution {
  const assessmentById = exactAssessments(input.plan, input.assessments);
  const attemptedCandidateIds: string[] = [];
  for (const candidate of input.plan.candidates) {
    attemptedCandidateIds.push(candidate.id);
    const assessment = assessmentById.get(candidate.id)!;
    const phaseFits = exactPhaseFits(candidate, assessment.phaseResults);
    if (phaseFits !== undefined) {
      return Object.freeze({
        kind: "satisfied" as const,
        candidate,
        phaseFits,
        attemptedCandidateIds: Object.freeze([...attemptedCandidateIds])
      });
    }
  }
  return Object.freeze({
    kind: "unsatisfied" as const,
    reason: "no-readable-semantic-fallback" as const,
    attemptedCandidateIds: Object.freeze([...attemptedCandidateIds])
  });
}

function candidate(
  strategy: KpFoldableDistributionFitFallbackStrategy,
  projection: KpFoldableDistributionProjection,
  viewport: KpFoldableDistributionViewport
): KpFoldableDistributionFitFallbackCandidate {
  const layoutIntent = planKpFoldableDistributionLayout({
    projection,
    viewport
  });
  return Object.freeze({
    id: `fit-fallback.foldable-distribution.${strategy}`,
    strategy,
    projection,
    layoutIntent,
    preservation: preservation(projection)
  });
}

function preservation(
  projection: KpFoldableDistributionProjection
): KpFoldableDistributionFitFallbackPreservation {
  const timeline = compileKpFoldableDistributionFoldTimeline(projection);
  const phaseNodeIds = timeline.phases.map(({ nodeId }) => nodeId);
  const operationIds = timeline.phases.flatMap(
    ({ operationIds: ids }) => ids
  );
  const checkpointIds = Object.keys(timeline.checkpoints);
  return Object.freeze({
    timelineId: timeline.id,
    phaseNodeIds: Object.freeze(phaseNodeIds),
    operationIds: Object.freeze(operationIds),
    checkpointIds: Object.freeze(checkpointIds),
    accessibilityContentIds: Object.freeze([
      ...checkpointIds.map((id) => `checkpoint.${id}`),
      ...operationIds.map((id) => `operation.${id}`)
    ])
  });
}

function deduplicateCandidates(
  candidates: readonly KpFoldableDistributionFitFallbackCandidate[]
): KpFoldableDistributionFitFallbackCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = [
      candidate.layoutIntent.viewport,
      candidate.projection.expandedNodeIds.join(","),
      candidate.projection.collapsedNodeIds.join(",")
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assertPreservationEquivalent(
  expected: KpFoldableDistributionFitFallbackPreservation,
  actual: KpFoldableDistributionFitFallbackPreservation
): void {
  for (const key of [
    "phaseNodeIds",
    "operationIds",
    "checkpointIds",
    "accessibilityContentIds"
  ] as const) {
    if (!sameStrings(expected[key], actual[key])) {
      throw new Error(`Fit fallback changed ${key}.`);
    }
  }
  if (expected.timelineId !== actual.timelineId) {
    throw new Error("Fit fallback changed timeline authority.");
  }
}

function exactAssessments(
  plan: KpFoldableDistributionFitFallbackPlan,
  assessments: readonly KpFoldableDistributionFitFallbackAssessment[]
): ReadonlyMap<string, KpFoldableDistributionFitFallbackAssessment> {
  const expected = new Set(plan.candidates.map(({ id }) => id));
  const byId = new Map<string, KpFoldableDistributionFitFallbackAssessment>();
  for (const assessment of assessments) {
    if (!expected.has(assessment.candidateId)) {
      throw new Error(
        `Fit fallback assessment names unknown candidate ${assessment.candidateId}.`
      );
    }
    if (byId.has(assessment.candidateId)) {
      throw new Error(
        `Fit fallback repeats assessment ${assessment.candidateId}.`
      );
    }
    byId.set(assessment.candidateId, assessment);
  }
  if (byId.size !== expected.size) {
    const missing = [...expected].find((id) => !byId.has(id));
    throw new Error(`Fit fallback is missing assessment ${missing}.`);
  }
  return byId;
}

function exactPhaseFits(
  candidate: KpFoldableDistributionFitFallbackCandidate,
  results: readonly KpReaderCertifiedEquationStageFitResult[]
): readonly KpReaderCertifiedEquationStageResponsiveFitPlan[] | undefined {
  const phaseById = new Map(
    candidate.layoutIntent.phases.map((phase) => [phase.nodeId, phase])
  );
  const seen = new Set<string>();
  const fits: KpReaderCertifiedEquationStageResponsiveFitPlan[] = [];
  for (const result of results) {
    const layout = result.kind === "satisfied"
      ? result.fit.stageLayout
      : result.layout;
    const nodeId = layout.measuredInput.intent.nodeId;
    const phase = phaseById.get(nodeId);
    if (phase === undefined) {
      throw new Error(
        `Fit fallback result names unknown phase ${nodeId}.`
      );
    }
    if (seen.has(nodeId)) {
      throw new Error(`Fit fallback repeats phase result ${nodeId}.`);
    }
    assertPhaseIntentEquivalent(phase, layout.measuredInput.intent);
    seen.add(nodeId);
    if (result.kind === "satisfied") fits.push(result.fit);
  }
  if (seen.size !== phaseById.size) {
    const missing = [...phaseById.keys()].find((id) => !seen.has(id));
    throw new Error(`Fit fallback is missing phase result ${missing}.`);
  }
  return fits.length === phaseById.size
    ? Object.freeze(fits)
    : undefined;
}

function assertPhaseIntentEquivalent(
  expected: KpFoldableDistributionPhaseLayout,
  actual: KpEquationStagePhaseIntent
): void {
  if (
    expected.policy !== actual.policy ||
    expected.rows.length !== actual.rows.length
  ) {
    throw new Error(`Fit fallback changed phase layout ${expected.nodeId}.`);
  }
  for (let index = 0; index < expected.rows.length; index += 1) {
    const expectedRow = expected.rows[index]!;
    const actualRow = actual.rows[index]!;
    if (
      expectedRow.id !== actualRow.id ||
      expectedRow.role !== actualRow.role ||
      !sameStrings(expectedRow.envelopeIds, actualRow.envelopeIds)
    ) {
      throw new Error(`Fit fallback changed row ${expectedRow.id}.`);
    }
  }
}

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
