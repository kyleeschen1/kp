import type { KpSchemePedagogicalScore } from
  "../semantic/scheme-factorial-pedagogical-score.ts";
import type {
  KpSchemeBranchSelectedEvent,
  KpSchemePrimitiveAppliedEvent,
  KpSchemeTrace
} from "../semantic/scheme-factorial-trace.ts";

export interface KpSchemeBranchMotif {
  readonly id: string;
  readonly kind: "branch-decision";
  readonly eventId: string;
  readonly branch: "consequent" | "alternative";
  readonly selectedExpressionId: string;
  readonly dormantExpressionId: string;
  readonly dormantTreatment: "collapse-to-particles";
}

export interface KpSchemePrimitiveMotif {
  readonly id: string;
  readonly kind: "trusted-local-reduction";
  readonly eventId: string;
  readonly primitive: "=" | "-" | "*";
  readonly applicationExpressionId: string;
  readonly argumentValueIds: readonly string[];
  readonly resultValueId: string;
  readonly expansion: "local-only";
}

export interface KpSchemeSummaryMotif {
  readonly id: "scheme-factorial.motif.repeated-descent-summary";
  readonly kind: "semantic-summary";
  readonly beatId: string;
  readonly eventIds: readonly string[];
  readonly callSuspensionEventIds: readonly string[];
  readonly parameterBindingEventIds: readonly string[];
  readonly representation: "stacked-recursion-rhythm";
}

export interface KpSchemeEvaluationMotifs {
  readonly schemaVersion: "kp.scheme-factorial-evaluation-motifs.v1";
  readonly branches: readonly KpSchemeBranchMotif[];
  readonly primitives: readonly KpSchemePrimitiveMotif[];
  readonly summary: KpSchemeSummaryMotif;
}

export interface KpSchemeBranchMotifSample {
  readonly progress: number;
  readonly predicateEmphasis: number;
  readonly selectedEmphasis: number;
  readonly dormantParticleProgress: number;
}

export interface KpSchemePrimitiveMotifSample {
  readonly progress: number;
  readonly inputGatherProgress: number;
  readonly operatorPulse: number;
  readonly resultRevealProgress: number;
}

export interface KpSchemeSummaryMotifSample {
  readonly progress: number;
  readonly completedRepetitions: number;
  readonly activeRepetitionProgress: number;
}

export function compileKpSchemeFactorialEvaluationMotifs(input: {
  readonly trace: KpSchemeTrace;
  readonly score: KpSchemePedagogicalScore;
}): KpSchemeEvaluationMotifs {
  const branches = input.trace.events
    .filter((event): event is KpSchemeBranchSelectedEvent =>
      event.kind === "branch-selected")
    .map((event, index) => Object.freeze({
      id: `scheme-factorial.motif.branch.${index}`,
      kind: "branch-decision" as const,
      eventId: event.id,
      branch: event.branch,
      selectedExpressionId: event.selectedExpressionId,
      dormantExpressionId: event.dormantExpressionId,
      dormantTreatment: "collapse-to-particles" as const
    }));
  const primitives = input.trace.events
    .filter((event): event is KpSchemePrimitiveAppliedEvent =>
      event.kind === "primitive-applied")
    .map((event) => Object.freeze({
      id: `scheme-factorial.motif.primitive.${event.index}`,
      kind: "trusted-local-reduction" as const,
      eventId: event.id,
      primitive: event.primitive,
      applicationExpressionId: event.applicationExpressionId,
      argumentValueIds: event.argumentValueIds,
      resultValueId: event.resultValueId,
      expansion: "local-only" as const
    }));
  const beat = input.score.beats.find(({ id }) =>
    id.endsWith("repeated-descent"));
  if (beat === undefined || beat.kind !== "summary") {
    throw new Error("Factorial score requires its repeated-descent summary beat.");
  }
  const scoredEvents = beat.eventIds.map((id) => {
    const event = input.trace.events.find((candidate) => candidate.id === id);
    if (event === undefined) throw new Error(`Unknown summary event ${id}.`);
    return event;
  });
  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-evaluation-motifs.v1",
    branches: Object.freeze(branches),
    primitives: Object.freeze(primitives),
    summary: Object.freeze({
      id: "scheme-factorial.motif.repeated-descent-summary",
      kind: "semantic-summary",
      beatId: beat.id,
      eventIds: beat.eventIds,
      callSuspensionEventIds: Object.freeze(scoredEvents.filter(({ kind }) =>
        kind === "call-suspended").map(({ id }) => id)),
      parameterBindingEventIds: Object.freeze(scoredEvents.filter(({ kind }) =>
        kind === "parameter-bound").map(({ id }) => id)),
      representation: "stacked-recursion-rhythm"
    })
  });
}

export function sampleKpSchemeBranchMotif(progress: number):
  KpSchemeBranchMotifSample {
  const value = clamp(progress);
  return Object.freeze({
    progress: value,
    predicateEmphasis: interval(value, 0, 0.35),
    selectedEmphasis: interval(value, 0.3, 0.68),
    dormantParticleProgress: interval(value, 0.55, 1)
  });
}

export function sampleKpSchemePrimitiveMotif(progress: number):
  KpSchemePrimitiveMotifSample {
  const value = clamp(progress);
  const pulseProgress = interval(value, 0.34, 0.72);
  return Object.freeze({
    progress: value,
    inputGatherProgress: interval(value, 0, 0.48),
    operatorPulse: round(Math.sin(pulseProgress * Math.PI)),
    resultRevealProgress: interval(value, 0.62, 1)
  });
}

export function sampleKpSchemeSummaryMotif(
  summary: KpSchemeSummaryMotif,
  progress: number
): KpSchemeSummaryMotifSample {
  const value = clamp(progress);
  const count = summary.callSuspensionEventIds.length;
  const scaled = value * count;
  return Object.freeze({
    progress: value,
    completedRepetitions: Math.min(count, Math.floor(scaled)),
    activeRepetitionProgress: value === 1 ? 1 : round(scaled % 1)
  });
}

function interval(value: number, start: number, end: number): number {
  return round(Math.max(0, Math.min(1, (value - start) / (end - start))));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme evaluation motif progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
