import {
  collectKpSchemeSourceExpressions,
  type KpSchemeSourceDocument
} from "./scheme-factorial-source-model.ts";
import type { KpSchemeTrace } from "./scheme-factorial-trace.ts";

export type KpSchemeScoreHold = "none" | "reading" | "inspection";
export type KpSchemeScoreBeatKind = "detail" | "summary";

export type KpSchemeScoreFocusTarget =
  | { readonly kind: "source-expression"; readonly id: string }
  | { readonly kind: "event"; readonly id: string }
  | { readonly kind: "value"; readonly id: string }
  | { readonly kind: "binding"; readonly id: string }
  | { readonly kind: "continuation"; readonly id: string };

export interface KpSchemeScoreBeat {
  readonly id: string;
  readonly kind: KpSchemeScoreBeatKind;
  readonly eventIds: readonly string[];
  readonly caption: string;
  readonly hold: KpSchemeScoreHold;
  readonly focus: readonly KpSchemeScoreFocusTarget[];
}

export interface KpSchemeScoreOmission {
  readonly eventId: string;
  readonly rationale: "mechanical" | "redundant" | "outside-claim";
  readonly note: string;
}

export interface KpSchemePedagogicalScore {
  readonly schemaVersion: "kp.scheme-pedagogical-score.v1";
  readonly id: string;
  readonly traceDocumentId: string;
  readonly beats: readonly KpSchemeScoreBeat[];
  readonly omissions: readonly KpSchemeScoreOmission[];
}

export interface KpSchemeScoreIssue {
  readonly path: string;
  readonly message: string;
}

export function defineKpSchemePedagogicalScore(
  document: KpSchemeSourceDocument,
  trace: KpSchemeTrace,
  input: KpSchemePedagogicalScore
): KpSchemePedagogicalScore {
  const score = freezeScore(input);
  const issues = validateKpSchemePedagogicalScore(document, trace, score);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) =>
      `${path}: ${message}`).join("\n"));
  }
  return score;
}

export function validateKpSchemePedagogicalScore(
  document: KpSchemeSourceDocument,
  trace: KpSchemeTrace,
  score: KpSchemePedagogicalScore
): readonly KpSchemeScoreIssue[] {
  const issues: KpSchemeScoreIssue[] = [];
  if (score.schemaVersion !== "kp.scheme-pedagogical-score.v1") {
    issues.push(issue("schemaVersion", "unsupported pedagogical score schema"));
  }
  if (score.id.trim().length === 0) {
    issues.push(issue("id", "score ID must not be empty"));
  }
  if (score.traceDocumentId !== trace.documentId ||
      score.traceDocumentId !== document.id) {
    issues.push(issue("traceDocumentId",
      "score must name the exact trace source document"));
  }

  const events = new Map(trace.events.map((event) => [event.id, event]));
  const eventIndices = new Map(trace.events.map((event) =>
    [event.id, event.index]));
  const sourceIds = new Set(
    collectKpSchemeSourceExpressions(document).map(({ id }) => id)
  );
  const valueIds = new Set(trace.snapshots.flatMap(({ state }) =>
    state.values.map(({ id }) => id)));
  const bindingIds = new Set(trace.snapshots.flatMap(({ state }) =>
    state.environments.flatMap(({ bindings }) => bindings.map(({ id }) => id))));
  const continuationIds = new Set(trace.snapshots.flatMap(({ state }) =>
    state.continuations.map(({ id }) => id)));
  const beatIds = new Set<string>();
  const selectedEventIds: string[] = [];

  score.beats.forEach((beat, beatIndex) => {
    const path = `beats[${beatIndex}]`;
    if (beat.id.trim().length === 0 || beatIds.has(beat.id)) {
      issues.push(issue(`${path}.id`, "beat IDs must be non-empty and unique"));
    }
    beatIds.add(beat.id);
    if (beat.caption.trim().length === 0) {
      issues.push(issue(`${path}.caption`, "beat caption must not be empty"));
    }
    if (beat.eventIds.length === 0) {
      issues.push(issue(`${path}.eventIds`, "beats must select at least one event"));
    }
    if (beat.kind === "summary" && beat.eventIds.length < 2) {
      issues.push(issue(`${path}.eventIds`,
        "summary beats must group at least two factual events"));
    }
    const localEvents = new Set<string>();
    beat.eventIds.forEach((eventId, eventIndex) => {
      if (!events.has(eventId)) {
        issues.push(issue(`${path}.eventIds[${eventIndex}]`,
          `unknown trace event ${eventId}`));
      }
      if (localEvents.has(eventId)) {
        issues.push(issue(`${path}.eventIds[${eventIndex}]`,
          `duplicate event ${eventId} within beat`));
      }
      localEvents.add(eventId);
      selectedEventIds.push(eventId);
    });
    beat.focus.forEach((target, targetIndex) => validateFocusTarget({
      target,
      path: `${path}.focus[${targetIndex}]`,
      sourceIds,
      eventIds: new Set(events.keys()),
      valueIds,
      bindingIds,
      continuationIds,
      issues
    }));
  });

  const omissionIds = new Set<string>();
  score.omissions.forEach((omission, omissionIndex) => {
    const path = `omissions[${omissionIndex}]`;
    if (!events.has(omission.eventId)) {
      issues.push(issue(`${path}.eventId`,
        `unknown trace event ${omission.eventId}`));
    }
    if (omissionIds.has(omission.eventId)) {
      issues.push(issue(`${path}.eventId`,
        `duplicate omission ${omission.eventId}`));
    }
    omissionIds.add(omission.eventId);
    if (omission.note.trim().length === 0) {
      issues.push(issue(`${path}.note`, "omissions require an editorial note"));
    }
  });

  const selectedCounts = count(selectedEventIds);
  trace.events.forEach((event) => {
    const appearances = (selectedCounts.get(event.id) ?? 0) +
      (omissionIds.has(event.id) ? 1 : 0);
    if (appearances !== 1) {
      issues.push(issue("events",
        `event ${event.id} must be selected or omitted exactly once`));
    }
  });

  let priorTraceIndex = -1;
  selectedEventIds.forEach((eventId, scoreIndex) => {
    const traceIndex = eventIndices.get(eventId);
    if (traceIndex === undefined) return;
    if (traceIndex <= priorTraceIndex) {
      issues.push(issue(`selectedEvents[${scoreIndex}]`,
        `event ${eventId} reverses trace causal order`));
    }
    const event = events.get(eventId)!;
    event.causedByEventIds.forEach((causeId) => {
      const causeIndex = eventIndices.get(causeId);
      if (causeIndex === undefined || causeIndex >= traceIndex) {
        issues.push(issue(`selectedEvents[${scoreIndex}]`,
          `event ${eventId} violates causal predecessor ${causeId}`));
      }
    });
    priorTraceIndex = traceIndex;
  });
  return Object.freeze(issues);
}

function validateFocusTarget(input: {
  readonly target: KpSchemeScoreFocusTarget;
  readonly path: string;
  readonly sourceIds: ReadonlySet<string>;
  readonly eventIds: ReadonlySet<string>;
  readonly valueIds: ReadonlySet<string>;
  readonly bindingIds: ReadonlySet<string>;
  readonly continuationIds: ReadonlySet<string>;
  readonly issues: KpSchemeScoreIssue[];
}): void {
  const known = input.target.kind === "source-expression"
    ? input.sourceIds
    : input.target.kind === "event"
      ? input.eventIds
      : input.target.kind === "value"
        ? input.valueIds
        : input.target.kind === "binding"
          ? input.bindingIds
          : input.continuationIds;
  if (!known.has(input.target.id)) {
    input.issues.push(issue(`${input.path}.id`,
      `unknown ${input.target.kind} ${input.target.id}`));
  }
}

function freezeScore(input: KpSchemePedagogicalScore):
  KpSchemePedagogicalScore {
  return Object.freeze({
    ...input,
    beats: Object.freeze(input.beats.map((beat) => Object.freeze({
      ...beat,
      eventIds: Object.freeze([...beat.eventIds]),
      focus: Object.freeze(beat.focus.map((target) =>
        Object.freeze({ ...target })))
    }))),
    omissions: Object.freeze(input.omissions.map((omission) =>
      Object.freeze({ ...omission })))
  });
}

function count(values: readonly string[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

function issue(path: string, message: string): KpSchemeScoreIssue {
  return Object.freeze({ path, message });
}
